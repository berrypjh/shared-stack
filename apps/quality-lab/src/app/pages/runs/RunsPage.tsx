import { useCallback } from 'react';

import { Link, useLocation } from 'react-router-dom';

import { CopyCommand } from '../../components/CopyCommand';
import { DataTable } from '../../components/DataTable';
import { Mono } from '../../components/Mono';
import { RunBar } from '../../components/RunBar';
import { Section } from '../../components/Section';
import { StatusNotice } from '../../components/StatusNotice';
import type { SummaryResult } from '../../data/client';
import { useQualityLab } from '../../data/context';
import { shortSha } from '../../data/format';
import { FRESHNESS_LABEL, STATE_LABEL } from '../../data/labels';
import { queryString } from '../../data/query';
import { exportCommand, loadingState } from '../../data/status';
import { useRunData, useSummaries } from '../../data/useRunData';
import { RunPanel } from '../../run/RunPanel';
import { Page } from '../../ui';

import { RunsCompare } from './RunsCompare';

const SPEC = { keys: ['run', 'base', 'series'] } as const;
const LINK = 'text-text-link underline underline-offset-2';

const RunRow = ({
  id,
  selected,
  result,
}: {
  id: string;
  selected: boolean;
  result: SummaryResult | undefined;
}) => {
  const { client } = useQualityLab();
  return (
    <tr aria-current={selected ? 'true' : undefined}>
      <th scope="row">
        <Link className={LINK} to={`/runs${queryString({ run: id })}`}>
          {id}
        </Link>
        {selected ? ' (선택됨)' : ''}
      </th>
      {result === undefined ? (
        <td colSpan={7}>요약을 불러오는 중입니다</td>
      ) : result.status !== 'ready' ? (
        <>
          <td colSpan={6}>요약 파일을 읽지 못해 이 행의 정보를 표시하지 않았습니다</td>
          <td>
            {result.status === 'missing' && result.target === 'summary' ? '요약 없음' : '요약 오류'}{' '}
            — {result.message}
            <CopyCommand command={exportCommand(id)} />
          </td>
        </>
      ) : (
        <>
          <td>{result.value.metadata.profile}</td>
          <td>{STATE_LABEL[result.value.metadata.state]}</td>
          <td>
            <Mono>{shortSha(result.value.metadata.source.sha)}</Mono>
          </td>
          <td>{FRESHNESS_LABEL[client.freshness(result.value.metadata).status]}</td>
          <td>{result.value.metadata.collection.startedAt}</td>
          <td>
            {[
              `tests ${result.value.sections.tests}`,
              `bundles ${result.value.sections.bundles}`,
              `contexts ${result.value.sections.contexts}`,
              `evals ${result.value.sections.evals}`,
              `packages ${result.value.sections.packageSurfaces}`,
            ].join(' · ')}
          </td>
          <td>요약 파일</td>
        </>
      )}
    </tr>
  );
};

export const RunsPage = () => {
  const data = useRunData('index', SPEC);
  const summaries = useSummaries(data.runIds);
  const { fetcher, expectedSha } = useQualityLab();
  const { hash } = useLocation();

  /** 다른 화면의 `#bundles` 같은 링크는 상세가 그려진 뒤에 그 section 으로 옮긴다. */
  const scrollToHash = useCallback(() => {
    if (!hash) return;
    document
      .getElementById(decodeURIComponent(hash.slice(1)))
      ?.scrollIntoView?.({ block: 'start' });
  }, [hash]);

  return (
    <Page path="/runs">
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && data.runIds.length === 0 && (
        <StatusNotice state={loadingState('실행 목록')} />
      )}
      {!data.view && data.runIds.length > 0 && (
        <>
          <Section title="공개된 실행">
            <p className="text-text-light text-xsm leading-xsm">
              목록은 요약 파일만 읽습니다. run 전체는 고른 실행 하나만 받습니다.
            </p>
            <DataTable
              caption="공개된 실행"
              headers={[
                '실행',
                'profile',
                '상태',
                'source',
                '기준 비교',
                '수집 시각',
                '담긴 영역',
                '요약',
              ]}
            >
              {[...data.runIds].reverse().map((id) => (
                <RunRow
                  key={id}
                  id={id}
                  selected={id === data.selectedRunId}
                  result={summaries[id]}
                />
              ))}
            </DataTable>
          </Section>
          {data.selectedRunId && (
            <RunsCompare
              runIds={data.runIds}
              summaries={summaries}
              currentId={data.selectedRunId}
              query={data.query}
              setQuery={data.setQuery}
            />
          )}
          {data.selectedRunId && (
            <RunPanel
              fetcher={fetcher}
              expectedSha={expectedSha}
              runId={data.selectedRunId}
              title="실행 상세"
              onReady={scrollToHash}
            />
          )}
        </>
      )}
    </Page>
  );
};
