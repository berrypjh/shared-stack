import { DataTable } from '@berrypjh/devhub-ui';
import {
  type EvalRun,
  type EvalTrace,
  type EvalVariant,
  VERIFICATION_KINDS,
  VERIFICATION_STATUSES,
} from '@berrypjh/observability-contracts';

import { importReason, verificationCounts } from '@/lib/evaluation/ai';
import { attemptName, failureTerm, VERIFICATION_KIND_LABEL } from '@/lib/evaluation/glossary';
import { AUTHORITY_LABEL, REPAIR_LABEL, VERIFICATION_LABEL } from '@/lib/evaluation/labels';
import { notRunState } from '@/lib/evaluation/status';

import { Section } from '../section';
import { StatusNotice } from '../status-notice';

const claimText = (claim: EvalTrace['claimedSuccess']) =>
  claim === null
    ? '보고 안 함'
    : claim === 'unknown'
      ? '모른다고 함'
      : claim
        ? '해냈다고 함'
        : '못 했다고 함';

const kindText = (kind: string) => VERIFICATION_KIND_LABEL[kind] ?? kind;
const kindsText = (kinds: string[]) => kinds.map(kindText).join(', ') || '없음';

/** 검증 내역 — 필수 검증과 실제로 돌린 검증. 기본은 접고, 펼치면 실패 출력 일부까지 본다. */
const Runs = ({ trace }: { trace: EvalTrace }) => {
  const { verification } = trace;
  return (
    <details>
      <summary className="whitespace-nowrap">{`필수 ${verification.requiredKinds.length} · 돌림 ${verification.runs.length}`}</summary>
      <p className="mt-xs typo-caption-small text-text-light">{`필수: ${kindsText(verification.requiredKinds)}`}</p>
      {verification.runs.length === 0 ? (
        <p className="typo-caption-small text-text-light">돌린 검증 없음</p>
      ) : (
        verification.runs.map((run, index) => (
          <div key={`${run.kind}.${index}`} className="typo-caption-small">
            {`${kindText(run.kind)} ${VERIFICATION_LABEL[run.status]}${run.required ? '' : ' (선택)'}${
              run.attempt > 0 ? ` · ${run.attempt}번째 수정 뒤` : ''
            }`}
            {run.excerpt && (
              <details>
                <summary>출력 일부</summary>
                <pre className="devhub-code break-all whitespace-pre-wrap">{run.excerpt}</pre>
              </details>
            )}
          </div>
        ))
      )}
    </details>
  );
};

const TraceRow = ({ trace, repairColumn }: { trace: EvalTrace; repairColumn: boolean }) => {
  const { verification, success, repair } = trace;
  return (
    <tr>
      <th scope="row" className="whitespace-nowrap">
        {attemptName(trace)}
      </th>
      <td className="whitespace-nowrap">{claimText(trace.claimedSuccess)}</td>
      <td className="whitespace-nowrap">
        {verification.passed === null ? '판정 없음' : verification.passed ? '통과' : '통과 못함'}
      </td>
      <td className="break-keep">
        {success.failureCategory ? failureTerm(success.failureCategory).label : '성공'}
      </td>
      <td className="whitespace-nowrap">
        {success.falseSuccess ? '거짓 성공' : success.claimCounted ? '아님' : '셈에서 빠짐'}
      </td>
      {repairColumn && (
        <td className="whitespace-nowrap">
          {repair.attempts === 0
            ? '없음'
            : `${repair.attempts}번 · ${repair.succeeded ? '통과' : '통과 못함'}`}
        </td>
      )}
      <td>
        <Runs trace={trace} />
      </td>
    </tr>
  );
};

const STATUS_HEADERS = VERIFICATION_STATUSES.map((status) => VERIFICATION_LABEL[status] ?? status);

const VariantVerification = ({
  variant,
  traces,
}: {
  variant: EvalVariant;
  traces: EvalTrace[];
}) => {
  const runCount = traces.reduce((sum, trace) => sum + trace.verification.runs.length, 0);
  const counts = verificationCounts(traces);
  const repairColumn = variant.repair !== 'not-in-variant';
  return (
    <Section title={variant.label} level={3}>
      <p className="typo-body-small break-keep text-text-default">
        {AUTHORITY_LABEL[variant.verificationAuthority]}
        <span className="block">{REPAIR_LABEL[variant.repair]}</span>
      </p>
      {runCount > 0 && (
        <DataTable
          caption={`검증 결과 수 — ${variant.label}`}
          headers={['검증', ...STATUS_HEADERS]}
        >
          {VERIFICATION_KINDS.map((kind) => (
            <tr key={kind}>
              <th scope="row">{kindText(kind)}</th>
              {VERIFICATION_STATUSES.map((status) => {
                const count = counts[kind][status];
                return (
                  <td
                    key={status}
                    className={count > 0 && status !== 'passed' ? 'bg-background-warning/15' : ''}
                  >
                    {count}
                  </td>
                );
              })}
            </tr>
          ))}
        </DataTable>
      )}
      <DataTable
        caption={`시도 별 검증 — ${variant.label}`}
        headers={[
          '시도',
          '에이전트의 말',
          '결과',
          '실패 원인',
          '거짓 성공',
          ...(repairColumn ? ['수정'] : []),
          '검증 내역',
        ]}
      >
        {traces.map((trace) => (
          <TraceRow key={trace.id} trace={trace} repairColumn={repairColumn} />
        ))}
      </DataTable>
    </Section>
  );
};

/**
 * variant 마다 검증을 누가 돌렸는지, 검증 종류 × 결과 수(돌렸을 때만), 시도 별 판정.
 * variant 는 summary 에서 오므로, variant 가 없으면 summary import 상태가 이유다.
 */
export const Verification = ({ evalRun, variant }: { evalRun: EvalRun; variant?: string }) => (
  <Section title="variant 별 검증" anchor="verification">
    <p className="typo-body-small break-keep text-text-light">
      검증 결과 수의 단위는 검증 실행 횟수다 (시도 수가 아님 — 수정 뒤 다시 돌리면 또 센다). "지원
      안 함" · "실행 안 함" 은 통과가 아니다. "셈에서 빠짐" 은 해냈는지 분명히 말하지 않아 거짓 성공
      비율의 분모에 넣지 않은 시도다.
    </p>
    {evalRun.variants.length === 0 && (
      <StatusNotice
        level={3}
        state={notRunState({
          section: '검증',
          runId: evalRun.sourceId,
          reason: importReason('summary', evalRun.import.summary),
          collectProfile: 'eval',
          alternatives: null,
        })}
      />
    )}
    {evalRun.variants
      .filter((item) => !variant || item.variant === variant)
      .map((item) => (
        <VariantVerification
          key={item.variant}
          variant={item}
          traces={evalRun.traces.filter((trace) => trace.variant === item.variant)}
        />
      ))}
  </Section>
);
