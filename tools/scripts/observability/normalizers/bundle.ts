import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

import {
  type BundleMeasurement,
  bundleMeasurementSchema,
  sanitizeExcerpt,
} from '@berrypjh/observability-contracts';

import type { SizeLimitCase, SizeLimitReport } from '../adapters/size-limit';
import type { TreeshakeReport } from '../adapters/treeshake';

/** report 를 얻지 못한 이유. `not-run` 은 수집기가 일부러 실행하지 않은 것이다. */
export type ReportFailure = {
  status: 'missing' | 'corrupt' | 'invalid' | 'not-run';
  message: string;
};

const SIZE_LIMIT_PRESET = '@size-limit/preset-small-lib';
const TREESHAKE_FLAGS = [
  '--bundle',
  '--minify',
  '--format=esm',
  '--tree-shaking=true',
  '--platform=neutral',
];

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'case';
const reasonOf = (message: string) => sanitizeExcerpt(message.split('\n')[0] ?? message, 300);

/** size-limit 이 쓰는 `bytes-iec` 를 그대로 쓴다 — 한도 단위 해석을 따로 구현하지 않는다. */
export const loadLimitParser = (): ((limit: string) => number | null) => {
  const sizeLimitRequire = createRequire(
    createRequire(import.meta.url).resolve('size-limit/package.json'),
  );
  const bytes = sizeLimitRequire('bytes-iec') as { parse: (value: string) => number | null };
  return (limit) => bytes.parse(limit);
};

/** `'@berrypjh/react-ui — cx only'` → package 와 case 이름. */
const splitCaseName = (name: string) => {
  const [head, ...rest] = name.split(' — ');
  return head.startsWith('@') && rest.length > 0
    ? { pkg: head, label: rest.join(' — ') }
    : { pkg: 'workspace', label: name };
};

const FAILURE_AVAILABILITY = {
  missing: 'unavailable',
  'not-run': 'not-run',
  corrupt: 'invalid',
  invalid: 'invalid',
} as const;

type SizeResult =
  | { availability: 'available'; value: number; toolPassed: boolean | null }
  | { availability: 'unavailable' | 'invalid' | 'not-run'; reason: string };

const sizeResultOf = (
  sizeCase: SizeLimitCase,
  report: SizeLimitReport | ReportFailure,
  limitBytes: number | null,
): SizeResult => {
  if (report.status === 'error') {
    return {
      availability: 'unavailable',
      reason: `size-limit 실행 실패: ${reasonOf(report.message)}`,
    };
  }
  if (report.status !== 'results') {
    return { availability: FAILURE_AVAILABILITY[report.status], reason: reasonOf(report.message) };
  }
  if (sizeCase.limit !== null && limitBytes === null) {
    return { availability: 'invalid', reason: `한도 ${sizeCase.limit} 를 해석할 수 없다` };
  }
  const entry = report.entries.find((candidate) => candidate.name === sizeCase.name);
  if (!entry)
    return { availability: 'unavailable', reason: 'size-limit report 에 이 case 가 없다' };
  if (entry.size === null)
    return { availability: 'unavailable', reason: 'size-limit 이 크기를 보고하지 않았다' };
  if (entry.size < 0)
    return { availability: 'invalid', reason: `size-limit 이 음수 크기 ${entry.size} 를 보고했다` };
  if (limitBytes !== null && entry.sizeLimit !== null && entry.sizeLimit !== limitBytes) {
    return {
      availability: 'invalid',
      reason: `한도 해석이 다르다: config ${sizeCase.limit} → ${limitBytes}, size-limit ${entry.sizeLimit}`,
    };
  }
  return { availability: 'available', value: entry.size, toolPassed: entry.passed };
};

const budgetOf = (sizeCase: SizeLimitCase, limitBytes: number | null, result: SizeResult) => {
  if (sizeCase.limit === null || limitBytes === null) return null;
  if (result.availability !== 'available') {
    return {
      limitBytes,
      limitSource: sizeCase.limit,
      headroomBytes: null,
      outcome: null,
      toolPassed: null,
    };
  }
  return {
    limitBytes,
    limitSource: sizeCase.limit,
    headroomBytes: limitBytes - result.value,
    outcome: result.value <= limitBytes ? 'pass' : 'fail',
    toolPassed: result.toolPassed,
  };
};

