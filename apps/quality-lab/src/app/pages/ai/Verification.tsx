import {
  type EvalRun,
  type EvalTrace,
  type EvalVariant,
  VERIFICATION_KINDS,
  VERIFICATION_STATUSES,
} from '@berrypjh/observability-contracts';

import { DataTable } from '../../components/DataTable';
import { Section } from '../../components/Section';
import { StatusNotice } from '../../components/StatusNotice';
import { importReason, verificationCounts } from '../../data/ai';
import { AUTHORITY_LABEL, REPAIR_LABEL, VERIFICATION_LABEL } from '../../data/labels';
import { notRunState } from '../../data/status';

const CLAIM_TEXT = (claim: EvalTrace['claimedSuccess']) =>
  claim === null ? '없음' : claim === 'unknown' ? '모름' : claim ? '성공 주장' : '주장 안 함';

const listText = (kinds: string[]) => kinds.join(', ') || '없음';

const TraceRow = ({ trace }: { trace: EvalTrace }) => {
  const { verification, success, repair } = trace;
  return (
    <tr>
      <th scope="row">{trace.id}</th>
      <td>{CLAIM_TEXT(trace.claimedSuccess)}</td>
      <td>{listText(verification.requiredKinds)}</td>
      <td>
        {verification.runs.length === 0
          ? '실행한 run 없음'
          : verification.runs.map((run, index) => (
              <div key={`${run.kind}.${index}`}>
                {`${run.kind} ${VERIFICATION_LABEL[run.status]} · ${run.required ? '필수' : '선택'} · attempt ${run.attempt}${
                  run.exitCode === null ? '' : ` · exit ${run.exitCode}`
                }`}
                {run.excerpt && (
                  <details>
                    <summary>발췌</summary>
                    <pre className="font-mono text-xxsm whitespace-pre-wrap break-all">
                      {run.excerpt}
                    </pre>
                  </details>
                )}
              </div>
            ))}
      </td>
      <td>
        {`누락 ${listText(verification.missingRequired)} · 실패 ${listText(
          verification.failedRequired,
        )} · 미지원 ${listText(verification.unsupportedRequired)}`}
      </td>
      <td>
        {verification.passed === null ? '판정 없음' : verification.passed ? '통과' : '통과 못함'}
      </td>
      <td>
        {success.falseSuccess
          ? 'false success'
          : success.claimCounted
            ? 'false success 아님'
            : '분모 밖 (명시적 주장 없음)'}
      </td>
      <td>{success.failureCategory ?? '없음'}</td>
      <td>
        {`attempts ${repair.attempts} · 성공 ${
          repair.succeeded === null ? '없음' : repair.succeeded ? '예' : '아니오'
        } · 반복 실패 ${repair.repeatedFailures ?? '없음'}`}
      </td>
    </tr>
  );
};

const VariantVerification = ({
  variant,
  traces,
}: {
  variant: EvalVariant;
  traces: EvalTrace[];
}) => {
  const runCount = traces.reduce((sum, trace) => sum + trace.verification.runs.length, 0);
  const counts = verificationCounts(traces);
  return (
    <Section title={variant.variant} level={3}>
      <p className="text-text-default text-xsm leading-xsm">
        {`authority: ${AUTHORITY_LABEL[variant.verificationAuthority]}`}
        <span className="block">{`repair: ${REPAIR_LABEL[variant.repair]}`}</span>
      </p>
      {runCount === 0 ? (
        <p className="text-text-default text-xsm">
          {`verification run 없음 — ${variant.verificationAuthority}, 검증을 실행하지 않았습니다`}
        </p>
      ) : (
        <DataTable
          caption={`Verification run — kind × status · ${variant.variant}`}
          headers={[
            'kind',
            ...VERIFICATION_STATUSES.map((status) => `${VERIFICATION_LABEL[status]} (${status})`),
          ]}
        >
          {VERIFICATION_KINDS.map((kind) => (
            <tr key={kind}>
              <th scope="row">{kind}</th>
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
        caption={`Verification — trace 별 · ${variant.variant}`}
        headers={[
          'trace',
          'claimed',
          'required kinds',
          'runs',
          '필수 누락 · 실패 · 미지원',
          'verification',
          'false success',
          'failure category',
          'repair',
        ]}
      >
        {traces.map((trace) => (
          <TraceRow key={trace.id} trace={trace} />
        ))}
      </DataTable>
    </Section>
  );
};

export const Verification = ({ evalRun, variant }: { evalRun: EvalRun; variant?: string }) => (
  <Section title="Verification" anchor="verification">
    <p className="text-text-light text-xsm leading-xsm break-keep">
      kind × status 의 단위는 verification run 수입니다 (trace 수가 아님). unsupported·not-run 은
      통과가 아닙니다. 검증 대상 범위(targetScope)는 trace 계약에 없어 이 화면에 없습니다.
    </p>
    {evalRun.variants.length === 0 && (
      <StatusNotice
        level={3}
        state={notRunState({
          section: 'verification',
          runId: evalRun.sourceId,
          reason: importReason('traces', evalRun.import.traces),
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
