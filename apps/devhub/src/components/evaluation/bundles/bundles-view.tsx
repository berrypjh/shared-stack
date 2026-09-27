import type { MetricObservation, RunArtifact } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { LabeledSelect } from '@/components/evaluation/labeled-select';
import { Mono } from '@/components/evaluation/mono';
import { Section } from '@/components/evaluation/section';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { type RunData, runsWith, useOtherRun } from '@/components/evaluation/use-run-data';
import { type BaselineRun, sizeLimitRows, treeshakeGroups } from '@/lib/evaluation/bundles';
import type { SummaryResult } from '@/lib/evaluation/client';
import { observationValueText } from '@/lib/evaluation/format';
import { noMatchState, unsupportedState } from '@/lib/evaluation/status';

import { BASELINE_PENDING } from './baseline-text';
import { BudgetSection } from './budget-section';
import { TreeshakeSection } from './treeshake-section';

/**
 * 고른 실행의 번들 화면. baseline · package 필터는 URL 에 있고 표시만 바꾼다 — 수집기 판정과
 * 행 수는 원본 전체 값이다.
 */
export const BundlesView = ({
  run,
  data,
  summaries,
}: {
  run: RunArtifact;
  data: RunData;
  summaries: Record<string, SummaryResult>;
}) => {
  const { query, setQuery } = data;
  const { runId, profile } = run.metadata;
  const other = useOtherRun(query.base);
  const alternatives = runsWith(summaries, (summary) => summary.sections.bundles > 0, runId);

  if (run.bundles.length === 0) {
    return (
      <StatusNotice
        state={unsupportedState({
          section: 'bundle 측정',
          runId,
          profile,
          collectProfile: 'core',
          alternatives,
        })}
      />
    );
  }

  const packages = [...new Set(run.bundles.map((row) => row.package))];
  const inPackage = run.bundles.filter((row) => !query.package || row.package === query.package);
  const baseline: BaselineRun | null =
    other.status === 'ready' && query.base
      ? { runId: query.base, bundles: other.run.bundles }
      : null;
  const sizeLimitCount = run.bundles.filter((row) => row.method === 'size-limit').length;
  const rows = sizeLimitRows(inPackage, baseline);
  const collectorJudgements = run.observations.filter(
    (item): item is MetricObservation =>
      item.domain === 'bundle' && !item.id.startsWith('bundle.treeshake'),
  );

  return (
    <>
      <Section title="비교 조건">
        <div className="flex flex-wrap items-end gap-md">
          <LabeledSelect
            label="baseline 실행"
            value={query.base ?? ''}
            options={[
              { value: '', label: '없음' },
              ...data.runIds.filter((id) => id !== runId).map((id) => ({ value: id, label: id })),
            ]}
            onChange={(value) => setQuery({ ...query, base: value || undefined })}
          />
          <LabeledSelect
            label="패키지"
            value={query.package ?? ''}
            options={[
              { value: '', label: '전체' },
              ...packages.map((name) => ({ value: name, label: name })),
            ]}
            onChange={(value) => setQuery({ ...query, package: value || undefined })}
          />
        </div>
        <p role="status" aria-live="polite" className="typo-body-small text-text-default">
          {`size-limit ${sizeLimitCount}행 중 필터와 일치 ${rows.length}행 — 필터 결과는 부분 집합이며 판정을 다시 계산하지 않는다`}
        </p>
        <p className="typo-body-small break-keep text-text-light">
          baseline delta 는 package·method·압축·조정·entry·import·target·config hash·tool·externals
          가 모두 같을 때만 낸다 (계약의 <Mono>compareBundle</Mono>).
        </p>
        {other.status === 'error' && <StatusNotice level={3} state={other.view} />}
        {collectorJudgements.length > 0 && (
          <List className="flex flex-col gap-xs typo-body-small">
            {collectorJudgements.map((item) => (
              <ListItem key={item.id}>
                <Mono>{item.id}</Mono> {`수집기 판정 (원본 전체): ${observationValueText(item)}`}
              </ListItem>
            ))}
          </List>
        )}
      </Section>

      {rows.length > 0 ? (
        <BudgetSection rows={rows} pending={query.base ? BASELINE_PENDING[other.status] : null} />
      ) : (
        <StatusNotice
          state={
            sizeLimitCount > 0
              ? noMatchState(`package ${query.package}`)
              : unsupportedState({
                  section: 'size-limit budget',
                  runId,
                  profile,
                  collectProfile: 'core',
                  alternatives,
                })
          }
        />
      )}

      <TreeshakeSection
        run={run}
        groups={treeshakeGroups(inPackage)}
        filtered={query.package}
        alternatives={alternatives}
      />
    </>
  );
};
