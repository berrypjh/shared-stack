import { Empty, InspectorSection } from '@berrypjh/devhub-ui';

import type { ReactNode } from 'react';

import { shortSha } from '@/lib/evaluation/format';
import { FRESHNESS_LABEL, SOURCE_KIND_LABEL, STATE_LABEL } from '@/lib/evaluation/labels';

import type { RunData } from './use-run-data';

const ROWS = 'grid grid-cols-[6rem_minmax(0,1fr)] gap-x-md gap-y-xs typo-body-small';

const Row = ({ term, children }: { term: string; children: ReactNode }) => (
  <div className="contents">
    <dt className="text-text-light">{term}</dt>
    <dd className="min-w-0 break-all">{children}</dd>
  </div>
);

/** 실행 정보가 없을 때의 이유. 불러오는 중 · 화면 상태 · 목록만 읽는 화면을 섞지 않는다. */
const reasonOf = (data: RunData | undefined) => {
  if (!data) return '이 화면은 실행 목록만 읽음 — 실행을 고르면 여기에 실행 정보가 나옴';
  if (data.loading) return '실행을 불러오는 중';
  if (data.view) return data.view.title;
  return '이 화면은 고른 실행의 요약을 읽지 않음';
};

/**
 * 오른쪽 칸: 고른 실행이 어디서 · 언제 · 무엇으로 수집됐는지와, build 스냅샷 커밋과 같은 source 인지.
 */
export const RunInspector = ({ data }: { data?: RunData }) => {
  const metadata = data?.summary?.metadata ?? data?.run?.metadata ?? null;
  return (
    <div className="flex flex-col divide-y divide-stroke-light">
      <header className="flex flex-col gap-xs pb-lg">
        <p className="typo-caption-small text-text-light">고른 실행</p>
        <h2 className="typo-body-medium-strong break-all">
          {metadata?.runId ?? data?.selectedRunId ?? '실행 없음'}
        </h2>
      </header>
      <InspectorSection id="evaluation-run" title="실행">
        {metadata ? (
          <dl className={ROWS}>
            <Row term="상태">{STATE_LABEL[metadata.state] ?? metadata.state}</Row>
            <Row term="profile">
              <span className="devhub-code">{metadata.profile}</span>
            </Row>
            <Row term="범위">{metadata.scope.join(' · ')}</Row>
            <Row term="source">
              {SOURCE_KIND_LABEL[metadata.source.kind] ?? metadata.source.kind} ·{' '}
              <span className="devhub-code">{shortSha(metadata.source.sha)}</span>
              {metadata.source.dirty === true && ' · 커밋 안 된 변경 있음'}
            </Row>
            <Row term="수집 끝">{metadata.collection.finishedAt ?? '수집 중'}</Row>
            {data?.freshness && (
              <Row term="스냅샷 비교">
                {FRESHNESS_LABEL[data.freshness.status]}
                <span className="block typo-caption-small text-text-light">
                  {data.freshness.reason}
                </span>
              </Row>
            )}
          </dl>
        ) : (
          <Empty reason={reasonOf(data)} />
        )}
      </InspectorSection>
    </div>
  );
};
