import { DataTable, Mono } from '@berrypjh/devhub-ui';
import type { EvalRun, EvalTrace } from '@berrypjh/observability-contracts';

import { importReason, retrievalText } from '@/lib/evaluation/ai';
import { attemptName } from '@/lib/evaluation/glossary';
import { notRunState } from '@/lib/evaluation/status';

import { Section } from '../section';
import { StatusNotice } from '../status-notice';

/** 필요한 근거와 찾은 근거. held-out 과제는 정답 근거를 공개하지 않는다. */
const EvidenceIds = ({ retrieval }: { retrieval: EvalTrace['retrieval'] }) => {
  if (retrieval.required === null || retrieval.retrieved === null) {
    return <span className="text-text-light">비공개 (시험용 과제)</span>;
  }
  const groups: [string, string[]][] = [
    ['필요한 근거', retrieval.required],
    ['찾은 순서', retrieval.retrieved],
  ];
  return (
    <details>
      <summary>{`필요 ${retrieval.required.length} · 찾음 ${retrieval.retrieved.length}`}</summary>
      {groups.map(([name, ids]) => (
        <div key={name} className="mt-xs">
          <span className="typo-caption-small text-text-light">{name}</span>
          {ids.length === 0 ? (
            <span className="block text-text-light">없음</span>
          ) : (
            ids.map((id, index) => (
              <span key={`${id}.${index}`} className="block">
                <Mono>{id}</Mono>
              </span>
            ))
          )}
        </div>
      ))}
    </details>
  );
};

const HEADERS = ['시도', '처음 K개 안에 찾음', '처음 찾은 순서', '다시 가져옴', '근거 목록'];

/** variant 마다 시도 별 근거 찾기. trace 가 없으면 import 이유를 쓴다. */
export const Retrieval = ({ evalRun, variant }: { evalRun: EvalRun; variant?: string }) => {
  if (evalRun.traces.length === 0) {
    return (
      <Section title="시도 별 근거 찾기" anchor="retrieval">
        <StatusNotice
          level={3}
          state={notRunState({
            section: '시도 별 근거 찾기',
            runId: evalRun.sourceId,
            reason: importReason('traces', evalRun.import.traces),
            collectProfile: 'eval',
            alternatives: null,
          })}
        />
      </Section>
    );
  }
  const k = evalRun.traces[0].retrieval.k;
  const variants = evalRun.variants.filter((item) => !variant || item.variant === variant);
  return (
    <Section title="시도 별 근거 찾기" anchor="retrieval">
      <p className="typo-body-small break-keep text-text-light">
        {`K 는 ${k} — 찾은 것 중 처음 ${k}개 안에 필요한 근거가 몇 개 있었는지를 "찾은 수 / 필요한 수" 로 쓴다. "처음 찾은 순서" 는 필요한 근거가 처음 나온 자리다. "다시 가져옴" 은 이미 찾은 근거를 또 가져온 수와 같은 대상을 또 조회한 수다.`}
      </p>
      {variants.map((item) => {
        const traces = evalRun.traces.filter((trace) => trace.variant === item.variant);
        return (
          <Section key={item.variant} title={item.label} level={3}>
            <DataTable caption={`근거 찾기 — ${item.label}`} headers={HEADERS}>
              {traces.map((trace) => {
                const { retrieval } = trace;
                const text = retrievalText(retrieval);
                return (
                  <tr key={trace.id}>
                    <th scope="row" className="whitespace-nowrap">
                      {attemptName(trace)}
                    </th>
                    <td className="whitespace-nowrap">{text.hits}</td>
                    <td className="whitespace-nowrap">{text.firstHitRank}</td>
                    <td className="whitespace-nowrap">{`근거 ${retrieval.evidenceDuplicates} · 조회 ${retrieval.toolCallDuplicates}`}</td>
                    <td>
                      <EvidenceIds retrieval={retrieval} />
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          </Section>
        );
      })}
    </Section>
  );
};
