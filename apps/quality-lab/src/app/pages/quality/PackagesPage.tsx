import type { PackageSurface, RunArtifact } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { DataTable } from '../../components/DataTable';
import { LabeledSelect } from '../../components/LabeledSelect';
import { Mono } from '../../components/Mono';
import { RunBar } from '../../components/RunBar';
import { Section } from '../../components/Section';
import { StatusNotice } from '../../components/StatusNotice';
import { REGENERATED_LABEL } from '../../data/labels';
import { queryString } from '../../data/query';
import { loadingState, noMatchState, unsupportedState } from '../../data/status';
import { type RunData, runsWith, useRunData, useSummaries } from '../../data/useRunData';
import { Page } from '../../ui';

const SPEC = { keys: ['run', 'package'] } as const;
const LINK = 'text-text-link underline underline-offset-2';

const present = <T extends { status: string }>(entries: T[]) =>
  entries.filter((entry) => entry.status === 'present').length;

const tokensCopyText = (copy: PackageSurface['tokensCopy']) => {
  if (copy === null) return '비교 대상 아님';
  if (copy.status === 'missing') return `없음 — ${copy.path}`;
  if (copy.identicalToDesignTokens === null) return '비교할 수 없음';
  return copy.identicalToDesignTokens ? '원본과 같음' : '원본과 다름';
};

const catalogText = (catalog: PackageSurface['catalog']) =>
  catalog === null
    ? '선언 안 함'
    : `${catalog.status} · ${REGENERATED_LABEL[catalog.regenerated]}${catalog.regeneratedReason ? ` — ${catalog.regeneratedReason}` : ''}`;

const SurfaceDetail = ({ surface }: { surface: PackageSurface }) => (
  <Section title={surface.name} level={3} card>
    <p className="text-text-light text-xsm">
      선언: <Mono>{surface.sourceManifest.path}</Mono>
      {surface.emittedManifest && (
        <>
          {' '}
          · 빌드 사본 <Mono>{surface.emittedManifest.path}</Mono> (
          {surface.emittedManifest.exportsRemoved ? 'exports 제거됨' : 'exports 남아 있음'})
        </>
      )}
    </p>
    <DataTable
      caption={`${surface.name} exports 대상`}
      headers={['subpath', '조건', 'target', '산출물']}
    >
      {surface.emitted.map((entry) => (
        <tr key={`${entry.subpath}-${entry.conditions.join('.')}-${entry.target}`}>
          <th scope="row">
            <Mono>{entry.subpath}</Mono>
          </th>
          <td>{entry.conditions.length > 0 ? entry.conditions.join(' › ') : '조건 없음'}</td>
          <td>
            <Mono>{entry.target}</Mono>
          </td>
          <td>{entry.status === 'present' ? '있음' : '없음'}</td>
        </tr>
      ))}
    </DataTable>
    {surface.catalog && (
      <div className="text-xsm leading-xsm flex flex-col gap-xs">
        <p className="m-0">
          catalog <Mono>{surface.catalog.path}</Mono> — {catalogText(surface.catalog)}
          {surface.catalog.reason ? ` (${surface.catalog.reason})` : ''}
        </p>
        {surface.catalog.deprecated.length > 0 && (
          <p className="m-0">{`deprecated: ${surface.catalog.deprecated.join(', ')}`}</p>
        )}
        {surface.catalog.typeOmittedProps.length > 0 && (
          <p className="m-0">{`타입 생략 prop: ${surface.catalog.typeOmittedProps.join(', ')}`}</p>
        )}
      </div>
    )}
    <div className="text-xsm leading-xsm">
      <p className="m-0 text-text-light">
        이 표면을 고정하는 기존 test 위치 — 이 수집은 실행하지 않았습니다.
      </p>
      {surface.tests.length === 0 ? (
        <p className="m-0">연결된 test 위치 없음</p>
      ) : (
        <List className="flex flex-col gap-xs">
          {surface.tests.map((test) => (
            <ListItem key={`${test.path}:${test.line}`}>
              <Mono>{`${test.path}:${test.line}`}</Mono> {test.title} — 실행 안 함 (
              {test.evidenceKind === 'source-assertion' ? 'source 단언' : '동작 단언'})
            </ListItem>
          ))}
        </List>
      )}
    </div>
  </Section>
);

const Packages = ({
  run,
  data,
  alternatives,
}: {
  run: RunArtifact;
  data: RunData;
  alternatives: string[];
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
        <List className="flex flex-wrap gap-sm text-xsm">
          {alternatives.map((id) => (
            <ListItem key={id}>
              <Link className={LINK} to={`/quality/packages${queryString({ run: id })}`}>
                {id}
              </Link>
            </ListItem>
          ))}
        </List>
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
        <p role="status" aria-live="polite" className="text-text-default text-xsm leading-xsm">
          {`패키지 ${surfaces.length}개 중 ${shown.length}개 표시`}
        </p>
      </Section>
      {shown.length === 0 ? (
        <StatusNotice state={noMatchState(`package ${query.package}`)} />
      ) : (
        <>
          <Section title="요약">
            <DataTable
              caption="패키지 표면"
              headers={[
                '패키지',
                '공개',
                'build',
                'exports 산출물',
                'bin',
                'tokens 복사본',
                'catalog',
                '근거 test',
              ]}
            >
              {shown.map((surface) => (
                <tr key={surface.name}>
                  <th scope="row">
                    <Mono>{surface.name}</Mono>
                  </th>
                  <td>{surface.private ? '비공개 (private)' : '공개'}</td>
                  <td>{surface.build}</td>
                  <td>{`${present(surface.emitted)}/${surface.emitted.length} 있음`}</td>
                  <td>
                    {surface.emittedBin.length === 0
                      ? '선언 안 함'
                      : `${present(surface.emittedBin)}/${surface.emittedBin.length} 있음`}
                  </td>
                  <td>{tokensCopyText(surface.tokensCopy)}</td>
                  <td>{catalogText(surface.catalog)}</td>
                  <td>{`${surface.tests.length}개 위치 · 실행 안 함`}</td>
                </tr>
              ))}
            </DataTable>
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

export const PackagesPage = () => {
  const data = useRunData('run', SPEC);
  const summaries = useSummaries(data.runIds);
  return (
    <Page path="/quality/packages">
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
      {data.run && (
        <Packages
          run={data.run}
          data={data}
          alternatives={runsWith(summaries, (summary) => summary.sections.packageSurfaces > 0)}
        />
      )}
    </Page>
  );
};
