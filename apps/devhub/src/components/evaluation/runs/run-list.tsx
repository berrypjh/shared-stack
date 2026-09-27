import { DataTable } from '@berrypjh/devhub-ui';

import { Link } from 'react-router-dom';

import { LINK } from '@/components/ui/entity-link';
import type { SummaryResult } from '@/lib/evaluation/client';
import { shortSha } from '@/lib/evaluation/format';
import { FRESHNESS_LABEL, STATE_LABEL } from '@/lib/evaluation/labels';
import { queryString } from '@/lib/evaluation/query';
import { screenPath } from '@/lib/evaluation/screens';
import { exportCommand } from '@/lib/evaluation/status';

import { CopyCommand } from '../copy-command';
import { useEvaluationClient } from '../evaluation-provider';
import { Mono } from '../mono';
import { Section } from '../section';

const RunRow = ({
  id,
  selected,
  result,
}: {
  id: string;
  selected: boolean;
  result: SummaryResult | undefined;
}) => {
  const client = useEvaluationClient();
  return (
    <tr aria-current={selected ? 'true' : undefined}>
      <th scope="row">
        <Link className={LINK} to={`${screenPath('runs')}${queryString({ run: id })}`}>
          {id}
        </Link>
        {selected ? ' (선택됨)' : ''}
      </th>
      {result === undefined ? (
        <td colSpan={7}>요약을 불러오는 중이다</td>
      ) : result.status !== 'ready' ? (
        <>
          <td colSpan={6}>요약 파일을 읽지 못해 이 행의 정보를 표시하지 않았다</td>
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

/** 공개 index 의 실행 목록. 요약 파일만 읽고, 최근에 export 한 실행이 위에 온다. */
export const RunList = ({
  runIds,
  selectedRunId,
  summaries,
}: {
  runIds: string[];
  selectedRunId: string | null;
  summaries: Record<string, SummaryResult>;
}) => (
  <Section title="공개된 실행">
    <p className="typo-body-small text-text-light">
      목록은 요약 파일만 읽는다. run 전체는 고른 실행 하나만 받는다.
    </p>
    <DataTable
      caption="공개된 실행"
      headers={['실행', 'profile', '상태', 'source', '기준 비교', '수집 시각', '담긴 영역', '요약']}
    >
      {[...runIds].reverse().map((id) => (
        <RunRow key={id} id={id} selected={id === selectedRunId} result={summaries[id]} />
      ))}
    </DataTable>
  </Section>
);
