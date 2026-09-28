/**
 * DevHub 평가 화면을 axe 로 검사한 결과를 글·격자로. impact 막대의 값은 collector 가 검증한
 * impact node 수 그대로다. 접근성 점수나 성공률은 만들지 않는다.
 */
import {
  type AccessibilitySummary,
  type AuditTarget,
  AXE_IMPACTS,
} from '@berrypjh/observability-contracts';

import type { ViewState } from './status';

export const SOURCE_SCOPE_LABEL = 'DevHub 평가 화면 (axe · document)';
export const SOURCE_LABEL = 'axe-playwright (Node Playwright)';

export const OUTCOME_LABEL: Record<AccessibilitySummary['outcome'], string> = {
  completed: '완료',
  partial: '일부만',
  'scan-failed': '검사 실패',
  'not-run': '실행 안 함',
};

/** StatusLabel 의 장식 아이콘. 글이 상태를 말한다. */
export const OUTCOME_TONE: Record<AccessibilitySummary['outcome'], string> = {
  completed: 'passed',
  partial: 'timeout',
  'scan-failed': 'failed',
  'not-run': 'not-run',
};

export const TARGET_STATUS_LABEL: Record<AuditTarget['status'], string> = {
  scanned: '검사함',
  skipped: '건너뜀 (story context)',
  'scan-failed': '검사 실패',
  'not-run': '실행 안 함',
};

export const TARGET_TONE: Record<AuditTarget['status'], string> = {
  scanned: 'scanned',
  skipped: 'skipped',
  'scan-failed': 'failed',
  'not-run': 'not-run',
};

/** 색 없이 읽히는 impact. 첫 단어는 axe 원본 이름이다. */
export const IMPACT_LABEL: Record<(typeof AXE_IMPACTS)[number], string> = {
  critical: 'critical — 치명',
  serious: 'serious — 심각',
  moderate: 'moderate — 보통',
  minor: 'minor — 경미',
  unknown: 'unknown — impact 없음',
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
  if (!base) return { status: 'not-comparable', reasons: ['baseline 에 같은 출처가 없다'] };

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

/** 접근성 수집 명령. localhost audit 은 Node 가 DevHub 개발 서버의 평가 화면을 검사한다. */
export const AUDIT_COMMANDS = ['pnpm dev:devhub', 'pnpm quality --base-url=http://localhost:4400'];

/** 접근성 결과가 없는 실행. */
export const missingRunState = (runId: string, alternatives: string[] | null): ViewState => ({
  kind: 'unsupported',
  title: `${runId} 에는 접근성 결과가 없다`,
  cause:
    '접근성 수집(a11y profile)을 하지 않은 실행이다. 브라우저는 audit 명령을 실행하지 않는다.' +
    (alternatives && alternatives.length > 0
      ? ` 접근성 결과가 있는 실행: ${alternatives.join(', ')}`
      : ''),
  commands: AUDIT_COMMANDS,
});

/** 고른 대상을 검사하지 못했을 때. skip 은 story context 기록이라 해당 없음이다. */
export const unscannedState = (target: AuditTarget): ViewState => ({
  kind: target.status === 'skipped' ? 'not-applicable' : 'unsupported',
  title: `${target.label} — ${TARGET_STATUS_LABEL[target.status]}`,
  cause: target.reason ?? '이유가 없다',
  commands: [],
});
