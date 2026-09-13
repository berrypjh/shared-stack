import {
  type AccessibilitySummary,
  type AutomatedCheck,
  type DesignSystem,
  MANUAL_STATUSES,
  type ManualCheck,
  manualCheckSchema,
} from '@berrypjh/observability-contracts';

import { z } from 'zod';

import type { RunnerCase, RunnerReport } from '../adapters/report';

/**
 * axe 가 아닌 접근성 근거. 이미 만든 vitest report 의 case 결과와 사람의 관찰 기록만 읽는다 —
 * test 를 다시 실행하지 않고, accessible name 을 직접 계산하지 않는다.
 */

const IMPORTS = 'tmp/quality-lab/imports/a11y';

export const A11Y_IMPORTS = {
  storybook: `${IMPORTS}/storybook.jsonl`,
  designTokens: `${IMPORTS}/design-tokens.vitest.json`,
  reactUi: `${IMPORTS}/react-ui.vitest.json`,
  demoWeb: `${IMPORTS}/demo-web.vitest.json`,
  qualityLab: `${IMPORTS}/quality-lab.vitest.json`,
  manual: `${IMPORTS}/manual.json`,
} as const;

/**
 * 저장소 root 에서 실행한다. `--root` 로 project 를 준다 — react-ui config 는 root 를 두지 않아
 * 저장소 root 에서 돌리면 include 가 아무 파일도 찾지 못한다(0 test 확인). `--config` 는 그 root
 * 기준 경로이고, 상대 `--outputFile` 도 project root 기준으로 풀리므로 절대 경로로 준다.
 */
const reportCommand = (project: string, config: string, output: string) =>
  `pnpm exec vitest run --root ${project} --config ${config} --reporter=json --outputFile="$PWD/${output}"`;

export const REPORT_COMMANDS = {
  designTokens: reportCommand('libs/design-tokens', 'vitest.config.mts', A11Y_IMPORTS.designTokens),
  reactUi: reportCommand('libs/react-ui', 'vitest.config.mts', A11Y_IMPORTS.reactUi),
  demoWeb: reportCommand('apps/demo-web', 'vite.config.mts', A11Y_IMPORTS.demoWeb),
  qualityLab: reportCommand('apps/quality-lab', 'vite.config.mts', A11Y_IMPORTS.qualityLab),
} as const;

type Verdict = Pick<AutomatedCheck, 'status' | 'cases' | 'reason'>;

const casesIn = (report: RunnerReport, files: readonly string[]) =>
  report.cases.filter((testCase) =>
    files.some((file) => testCase.file === file || testCase.file.endsWith(`/${file}`)),
  );

const verdictOf = (cases: RunnerCase[]): Verdict => {
  if (cases.length === 0) {
    return { status: 'unknown', cases: null, reason: 'report 에 이 검사의 case 가 없습니다' };
  }
  const tally = {
    passed: cases.filter((testCase) => testCase.status === 'passed').length,
    failed: cases.filter((testCase) => testCase.status === 'failed').length,
    skipped: cases.filter((testCase) => testCase.status === 'skipped' || testCase.status === 'todo')
      .length,
  };
  if (tally.failed > 0) return { status: 'failed', cases: tally, reason: null };
  if (tally.passed > 0) return { status: 'passed', cases: tally, reason: null };
  return { status: 'unknown', cases: tally, reason: 'case 가 모두 skip·todo 입니다' };
};

const notRun = (reason: string): Verdict => ({ status: 'not-run', cases: null, reason });

const checkSummary = (
  id: 'token-contrast' | 'static-css' | 'ui-test',
  checks: AutomatedCheck[],
  limitations: string[],
): AccessibilitySummary => {
  const missing = checks.filter((check) => check.status === 'not-run');
  const outcome =
    missing.length === checks.length ? 'not-run' : missing.length > 0 ? 'partial' : 'completed';
  return {
    id: `a11y:${id}`,
    sourceScope: id,
    source: 'vitest-report',
    engine: null,
    tags: [],
    enabledRules: [],
    exclusions: [],
    index: null,
    startedAt: null,
    finishedAt: null,
    outcome,
    reason:
      outcome === 'completed'
        ? null
        : missing
            .map((check) => `${check.label}: ${check.reason}`)
            .join(' · ')
            .slice(0, 500),
    targets: [],
    checks,
    manual: [],
    limitations,
  };
};

const CONTRAST_TEST = 'libs/design-tokens/src/lib/contrast.test.ts';

