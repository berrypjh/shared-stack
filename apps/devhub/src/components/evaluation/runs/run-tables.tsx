import { DataTable } from '@berrypjh/devhub-ui';
import type {
  BundleMeasurement,
  ContextMeasurement,
  EvalRun,
  Observation,
} from '@berrypjh/observability-contracts';

import {
  availabilityLabel,
  bundleRoleLabel,
  countText,
  formatBytes,
  formatInteger,
  headroomText,
  observationValueText,
} from '@/lib/evaluation/format';
import { DOMAIN_LABEL, EXECUTOR_LABEL, NOTICE_LABEL, OUTCOME_LABEL } from '@/lib/evaluation/labels';

import { Mono } from '../mono';

/** 실행 상세의 영역별 표. 값이 없는 행도 지우지 않고 상태 · 이유와 함께 남긴다. */

const METHOD_LABEL: Record<string, string> = {
  'size-limit': 'size-limit (빈 프로젝트 상수 차감)',
  'treeshake-esbuild': 'esbuild 단독 번들',
};
const COMPRESSION_LABEL: Record<string, string> = {
  brotli: 'brotli',
  gzip: 'gzip',
  none: '무압축',
};
const SCOPE_LABEL: Record<string, string> = {
  'package-scenario': '패키지 시나리오',
  'variant-initial': 'variant 초기',
  'variant-routed': 'variant routed',
  'agent-input': 'agent 입력',
};

const withReason = (label: string, reason: string | null) =>
  reason ? `${label} — ${reason}` : label;

const observationStatus = (observation: Observation) =>
  `${availabilityLabel(observation.availability)}${observation.outcome ? ` · ${OUTCOME_LABEL[observation.outcome]}` : ''}`;

export const ObservationTable = ({ observations }: { observations: Observation[] }) => (
  <DataTable caption="관측 항목" headers={['항목', '영역', '상태', '값·이유']}>
    {observations.map((observation) => (
      <tr key={observation.id}>
        <th scope="row">
          <Mono>{observation.id}</Mono>
        </th>
        <td>{DOMAIN_LABEL[observation.domain]}</td>
        <td>{observationStatus(observation)}</td>
        <td>{observationValueText(observation)}</td>
      </tr>
    ))}
  </DataTable>
);

/** 막대는 장식이다 — 같은 정보를 옆 칸의 글이 준다. 값이 없으면 빈 막대다. */
const BudgetBar = ({ value, limit }: { value: number | null; limit: number }) => {
  const ratio = value === null || limit === 0 ? 0 : Math.min(1, value / limit);
  return (
    <div
      aria-hidden
      className="h-[8px] w-[96px] overflow-hidden rounded-sm border border-stroke-default bg-background-default"
    >
      <div
        data-testid="budget-bar-fill"
        className={
          value !== null && value > limit ? 'h-full bg-error-er600' : 'h-full bg-success-su600'
        }
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
};

export const BundleTable = ({ bundles }: { bundles: BundleMeasurement[] }) => (
  <DataTable
    caption="bundle 측정"
    headers={['case', '역할', '방법', '압축', '현재', '한도', '여유', '막대']}
  >
    {bundles.map((measurement) => (
      <tr key={measurement.id}>
        <th scope="row">{measurement.caseName}</th>
        <td>{bundleRoleLabel(measurement.role)}</td>
        <td>{METHOD_LABEL[measurement.method]}</td>
        <td>{COMPRESSION_LABEL[measurement.compression]}</td>
        <td>
          {measurement.value === null
            ? withReason(availabilityLabel(measurement.availability), measurement.reason)
            : formatBytes(measurement.value)}
        </td>
        <td>
          {measurement.budget
            ? `${formatBytes(measurement.budget.limitBytes)} (${measurement.budget.limitSource})`
            : '한도 없음'}
        </td>
        <td>
          {measurement.budget
            ? headroomText(measurement.budget.headroomBytes)
            : '해당 없음 (보고 전용)'}
        </td>
        <td>
          {measurement.budget ? (
            <BudgetBar value={measurement.value} limit={measurement.budget.limitBytes} />
          ) : (
            '한도 없음'
          )}
        </td>
      </tr>
    ))}
  </DataTable>
);

export const ContextTable = ({ contexts }: { contexts: ContextMeasurement[] }) => (
  <DataTable
    caption="context 측정"
    headers={['scope', '대상', 'tokenizer', 'tokens', '파일', '누락 입력']}
  >
    {contexts.map((measurement) => (
      <tr key={measurement.id}>
        <th scope="row">{SCOPE_LABEL[measurement.scope]}</th>
        <td>
          <Mono>{measurement.subject}</Mono>
        </td>
        <td>
          {measurement.provider} · {measurement.tokenModel} ·{' '}
          {measurement.tokenizerVersion ??
            withReason('버전 모름', measurement.tokenizerVersionReason)}
        </td>
        <td>
          {measurement.tokens === null
            ? countText({ value: null, reason: measurement.reason })
            : `${formatInteger(measurement.tokens)} tokens`}
        </td>
        <td>{formatInteger(measurement.files.length)}</td>
        <td>
          {measurement.missingPaths.length > 0 ? measurement.missingPaths.join(', ') : '없음'}
        </td>
      </tr>
    ))}
  </DataTable>
);

const EVAL_PARTS = ['summary', 'traces', 'routing', 'context'] as const;

/** eval import 상태만. 성공률 표는 AI 평가 화면이 원본 분자 · 분모와 함께 보여 준다. */
export const EvalTable = ({ evals }: { evals: EvalRun[] }) => (
  <DataTable
    caption="eval import"
    headers={['source', 'executor', ...EVAL_PARTS, 'notice', 'trace 수']}
  >
    {evals.map((evalRun) => (
      <tr key={evalRun.sourceId}>
        <th scope="row">
          <Mono>{evalRun.sourceId}</Mono>
        </th>
        <td>
          {evalRun.executorClass ? EXECUTOR_LABEL[evalRun.executorClass] : 'executor 결과 없음'}
        </td>
        {EVAL_PARTS.map((part) => (
          <td key={part}>{withReason(evalRun.import[part].status, evalRun.import[part].reason)}</td>
        ))}
        <td>
          {evalRun.notices.length > 0
            ? evalRun.notices.map((notice) => NOTICE_LABEL[notice.code]).join(' · ')
            : '없음'}
        </td>
        <td>{evalRun.traceCount === null ? '읽지 않음' : formatInteger(evalRun.traceCount)}</td>
      </tr>
    ))}
  </DataTable>
);
