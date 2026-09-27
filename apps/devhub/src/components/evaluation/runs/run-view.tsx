import type { ReactNode } from 'react';

import { FRESHNESS_LABEL, SOURCE_KIND_LABEL, STATE_LABEL } from '@/lib/evaluation/labels';
import type { VerifiedRun } from '@/lib/evaluation/run-detail';

import { Mono } from '../mono';
import { Section } from '../section';

import { BundleTable, ContextTable, EvalTable, ObservationTable } from './run-tables';

const NOTE = 'typo-body-small break-keep text-text-default';

const Notices = ({ run }: { run: VerifiedRun }) => (
  <>
    {run.partial && (
      <p className={NOTE}>partial 실행 — 일부 값이 없다. 각 행의 상태와 이유를 확인한다.</p>
    )}
    {run.freshness.status !== 'fresh' && (
      <p className={NOTE}>
        {run.freshness.status === 'stale' ? 'stale' : '기준 비교 불가'} — {run.freshness.reason}
      </p>
    )}
  </>
);

const Summary = ({ run }: { run: VerifiedRun }) => {
  const { metadata } = run.artifact;
  const { source, collection } = metadata;
  const rows: [string, ReactNode][] = [
    ['실행 ID', <Mono>{metadata.runId}</Mono>],
    ['profile', metadata.profile],
    ['상태', STATE_LABEL[metadata.state]],
    ['source SHA', <Mono>{source.sha}</Mono>],
    ['source commit 시각', source.time],
    ['source 종류', SOURCE_KIND_LABEL[source.kind]],
    ['CI run ID', source.ciRunId],
    [
      '작업 트리',
      source.dirty === 'unknown' ? '모름' : source.dirty ? '커밋되지 않은 변경 있음' : '깨끗함',
    ],
    ['수집 시작', collection.startedAt],
    ['수집 종료', collection.finishedAt ?? '수집 중'],
    [
      '수집기 SHA',
      collection.sha === source.sha ? 'source 와 같은 checkout' : <Mono>{collection.sha}</Mono>,
    ],
    ['Nx cache', metadata.cache],
    ['기준 SHA 비교', FRESHNESS_LABEL[run.freshness.status]],
  ];
  return (
    <Section level={3} title="실행 요약">
      <dl className="grid grid-cols-1 gap-x-lg gap-y-xs typo-body-small sm:grid-cols-[max-content_1fr]">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-text-light">{term}</dt>
            <dd className="m-0 break-all text-text-default">{value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
};

/**
 * 검증된 run 하나. 영역 section 의 id(`#observations` · `#bundles` · `#contexts` · `#evals`)는
 * 다른 화면의 `실행 기록?run=…#bundles` 같은 링크가 가리키는 자리다.
 */
export const RunView = ({ run }: { run: VerifiedRun }) => {
  const { observations, bundles, contexts, evals } = run.artifact;
  return (
    <div className="flex flex-col gap-xl">
      <Notices run={run} />
      <Summary run={run} />
      <Section level={3} anchor="observations" title="명령별 관측">
        <ObservationTable observations={observations} />
      </Section>
      {bundles.length > 0 && (
        <Section level={3} anchor="bundles" title="번들 (bytes, KB = 1000 B)">
          <BundleTable bundles={bundles} />
        </Section>
      )}
      {contexts.length > 0 && (
        <Section level={3} anchor="contexts" title="컨텍스트 token">
          <ContextTable contexts={contexts} />
        </Section>
      )}
      {evals.length > 0 && (
        <Section level={3} anchor="evals" title="평가 import">
          <EvalTable evals={evals} />
        </Section>
      )}
    </div>
  );
};