type SizeLimitInput = {
  cases: SizeLimitCase[];
  report: SizeLimitReport | ReportFailure;
  toolVersion: string;
  parseLimit: (limit: string) => number | null;
};

/**
 * `.size-limit.cjs` case 와 `size-limit --json` 결과를 이름으로 맞춘다.
 * 값은 size-limit 의미 그대로(압축 + 빈 프로젝트 상수 차감)이고, headroom 은 같은 측정의 limit − current 다.
 */
export const normalizeSizeLimit = ({ cases, report, toolVersion, parseLimit }: SizeLimitInput) => {
  const names = new Set(cases.map((sizeCase) => sizeCase.name));
  const measurements: BundleMeasurement[] = cases.map((sizeCase) => {
    const limitBytes = sizeCase.limit === null ? null : parseLimit(sizeCase.limit);
    const result = sizeResultOf(sizeCase, report, limitBytes);
    const budget = budgetOf(sizeCase, limitBytes, result);
    const { pkg, label } = splitCaseName(sizeCase.name);
    const importSpec = sizeCase.importSpec ?? '(file)';
    return bundleMeasurementSchema.parse({
      id: `bundle.size-limit.${slug(pkg.replace(/^@[^/]+\//, ''))}.${slug(label)}`,
      caseName: sizeCase.name,
      role: budget ? 'budget' : 'diagnostic',
      method: 'size-limit',
      tool: { name: 'size-limit', version: toolVersion },
      package: pkg,
      entry: sizeCase.path,
      importSpec,
      externals: sizeCase.externals,
      target: sizeCase.target,
      compression: sizeCase.compression,
      adjustment: 'size-limit-empty-project-subtracted',
      unit: 'bytes',
      configHash: hash({
        method: 'size-limit',
        preset: SIZE_LIMIT_PRESET,
        path: sizeCase.path,
        importSpec,
        externals: [...sizeCase.externals].sort(),
        target: sizeCase.target,
        compression: sizeCase.compression,
        limit: sizeCase.limit,
      }),
      ...(result.availability === 'available'
        ? { availability: 'available', value: result.value, reason: null }
        : { availability: result.availability, value: null, reason: result.reason }),
      budget,
    });
  });
  const unmatchedEntries =
    report.status === 'results'
      ? report.entries.filter((entry) => !names.has(entry.name)).map((entry) => entry.name)
      : [];
  return { measurements, unmatchedEntries };
};

type TreeshakeInput = { report: TreeshakeReport; toolVersion: string };

/**
 * treeshake scenario 하나를 raw(무압축)·gzip 두 진단 값으로. 둘을 한 값으로 섞지 않고
 * size-limit 값과도 섞지 않는다 (방법·보정이 다르다). 한도는 없다.
 */
export const normalizeTreeshake = ({ report, toolVersion }: TreeshakeInput): BundleMeasurement[] =>
  report.scenarios.flatMap((scenario) =>
    (['none', 'gzip'] as const).map((compression) => {
      const importSpec =
        scenario.kind === 'all-exports' ? '*' : `{ ${scenario.symbols.join(', ')} }`;
      const value = compression === 'none' ? scenario.raw : scenario.gzip;
      return bundleMeasurementSchema.parse({
        id: `bundle.treeshake.${slug(report.target)}.${slug(scenario.name)}.${compression === 'none' ? 'raw' : 'gzip'}`,
        caseName: scenario.name,
        role: 'diagnostic',
        method: 'treeshake-esbuild',
        tool: { name: 'esbuild', version: toolVersion },
        package: report.pkg,
        entry: report.pkg,
        importSpec,
        externals: report.external,
        target: 'esbuild-default',
        compression,
        adjustment: 'none',
        unit: 'bytes',
        configHash: hash({
          method: 'treeshake-esbuild',
          pkg: report.pkg,
          importSpec,
          externals: [...report.external].sort(),
          compression,
          flags: TREESHAKE_FLAGS,
        }),
        ...(value === null
          ? {
              availability: 'unavailable',
              value: null,
              reason: scenario.error
                ? `esbuild 번들 실패: ${reasonOf(scenario.error)}`
                : 'treeshake 가 값을 보고하지 않았다',
            }
          : { availability: 'available', value, reason: null }),
        budget: null,
      });
    }),
  );
