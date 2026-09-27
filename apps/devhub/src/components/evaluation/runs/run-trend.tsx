import { DataTable } from '@berrypjh/devhub-ui';
import { orderHistory, trendOf } from '@berrypjh/observability-contracts';

import type { SummaryResult } from '@/lib/evaluation/client';
import { historyInputs, seriesIds, trendStatusText, valueText } from '@/lib/evaluation/comparison';
import type { Query } from '@/lib/evaluation/query';

import { LabeledSelect } from '../labeled-select';
import { Section } from '../section';

const NOTE = 'typo-body-small text-text-light';

/** Level 3 실행 기록 추세. 요약만 읽고, 고른 지표는 주소의 `series` 에 남는다. */
export const RunTrend = ({
  runIds,
  summaries,
  query,
  setQuery,
}: {
  runIds: string[];
  summaries: Record<string, SummaryResult>;
  query: Query;
  setQuery: (next: Query) => void;
}) => {
  const inputs = historyInputs(runIds, summaries);
  if (!inputs) {
    return (
      <Section title="실행 기록 추세">
        <p className={NOTE}>요약을 불러오는 중이다</p>
      </Section>
    );
  }
  const entries = orderHistory(inputs);
  const ids = seriesIds(entries);
  const trend = query.series ? trendOf(entries, query.series) : null;
  const profileOf = new Map(entries.map((entry) => [entry.runId, entry.summary?.metadata.profile]));
  const shown = trend?.points.filter((point) => point.status !== 'absent') ?? [];

  return (
    <Section title="실행 기록 추세">
      <p className={NOTE}>
        요약만 읽고 수집 시각 순으로 둔다. 같은 profile·비교 조건의 이웃한 점만 한 구간으로 잇고,
        요약 없음(gap)·측정 안 됨·조건 모름은 구간을 끊는다.
      </p>
      <LabeledSelect
        label="추세 지표"
        value={query.series ?? ''}
        options={[
          { value: '', label: '(고르지 않음)' },
          ...ids.map((id) => ({ value: id, label: id })),
        ]}
        onChange={(series) => setQuery({ ...query, series: series || undefined })}
      />
      {trend && (
        <>
          <p className={NOTE}>
            구간 {trend.segmentCount}개 · 이 지표가 없는 실행 {trend.points.length - shown.length}
            개는 표에서 뺐다
          </p>
          <DataTable
            caption={`추세 — ${trend.id}`}
            headers={['실행', 'profile', '수집 시각', '값', '구간·상태']}
          >
            {shown.map((point) => (
              <tr key={point.runId}>
                <th scope="row">{point.runId}</th>
                <td>{profileOf.get(point.runId) ?? '모름'}</td>
                <td>{point.collectedAt ?? '모름'}</td>
                <td>{trend.unit ? valueText(trend.unit, point.value) : '값 없음'}</td>
                <td>{trendStatusText(point)}</td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </Section>
  );
};