/** guard 와 그 기준을 확인하는 case 제목. */
const GUARD_CASES: Record<
  string,
  { basis: NonNullable<AutomatedCheck['threshold']>['basis']; title: RegExp }
> = {
  'wcag-aa-text': { basis: 'wcag-2.1-aa-text', title: /4\.5:1/ },
  'wcag-aa-non-text': { basis: 'wcag-2.1-aa-non-text', title: /(^|[^.\d])3:1/ },
  'divider-visibility': { basis: 'project-visibility-guard', title: /stays visible/ },
};

export const tokenContrastSummary = ({
  guards,
  report,
}: {
  guards: DesignSystem['contrastGuards'];
  report: RunnerReport | null;
}): AccessibilitySummary => {
  const cases = report ? casesIn(report, [CONTRAST_TEST]) : [];
  const checks = guards.flatMap((guard): AutomatedCheck[] => {
    const spec = GUARD_CASES[guard.id];
    if (!spec) return [];
    const verdict = report
      ? verdictOf(cases.filter((testCase) => spec.title.test(testCase.title)))
      : notRun(
          `design-tokens vitest report 를 import 하지 않았습니다 — ${REPORT_COMMANDS.designTokens}`,
        );
    return [
      {
        id: `token-contrast:${guard.id}`,
        label: `${guard.label} — token pair`,
        kind: 'token-pair',
        ...verdict,
        threshold: { ratio: guard.ratio, basis: spec.basis },
        evidence: [
          { path: guard.source.path, line: guard.source.line },
          ...(guard.source.path === CONTRAST_TEST ? [] : [{ path: CONTRAST_TEST, line: null }]),
        ],
      },
    ];
  });
  return checkSummary('token-contrast', checks, [
    'token 색 쌍으로 계산한 test 결과입니다 — 실제 DOM 대비가 아닙니다 (렌더된 대비는 axe color-contrast 가 봅니다)',
    '1.2:1 은 프로젝트가 건 가시성 바닥이고 WCAG AA 기준이 아닙니다',
  ]);
};

const FORCED_COLORS_TEST = 'libs/react-ui/src/components/forcedColors.test.ts';

export const staticCssSummary = ({
  report,
}: {
  report: RunnerReport | null;
}): AccessibilitySummary =>
  checkSummary(
    'static-css',
    [
      {
        id: 'static-css:forced-colors',
        label: 'compiled CSS 의 forced-colors outline 규칙 (텍스트 검사)',
        kind: 'css-rule',
        threshold: null,
        evidence: [{ path: FORCED_COLORS_TEST, line: null }],
        ...(report
          ? verdictOf(casesIn(report, [FORCED_COLORS_TEST]))
          : notRun(
              `react-ui vitest report 를 import 하지 않았습니다 — ${REPORT_COMMANDS.reactUi}`,
            )),
      },
    ],
    [
      'sass 로 컴파일한 CSS 를 텍스트로 읽은 검사입니다 — Windows 실제 forced-colors 관찰이 아닙니다',
      '규칙이 있다는 것이지 포커스가 실제로 보인다는 관찰은 아닙니다',
    ],
  );

const UI_CHECKS = [
  {
    id: 'ui-test:story-aria-refs',
    label: 'story 소스의 aria id 참조 (텍스트 스캔)',
    kind: 'source-scan',
    report: 'reactUi',
    files: ['libs/react-ui/src/components/stories.aria.test.ts'],
  },
  {
    id: 'ui-test:demo-web-names',
    label: 'demo-web role·accessible name 단언 (Testing Library, jsdom)',
    kind: 'dom-test',
    report: 'demoWeb',
    files: ['apps/demo-web/src/app/app.spec.tsx', 'apps/demo-web/src/app/pages/pages.spec.tsx'],
  },
  {
    id: 'ui-test:quality-lab-shell',
    label: 'quality-lab shell landmark·이름·포커스 단언 (Testing Library, jsdom)',
    kind: 'dom-test',
    report: 'qualityLab',
    files: ['apps/quality-lab/src/app/app.spec.tsx'],
  },
] as const;

