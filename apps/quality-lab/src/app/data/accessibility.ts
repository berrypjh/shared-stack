/**
 * 접근성 결과를 글·격자로. 출처마다 뜻이 달라 합치지 않고, 점수나 성공률을 만들지 않는다.
 * impact 막대의 값은 collector 가 검증한 impact node 수 그대로다.
 */
import {
  type AccessibilitySummary,
  type AuditTarget,
  type AutomatedCheck,
  AXE_IMPACTS,
  type ManualCheck,
} from '@berrypjh/observability-contracts';

type Scope = AccessibilitySummary['sourceScope'];

export const SOURCE_SCOPE_LABEL: Record<Scope, string> = {
  storybook: 'Storybook story (axe · #storybook-root)',
  'quality-lab': 'quality-lab 화면 (axe · document)',
  'token-contrast': 'token 색 쌍 test',
  'static-css': 'compiled CSS 텍스트 검사',
  'ui-test': 'UI test (Testing Library)',
  manual: '수동 확인',
};

/** Static/Test Results 와 Runtime Audit 에 보이는 출처. manual 은 두 보기 밖에 따로 둔다. */
export const STATIC_SCOPES = ['storybook', 'token-contrast', 'static-css', 'ui-test'] as const;
export const RUNTIME_SCOPES = ['quality-lab'] as const;

export const SOURCE_LABEL: Record<AccessibilitySummary['source'], string> = {
  'axe-playwright': 'axe-playwright (Node Playwright)',
  'storybook-test-runner': 'Storybook test-runner 기록',
  'vitest-report': 'vitest JSON report',
  'manual-record': '사람의 관찰 기록',
};

export const OUTCOME_LABEL: Record<AccessibilitySummary['outcome'], string> = {
  completed: '완료',
  partial: '일부만',
  'scan-failed': '검사 실패',
  'not-run': '실행 안 함',
};

export const TARGET_STATUS_LABEL: Record<AuditTarget['status'], string> = {
  scanned: '검사함',
  skipped: '건너뜀 (story context)',
  'scan-failed': '검사 실패',
  'not-run': '실행 안 함',
};

/** StatusLabel 의 장식 아이콘. 글이 상태를 말한다. */
export const TARGET_TONE: Record<AuditTarget['status'], string> = {
  scanned: 'scanned',
  skipped: 'skipped',
  'scan-failed': 'failed',
  'not-run': 'not-run',
};

export const CHECK_STATUS_LABEL: Record<AutomatedCheck['status'], string> = {
  passed: '통과',
  failed: '실패',
  unknown: '판정 불가',
  'not-run': '실행 안 함',
};

export const CHECK_TONE: Record<AutomatedCheck['status'], string> = {
  passed: 'passed',
  failed: 'failed',
  unknown: 'unsupported',
  'not-run': 'not-run',
};

export const CHECK_KIND_LABEL: Record<AutomatedCheck['kind'], string> = {
  'token-pair': 'token 색 쌍',
  'css-rule': 'CSS 규칙 텍스트',
  'source-scan': '소스 텍스트 스캔',
  'dom-test': 'DOM test (jsdom)',
};

/** 색 없이 읽히는 impact. 첫 단어는 axe 원본 이름이다. */
export const IMPACT_LABEL: Record<(typeof AXE_IMPACTS)[number], string> = {
  critical: 'critical — 치명',
  serious: 'serious — 심각',
  moderate: 'moderate — 보통',
  minor: 'minor — 경미',
  unknown: 'unknown — impact 없음',
};

const BASIS_LABEL: Record<NonNullable<AutomatedCheck['threshold']>['basis'], string> = {
  'wcag-2.1-aa-text': 'WCAG 2.1 AA 텍스트',
  'wcag-2.1-aa-non-text': 'WCAG 2.1 AA 비텍스트',
  'project-visibility-guard': '프로젝트 가시성 가드 (WCAG 기준 아님)',
};

export const thresholdText = (threshold: AutomatedCheck['threshold']) =>
  threshold ? `${threshold.ratio}:1 · ${BASIS_LABEL[threshold.basis]}` : '기준 없음';

export const casesText = (cases: AutomatedCheck['cases']) =>
  cases ? `통과 ${cases.passed} · 실패 ${cases.failed} · skip ${cases.skipped}` : 'case 없음';

const MANUAL_STATUS_LABEL: Record<ManualCheck['status'], string> = {
  'observed-ok': '문제 없음으로 관찰',
  'observed-issue': '문제 관찰',
  'not-run': '확인 안 함 (통과 아님)',
};

export const manualStatusText = (status: ManualCheck['status']) => MANUAL_STATUS_LABEL[status];

export const MANUAL_AREA_LABEL: Record<ManualCheck['area'], string> = {
  keyboard: '키보드',
  focus: '포커스',
  'screen-reader': '스크린리더',
  order: '읽기 순서',
  contrast: '복합 대비',
  'forced-colors': 'forced-colors',
  motion: '동작',
};

/** 검사한 target 의 impact 별 위반 node. 모두 0 이어도 축은 1 이다 — 실제 0 을 그린다. */
export const impactBars = (target: AuditTarget) => {
  const nodes = target.impactNodes;
  if (!nodes) return null;
  const bars = AXE_IMPACTS.map((impact) => ({ impact, value: nodes[impact] }));
  return { scale: Math.max(1, ...bars.map((bar) => bar.value)), bars };
};

export type TargetComparison =
  | { status: 'no-baseline' }
  | { status: 'not-comparable'; reasons: string[] }
  | {
      status: 'compared';
      rules: { id: string; current: number; base: number; delta: number }[];
    };

const sameList = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length &&
  [...left].sort().every((item, i) => item === [...right].sort()[i]);

/**
 * 같은 출처·engine·tag·enabled rule·scope 이고 두 target 모두 검사했을 때만 rule 별 위반 node 를
 * 비교한다. 한쪽에 없는 rule 은 같은 규칙 묶음으로 검사한 결과라 0 node 다.
 */
export const compareTarget = (
  current: AccessibilitySummary,
  targetId: string,
  baseline: AccessibilitySummary[] | null,
): TargetComparison => {
  if (baseline === null) return { status: 'no-baseline' };
  const base = baseline.find((summary) => summary.sourceScope === current.sourceScope);
  if (!base) return { status: 'not-comparable', reasons: ['baseline 에 같은 출처가 없습니다'] };

  const reasons: string[] = [];
  if (current.engine?.version !== base.engine?.version) reasons.push('engine differs');
  if (!sameList(current.tags, base.tags)) reasons.push('tags differ');
  if (!sameList(current.enabledRules, base.enabledRules)) reasons.push('enabled rules differ');
  const now = current.targets.find((target) => target.id === targetId);
  const before = base.targets.find((target) => target.id === targetId);
  if (!now || !before) {
    reasons.push('target missing');
  } else {
    if (now.scope !== before.scope) reasons.push('scope differs');
    if (now.status !== 'scanned' || before.status !== 'scanned') reasons.push('target not scanned');
  }
  if (reasons.length > 0 || !now || !before) return { status: 'not-comparable', reasons };

  const nodesOf = (target: AuditTarget, id: string) =>
    target.violations.find((rule) => rule.id === id)?.nodeCount ?? 0;
  const ids = [...new Set([...now.violations, ...before.violations].map((rule) => rule.id))].sort();
  return {
    status: 'compared',
    rules: ids.map((id) => {
      const currentNodes = nodesOf(now, id);
      const baseNodes = nodesOf(before, id);
      return { id, current: currentNodes, base: baseNodes, delta: currentNodes - baseNodes };
    }),
  };
};
