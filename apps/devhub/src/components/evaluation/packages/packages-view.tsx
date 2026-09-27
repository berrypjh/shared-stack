import type { RunArtifact } from '@berrypjh/observability-contracts';

import { AlternativeRuns } from '@/components/evaluation/alternative-runs';
import { LabeledSelect } from '@/components/evaluation/labeled-select';
import { Section } from '@/components/evaluation/section';
import { StatusNotice } from '@/components/evaluation/status-notice';
import type { RunData } from '@/components/evaluation/use-run-data';
import { noMatchState, unsupportedState } from '@/lib/evaluation/status';

import { SurfaceDetail } from './surface-detail';
import { SurfaceTable } from './surface-table';

/**
 * 고른 실행의 패키지 표면. 표면이 없으면 unsupported 와 표면이 있는 실행으로 가는 링크,
 * 있으면 패키지 필터 · 요약 표 · 패키지별 근거다.
 */
export const PackagesView = ({
  run,
  data,
  alternatives,
}: {
  run: RunArtifact;
  data: RunData;
  alternatives: string[] | null;
}) => {
  const { query, setQuery } = data;
  const { runId, profile } = run.metadata;
  const surfaces = run.packageSurfaces;

  if (surfaces.length === 0) {
    return (
      <StatusNotice
        state={unsupportedState({
          section: '패키지 표면',
          runId,
          profile,
          collectProfile: 'static',
          alternatives,
        })}
      >
        <AlternativeRuns screen="packages" runs={alternatives} />
      </StatusNotice>
    );
  }

  const shown = query.package
    ? surfaces.filter((surface) => surface.name === query.package)
    : surfaces;

  return (
    <>
      <Section title="필터">
        <LabeledSelect
          label="패키지"
          value={query.package ?? ''}
          options={[
            { value: '', label: '전체' },
            ...surfaces.map((surface) => ({ value: surface.name, label: surface.name })),
          ]}
          onChange={(value) => setQuery({ ...query, package: value || undefined })}
        />
        <p role="status" aria-live="polite" className="typo-body-small text-text-default">
          {`패키지 ${surfaces.length}개 중 ${shown.length}개 표시`}
        </p>
      </Section>
      {shown.length === 0 ? (
        <StatusNotice state={noMatchState(`package ${query.package}`)} />
      ) : (
        <>
          <Section title="요약">
            <SurfaceTable surfaces={shown} />
          </Section>
          <Section title="패키지별 근거">
            {shown.map((surface) => (
              <SurfaceDetail key={surface.name} surface={surface} />
            ))}
          </Section>
        </>
      )}
    </>
  );
};