export const uiTestSummary = (
  reports: Record<'reactUi' | 'demoWeb' | 'qualityLab', RunnerReport | null>,
): AccessibilitySummary =>
  checkSummary(
    'ui-test',
    UI_CHECKS.map((spec) => {
      const report = reports[spec.report];
      return {
        id: spec.id,
        label: spec.label,
        kind: spec.kind,
        threshold: null,
        evidence: spec.files.map((path) => ({ path, line: null })),
        ...(report
          ? verdictOf(casesIn(report, spec.files))
          : notRun(
              `${spec.report} vitest report 를 import 하지 않았습니다 — ${REPORT_COMMANDS[spec.report]}`,
            )),
      };
    }),
    [
      'accessible name 은 Testing Library 가 계산한 결과입니다 — 이 수집기는 이름을 다시 계산하지 않습니다',
      'jsdom 은 layout·실제 포커스 링을 그리지 않습니다',
    ],
  );

export const MANUAL_CHECKLIST = [
  {
    id: 'keyboard-tab-order',
    area: 'keyboard',
    label: 'Tab 순서가 화면 순서와 맞고 모든 컨트롤에 닿는다',
  },
  { id: 'skip-link', area: 'keyboard', label: 'SkipLink 로 본문에 도착하고 포커스가 옮겨간다' },
  { id: 'focus-visible', area: 'focus', label: 'light·dark 에서 포커스 표시가 보인다' },
  {
    id: 'screen-reader',
    area: 'screen-reader',
    label: '스크린리더가 표 caption·행 머리·상태 알림을 읽는다',
  },
  { id: 'reading-order', area: 'order', label: '읽기 순서가 시각 순서와 맞는다' },
  {
    id: 'complex-contrast',
    area: 'contrast',
    label: '겹친 배경·차트 위 글자 대비를 눈으로 확인한다',
  },
  {
    id: 'forced-colors-windows',
    area: 'forced-colors',
    label: 'Windows 고대비(forced-colors)에서 상태·포커스가 남는다',
  },
  { id: 'reduced-motion', area: 'motion', label: '동작 줄이기 설정에서 전환이 멈춘다' },
] as const satisfies readonly Pick<ManualCheck, 'id' | 'area' | 'label'>[];

export class ManualImportError extends Error {}

const manualRecordsSchema = z.array(
  z.strictObject({
    id: z.string(),
    status: z.enum(MANUAL_STATUSES),
    note: z.string().nullable().optional(),
    checkedAt: z.string().nullable().optional(),
    environment: z.string().nullable().optional(),
  }),
);

/** 사람이 적은 관찰. 기록이 없는 항목은 not-run 이다 — 통과가 아니다. */
export const manualSummary = ({ text }: { text: string | null }): AccessibilitySummary => {
  const records = new Map<string, z.infer<typeof manualRecordsSchema>[number]>();
  if (text !== null) {
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      throw new ManualImportError('manual 기록이 JSON 이 아닙니다');
    }
    const parsed = manualRecordsSchema.safeParse(value);
    if (!parsed.success) throw new ManualImportError('manual 기록 모양이 다릅니다');
    for (const record of parsed.data) {
      if (!MANUAL_CHECKLIST.some((item) => item.id === record.id)) {
        throw new ManualImportError(`checklist 에 없는 항목입니다: ${record.id}`);
      }
      records.set(record.id, record);
    }
  }

  const manual = MANUAL_CHECKLIST.map((item) => {
    const record = records.get(item.id);
    const candidate = {
      ...item,
      status: record?.status ?? 'not-run',
      note: record?.note ?? null,
      checkedAt: record?.checkedAt ?? null,
      environment: record?.environment ?? null,
    };
    const checked = manualCheckSchema.safeParse(candidate);
    if (!checked.success) {
      throw new ManualImportError(
        `${item.id}: 관찰은 checkedAt·environment 가 필요하고 not-run 은 둘 다 없어야 합니다`,
      );
    }
    return checked.data;
  });

  const pending = manual.filter((item) => item.status === 'not-run').length;
  const outcome = pending === manual.length ? 'not-run' : pending > 0 ? 'partial' : 'completed';
  return {
    id: 'a11y:manual',
    sourceScope: 'manual',
    source: 'manual-record',
    engine: null,
    tags: [],
    enabledRules: [],
    exclusions: [],
    index: null,
    startedAt: null,
    finishedAt: null,
    outcome,
    reason:
      outcome === 'completed'
        ? null
        : outcome === 'not-run'
          ? `수동 확인 기록이 없습니다 — ${A11Y_IMPORTS.manual} 에 관찰을 적습니다`
          : `${manual.length}개 중 ${pending}개 항목을 아직 확인하지 않았습니다`,
    targets: [],
    checks: [],
    manual,
    limitations: ['사람의 관찰 기록이고 자동 측정값이 아닙니다', 'not-run 은 통과가 아닙니다'],
  };
};
