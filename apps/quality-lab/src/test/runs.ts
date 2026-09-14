/** test 전용 run 모양. 실제 수집 결과와 같은 계약으로 만들고 요약도 계약 함수로 만든다. */
import { publicRunArtifactSchema, summarizeRun } from '@berrypjh/observability-contracts';

import { bundle, contextMeasurement, HASH, publicArtifact } from './fixtures';

type Overrides = Record<string, unknown>;

const counted = (value: number, provenance = 'runner-report') => ({
  value,
  provenance,
  reason: null,
});

type Case = {
  id: string;
  file: string;
  fullName: string;
  status: string;
  attempts: ReturnType<typeof counted>;
};

export const testCase = (project: string, overrides: Overrides = {}): Case => {
  const merged = {
    file: 'libs/react-ui/src/Button.test.tsx',
    fullName: 'Button renders',
    status: 'passed',
    attempts: counted(1, 'derived-from-report'),
    durationMs: 1.5,
    layer: 'unknown',
    layerEvidence: null,
    ...overrides,
  } as Omit<Case, 'id'> & Overrides;
  return { ...merged, id: `${project}::${merged.file}::${merged.fullName}` };
};

/** case 배열에서 count 를 만든다. source 파일 수는 scan 이라 case 와 다르게 둔다. */
export const testSummary = (project: string, cases: Case[], sourceFiles = 4) => {
  const count = (status: string) => cases.filter((item) => item.status === status).length;
  const failed = count('failed');
  const commandId = `test.${project.replace('@berrypjh/', '')}`;
  const attempts = cases.reduce((sum, item) => sum + item.attempts.value, 0);
  return {
    sourceId: `vitest:${project}`,
    area: project === 'tools' ? 'tools' : 'nx-project',
    project,
    runner: 'vitest',
    runnerVersion: '4.0.17',
    execution: {
      status: failed ? 'failed' : 'completed',
      commandId,
      exitCode: failed ? 1 : 0,
      timeoutMs: 600000,
      excerpt: null,
      reason: null,
    },
    cache: 'fresh',
    report: {
      status: 'parsed',
      format: 'vitest-json',
      path: `raw/tests/${commandId}.json`,
      sha256: HASH,
      reason: null,
    },
    scope: { include: ['src/**/*.test.tsx'], includeHash: HASH, selectedProjects: [project] },
    counts: {
      sourceFiles: counted(sourceFiles, 'source-scan'),
      reportedFiles: counted(3),
      suites: counted(2),
      cases: counted(cases.length),
      passed: counted(count('passed')),
      failed: counted(failed),
      skipped: counted(count('skipped')),
      todo: counted(count('todo')),
      retriedCases: counted(0, 'derived-from-report'),
      attempts: counted(attempts, 'derived-from-report'),
    },
    durations: { wallMs: counted(5230, 'collector-clock'), caseSumMs: counted(4.5) },
    coverage: { status: 'not-measured', reason: 'coverage 는 요청하지 않았다' },
    outcome: failed ? 'fail' : 'pass',
    outcomeReason: failed
      ? `${cases.length} case 중 ${failed} 실패`
      : `${cases.length} case 중 실패 없음`,
    cases,
  };
};

export const TYPECHECK_EXCERPT =
  "src/app/app.tsx(3,1): error TS2305: Module has no exported member 'Missing'.";

export const check = (id: string, kind: string, scope: string, status: string) => ({
  id,
  domain: 'verification',
  scope,
  kind,
  status,
  availability: status === 'not-run' ? 'not-run' : 'available',
  outcome: status === 'passed' ? 'pass' : status === 'failed' ? 'fail' : null,
  exitCode: status === 'passed' ? 0 : status === 'failed' ? 2 : null,
  durationMs: status === 'not-run' ? null : 1200,
  reason: status === 'not-run' ? '--only-imports: import 한 report 가 없어 실행하지 않았다' : null,
  evidence: [
    {
      source: 'command',
      commandId: id,
      exitCode: status === 'passed' ? 0 : status === 'failed' ? 2 : null,
      excerpt: status === 'failed' ? TYPECHECK_EXCERPT : null,
    },
  ],
});

