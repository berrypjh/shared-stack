import { DataTable } from '@berrypjh/devhub-ui';
import type { PackageSurface } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { Mono } from '@/components/evaluation/mono';
import { Section } from '@/components/evaluation/section';
import { catalogText, EMITTED_HEADERS, evidenceKindText } from '@/lib/evaluation/packages';

const Manifests = ({ surface }: { surface: PackageSurface }) => (
  <p className="typo-body-small text-text-light">
    선언: <Mono>{surface.sourceManifest.path}</Mono>
    {surface.emittedManifest && (
      <>
        {' '}
        · 빌드 사본 <Mono>{surface.emittedManifest.path}</Mono> (
        {surface.emittedManifest.exportsRemoved ? 'exports 제거됨' : 'exports 남아 있음'})
      </>
    )}
  </p>
);

const EmittedTable = ({ surface }: { surface: PackageSurface }) => (
  <DataTable caption={`${surface.name} exports 대상`} headers={EMITTED_HEADERS}>
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
);

const Catalog = ({ catalog }: { catalog: NonNullable<PackageSurface['catalog']> }) => (
  <div className="flex flex-col gap-xs typo-body-small">
    <p className="m-0">
      catalog <Mono>{catalog.path}</Mono> — {catalogText(catalog)}
      {catalog.reason ? ` (${catalog.reason})` : ''}
    </p>
    {catalog.deprecated.length > 0 && (
      <p className="m-0">{`deprecated: ${catalog.deprecated.join(', ')}`}</p>
    )}
    {catalog.typeOmittedProps.length > 0 && (
      <p className="m-0">{`타입 생략 prop: ${catalog.typeOmittedProps.join(', ')}`}</p>
    )}
  </div>
);

const TestLocations = ({ tests }: { tests: PackageSurface['tests'] }) => (
  <div className="typo-body-small">
    <p className="m-0 text-text-light">
      이 표면을 고정하는 기존 test 위치 — 이 수집은 실행하지 않았다.
    </p>
    {tests.length === 0 ? (
      <p className="m-0">연결된 test 위치 없음</p>
    ) : (
      <List className="flex flex-col gap-xs">
        {tests.map((test) => (
          <ListItem key={`${test.path}:${test.line}`}>
            <Mono>{`${test.path}:${test.line}`}</Mono> {test.title} — 실행 안 함 (
            {evidenceKindText(test.evidenceKind)})
          </ListItem>
        ))}
      </List>
    )}
  </div>
);

/** 패키지 하나의 근거: manifest · exports 대상 · catalog · test 위치(실행 안 함). */
export const SurfaceDetail = ({ surface }: { surface: PackageSurface }) => (
  <Section title={surface.name} level={3}>
    <Manifests surface={surface} />
    <EmittedTable surface={surface} />
    {surface.catalog && <Catalog catalog={surface.catalog} />}
    <TestLocations tests={surface.tests} />
  </Section>
);
