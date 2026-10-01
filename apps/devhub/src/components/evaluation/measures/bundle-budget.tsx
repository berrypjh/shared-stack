import { LabeledSelect, Mono } from '@berrypjh/devhub-ui';
import type { MetricObservation } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { type BaselineRun, sizeLimitRows } from '@/lib/evaluation/bundles';
import { observationValueText } from '@/lib/evaluation/format';
import { noMatchState, unsupportedState } from '@/lib/evaluation/status';

import { BASELINE_PENDING } from '../bundles/baseline-text';
import { BudgetSection } from '../bundles/budget-section';
import { Section } from '../section';
import { StatusNotice } from '../status-notice';
import { useOtherRun } from '../use-run-data';

import type { MeasureProps } from './types';

/**
 * 번들 budget: size-limit 행의 크기와 한도. baseline · package 필터는 URL 에 있고 표시만 바꾼다 —
 * 수집기 판정과 행 수는 원본 전체 값이다.
 */
export const BundleBudget = ({ run, data, alternatives }: MeasureProps) => {
  const { query, setQuery } = data;
  const { runId, profile } = run.metadata;
  const other = useOtherRun(query.base);
  const sizeLimit = run.bundles.filter((row) => row.method === 'size-limit');

  if (sizeLimit.length === 0) {
    return (
      <StatusNotice
        state={unsupportedState({
          section: 'size-limit budget',
          runId,
          profile,
          collectProfile: 'core',
          alternatives,
        })}
      />
    );
  }

  const packages = [...new Set(sizeLimit.map((row) => row.package))];
  const inPackage = run.bundles.filter((row) => !query.package || row.package === query.package);
  const baseline: BaselineRun | null =
    other.status === 'ready' && query.base
      ? { runId: query.base, bundles: other.run.bundles }
      : null;
  const rows = sizeLimitRows(inPackage, baseline);
  const judgements = run.observations.filter(
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
          {`size-limit ${sizeLimit.length}행 중 필터와 일치 ${rows.length}행 — 필터 결과는 부분 집합이며 판정을 다시 계산하지 않음`}
        </p>
        <p className="typo-body-small break-keep text-text-light">
          baseline delta 는 package·method·압축·조정·entry·import·target·config hash·tool·externals
          가 모두 같을 때만 냄 (계약의 <Mono>compareBundle</Mono>).
        </p>
        {other.status === 'error' && <StatusNotice level={3} state={other.view} />}
        {judgements.length > 0 && (
          <List className="flex flex-col gap-xs typo-body-small">
            {judgements.map((item) => (
              <ListItem key={item.id}>
                <Mono>{item.id}</Mono> {`수집기 판정 (원본 전체): ${observationValueText(item)}`}
              </ListItem>
            ))}
          </List>
        )}
      </Section>

      {rows.length > 0 ? (
        <BudgetSection
          rows={rows}
          pending={query.base ? BASELINE_PENDING[other.status] : null}
          compare={Boolean(query.base)}
        />
      ) : (
        <StatusNotice state={noMatchState(`package ${query.package}`)} />
      )}
    </>
  );
};
