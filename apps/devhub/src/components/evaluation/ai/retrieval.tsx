import { DataTable } from '@berrypjh/devhub-ui';
import type { EvalRun, EvalTrace } from '@berrypjh/observability-contracts';

import { importReason, retrievalText } from '@/lib/evaluation/ai';
import { notRunState } from '@/lib/evaluation/status';

import { Mono } from '../mono';
import { Section } from '../section';
import { StatusNotice } from '../status-notice';

const EvidenceIds = ({ retrieval }: { retrieval: EvalTrace['retrieval'] }) => {
  if (retrieval.required === null || retrieval.retrieved === null) {
    return <span className="text-text-light">비공개 (held-out split)</span>;
  }
  const groups: [string, string[]][] = [
    ['required', retrieval.required],
    ['retrieved', retrieval.retrieved],
  ];
  return (
    <details>
      <summary>{`required ${retrieval.required.length} · retrieved ${retrieval.retrieved.length}`}</summary>
      {groups.map(([name, ids]) => (
        <div key={name} className="mt-xs">
          <span className="typo-caption-small text-text-light">{name}</span>
          {ids.length === 0 ? (
            <span className="block text-text-light">없음</span>
          ) : (
            ids.map((id) => (
              <span key={id} className="block">
                <Mono>{id}</Mono>
              </span>
            ))
          )}
        </div>
      ))}
    </details>
  );
};

/** trace 별 K · required · hits · recall · RR · 중복. trace 가 없으면 import 이유를 쓴다. */
export const Retrieval = ({ evalRun, variant }: { evalRun: EvalRun; variant?: string }) => {
  const traces = evalRun.traces.filter((trace) => !variant || trace.variant === variant);
  if (evalRun.traces.length === 0) {
    return (
      <Section title="Retrieval" anchor="retrieval">
        <StatusNotice
          level={3}
          state={notRunState({
            section: 'retrieval trace',
            runId: evalRun.sourceId,
            reason: importReason('traces', evalRun.import.traces),
            collectProfile: 'eval',
            alternatives: null,
          })}
        />
      </Section>
    );
  }
  return (
    <Section title="Retrieval" anchor="retrieval">
      <p className="typo-body-small break-keep text-text-light">
        RR 은 전체 ranked list 에서의 reciprocal rank 다 (top-K 로 자르지 않음). evidence 중복(같은
        evidence 를 다시 가져옴)과 tool call 중복(같은 대상을 다시 읽음)은 다른 신호. required
        evidence 가 없는 task 는 N/A 다.
      </p>
      <DataTable
        caption={`Retrieval — trace 별${variant ? ` · ${variant}` : ''}`}
        headers={[
          'trace',
          'K',
          'required',
          'hits@K',
          'recall@K',
          'RR',
          'first hit rank',
          'evidence 중복',
          'tool call 중복',
          'evidence',
        ]}
      >
        {traces.map((trace) => {
          const { retrieval } = trace;
          const text = retrievalText(retrieval);
          return (
            <tr key={trace.id}>
              <th scope="row">{trace.id}</th>
              <td>{retrieval.k}</td>
              <td>{retrieval.requiredCount}</td>
              <td>{retrieval.hitsAtK}</td>
              <td>{text.recall}</td>
              <td>{text.reciprocalRank}</td>
              <td>{text.firstHitRank}</td>
              <td>{retrieval.evidenceDuplicates}</td>
              <td>{retrieval.toolCallDuplicates}</td>
              <td>
                <EvidenceIds retrieval={retrieval} />
              </td>
            </tr>
          );
        })}
      </DataTable>
    </Section>
  );
};
