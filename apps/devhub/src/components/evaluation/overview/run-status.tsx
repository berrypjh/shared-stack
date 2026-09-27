import type { Freshness, RunSummary } from '@berrypjh/observability-contracts';

import type { ReactNode } from 'react';

import { Mono } from '@/components/evaluation/mono';
import { Section } from '@/components/evaluation/section';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { shortSha } from '@/lib/evaluation/format';
import { FRESHNESS_LABEL, SOURCE_KIND_LABEL, STATE_LABEL } from '@/lib/evaluation/labels';
import { partialState, staleState } from '@/lib/evaluation/status';

const dirtyText = (dirty: boolean | 'unknown') =>
  dirty === 'unknown' ? '모름' : dirty ? '커밋되지 않은 변경 있음' : '깨끗함';

/** 실행의 출처와 상태. partial · stale 이면 성공처럼 두지 않고 그 상태를 함께 보인다. */
export const RunStatus = ({
  summary,
  freshness,
}: {
  summary: RunSummary;
  freshness: Freshness;
}) => {
  const { metadata } = summary;
  const rows: [string, ReactNode][] = [
    ['실행', <Mono>{metadata.runId}</Mono>],
    ['profile', metadata.profile],
    ['상태', STATE_LABEL[metadata.state]],
    ['source', <Mono>{shortSha(metadata.source.sha)}</Mono>],
    ['기준 비교', FRESHNESS_LABEL[freshness.status]],
    ['source 종류', SOURCE_KIND_LABEL[metadata.source.kind]],
    ['작업 트리', dirtyText(metadata.source.dirty)],
    ['수집 시작', metadata.collection.startedAt],
  ];
  return (
    <Section title="실행 상태">
      <dl className="grid grid-cols-1 gap-x-lg gap-y-xs typo-body-small sm:grid-cols-[max-content_1fr]">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-text-light">{term}</dt>
            <dd className="m-0 break-all text-text-default">{value}</dd>
          </div>
        ))}
      </dl>
      {metadata.state !== 'complete' && (
        <StatusNotice level={3} state={partialState(metadata.runId)} />
      )}
      {freshness.status !== 'fresh' && (
        <StatusNotice level={3} state={staleState(freshness, metadata.profile)} />
      )}
    </Section>
  );
};
