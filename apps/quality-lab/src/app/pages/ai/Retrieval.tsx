import type { EvalRun, EvalTrace } from '@berrypjh/observability-contracts';

import { DataTable } from '../../components/DataTable';
import { Mono } from '../../components/Mono';
import { Section } from '../../components/Section';
import { StatusNotice } from '../../components/StatusNotice';
import { importReason, retrievalText } from '../../data/ai';
import { notRunState } from '../../data/status';

const EvidenceIds = ({ retrieval }: { retrieval: EvalTrace['retrieval'] }) => {
  if (retrieval.required === null || retrieval.retrieved === null) {
    return <span className="text-text-light">비공개 (held-out split)</span>;
  }
  return (
    <details>
      <summary>{`required ${retrieval.required.length} · retrieved ${retrieval.retrieved.length}`}</summary>
      {[
        ['required', retrieval.required],
        ['retrieved', retrieval.retrieved],
      ].map(([name, ids]) => (
        <div key={name as string} className="mt-xs">
          <span className="text-text-light text-xxsm">{name as string}</span>
          {(ids as string[]).length === 0 ? (
            <span className="block text-text-light">없음</span>
          ) : (
            (ids as string[]).map((id) => (
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
      <p className="text-text-light text-xsm leading-xsm break-keep">
        RR 은 전체 ranked list 에서의 reciprocal rank 입니다 (top-K 로 자르지 않음). evidence
        중복(같은 evidence 를 다시 가져옴)과 tool call 중복(같은 대상을 다시 읽음)은 다른
        신호입니다. required evidence 가 없는 task 는 N/A 입니다.
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