/** core profile run — lint 통과·typecheck 실패·build 미실행·tools 통과, react-ui 에 실패 case 1. */
export const qualityArtifact = (runId = 'run-quality', metadata: Overrides = {}) => ({
  ...publicArtifact(runId, { profile: 'core', ...metadata }),
  observations: [
    check('lint.quality-lab', 'lint', '@berrypjh/quality-lab', 'passed'),
    check('typecheck.quality-lab', 'typecheck', '@berrypjh/quality-lab', 'failed'),
    check('build.observability-contracts', 'build', '@berrypjh/observability-contracts', 'not-run'),
    {
      id: 'test.tools',
      domain: 'test',
      unit: 'ratio',
      scope: 'tools',
      availability: 'available',
      value: 1,
      denominator: 2,
      outcome: 'pass',
      reason: null,
      evidence: [],
    },
  ],
  tests: [
    testSummary('@berrypjh/react-ui', [
      testCase('@berrypjh/react-ui', { fullName: 'Button renders' }),
      testCase('@berrypjh/react-ui', {
        fullName: 'Button loading',
        file: 'libs/react-ui/src/Loading.test.tsx',
      }),
      testCase('@berrypjh/react-ui', {
        fullName: 'Button focus ring',
        status: 'failed',
        attempts: counted(2, 'derived-from-report'),
      }),
    ]),
    testSummary(
      'tools',
      [
        testCase('tools', { file: 'tools/lib/a.test.ts', fullName: 'tools works' }),
        testCase('tools', { file: 'tools/lib/a.test.ts', fullName: 'tools again' }),
      ],
      1,
    ),
  ],
  bundles: [bundle()],
  contexts: [contextMeasurement()],
});

const surface = (name: string, root: string, overrides: Overrides = {}) => ({
  name,
  path: root,
  private: false,
  sourceManifest: {
    path: `${root}/package.json`,
    exports: [
      { subpath: '.', conditions: ['types'], target: './dist/index.d.ts' },
      { subpath: './tokens', conditions: [], target: './dist/tokens.json' },
    ],
    bin: [],
  },
  emitted: [
    { subpath: '.', conditions: ['types'], target: './dist/index.d.ts', status: 'present' },
    { subpath: './tokens', conditions: [], target: './dist/tokens.json', status: 'present' },
  ],
  emittedBin: [],
  build: 'complete',
  emittedManifest: null,
  tokensCopy: {
    path: `${root}/dist/tokens.json`,
    status: 'present',
    identicalToDesignTokens: true,
  },
  catalog: {
    path: `${root}/dist/llm-catalog.json`,
    status: 'valid',
    reason: null,
    schemaVersion: 1,
    platform: 'web',
    symbolCount: 217,
    deprecated: ['createTheme'],
    propsUnion: [],
    typeOmittedSymbols: [],
    typeOmittedProps: [],
    valueCounts: [],
    regenerated: 'identical',
    regeneratedReason: null,
  },
  tests: [
    {
      path: 'tools/lib/package-boundary.test.ts',
      line: 273,
      title: '%s 선언에 private import 가 없다',
      evidenceKind: 'source-assertion',
      execution: 'not-run',
    },
  ],
  ...overrides,
});

/** static profile run — react-native-ui 는 산출물 일부 누락, react-ui 는 catalog drift. */
export const designArtifact = (runId = 'run-design') => ({
  ...publicArtifact(runId),
  packageSurfaces: [
    surface('@berrypjh/react-native-ui', 'libs/react-native-ui', {
      emitted: [
        { subpath: '.', conditions: ['types'], target: './dist/index.d.ts', status: 'present' },
        { subpath: './tokens', conditions: [], target: './dist/tokens.json', status: 'missing' },
      ],
      build: 'partial',
      catalog: {
        ...surface('x', 'libs/x').catalog,
        path: 'libs/react-native-ui/dist/llm-catalog.json',
        platform: 'react-native',
        symbolCount: 288,
        deprecated: ['cx', 'Web'],
      },
    }),
    surface('@berrypjh/react-ui', 'libs/react-ui', {
      catalog: { ...surface('x', 'libs/x').catalog, regenerated: 'differs' },
    }),
  ],
});

/** 공개 export 한 벌. `summaries: false` 는 요약 이전에 export 한 index 다. */
export const publicFiles = (
  artifacts: { metadata: { runId: string } }[],
  { summaries = true }: { summaries?: boolean } = {},
) => {
  const files: Record<string, unknown> = {
    '/observability/index.json': {
      version: 1,
      runs: artifacts.map(({ metadata: { runId } }) => ({
        id: runId,
        path: `runs/${runId}.json`,
        ...(summaries ? { summary: `runs/${runId}.summary.json` } : {}),
      })),
    },
  };
  for (const artifact of artifacts) {
    const { runId } = artifact.metadata;
    files[`/observability/runs/${runId}.json`] = artifact;
    if (summaries) {
      files[`/observability/runs/${runId}.summary.json`] = summarizeRun(
        publicRunArtifactSchema.parse(artifact),
      );
    }
  }
  return files;
};
