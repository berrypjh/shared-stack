import { DataTable, DocumentSection } from '@berrypjh/devhub-ui';
import { List } from '@berrypjh/react-ui';

import { Code } from '@/components/entity/entity-detail';
import { FileRow } from '@/components/source/file-row';
import { EntityLink } from '@/components/ui/entity-link';
import type { Package, Setting } from '@/domain/model';
import type { Inspection, RelationItem } from '@/lib/catalog/inspection';
import { PACKAGE_KIND, PLATFORM, RELATION_KIND, VISIBILITY } from '@/lib/catalog/labels';

/** 패키지 이름과 분류 한 줄. 플러그인 화면의 버전 · 분류 줄과 같은 자리다. */
export const PackageMeta = ({ pkg }: { pkg: Package }) => (
  <p className="flex flex-wrap items-center gap-xs typo-body-small text-text-light">
    <Code>{pkg.packageName}</Code>
    <span aria-hidden="true">·</span>
    {PACKAGE_KIND[pkg.kind]}
    <span aria-hidden="true">·</span>
    {VISIBILITY[pkg.visibility]}
    <span aria-hidden="true">·</span>
    {PLATFORM[pkg.platform]}
  </p>
);

/**
 * 진입점은 package.json `exports`(없으면 main · files)에서만 온다. 파일 경로는 위치를 알리는
 * 글일 뿐 import 대상이 아니다 — 소비자는 specifier 로만 쓴다.
 */
export const Entries = ({ inspection }: { inspection: Inspection }) => {
  const { exports } = inspection;
  return (
    <DocumentSection id="package-entries" title="진입점">
      <p className="typo-body-small text-text-light">
        {exports.visibility === 'public'
          ? '소비자가 import 하는 경로. dist 안의 다른 파일을 직접 import 하지 않음'
          : '워크스페이스 안에서만 import 함. 배포되지 않아 소비자 API 가 아님'}
      </p>
      <DataTable caption="진입점" headers={['import 경로', '파일', '출처']} hiddenCaption>
        {exports.entries.map((entry) => (
          <tr key={entry.specifier}>
            <th scope="row">
              <Code>{entry.specifier}</Code>
            </th>
            <td>
              <Code>{entry.target}</Code>
            </td>
            <td>{entry.origin === 'build-output' ? '빌드 산출물' : '커밋된 파일'}</td>
          </tr>
        ))}
      </DataTable>
      <List className="flex flex-col gap-sm">
        <FileRow source={exports.manifest} label="exports 정의" />
        {exports.barrel && <FileRow source={exports.barrel} label="`.` 이 내보내는 것" />}
        {exports.guard && <FileRow source={exports.guard} label="표면 고정 테스트" />}
      </List>
    </DocumentSection>
  );
};

/** 설정 파일 하나의 규칙 표. 제목은 소비자가 그 파일을 import 하는 specifier 다. */
const SettingsTable = ({ specifier, items }: { specifier: string; items: readonly Setting[] }) => (
  <article aria-labelledby={`settings-${specifier}`} className="flex flex-col gap-md">
    <h3 id={`settings-${specifier}`} className="typo-body-medium-strong font-mono">
      {specifier}
    </h3>
    <DataTable caption={`${specifier} 설정`} headers={['규칙', '값', '설명']} hiddenCaption>
      {items.map((item) => (
        <tr key={item.evidence.symbol}>
          <th scope="row" className="whitespace-nowrap">
            <Code>{item.evidence.symbol}</Code>
          </th>
          <td>
            <Code>{item.value}</Code>
          </td>
          <td>{item.note}</td>
        </tr>
      ))}
    </DataTable>
  </article>
);

/** 설정 패키지가 정하는 규칙. 파일마다 표 하나이고, 키와 값은 파일 원문, 설명은 카탈로그가 적은 것이다. */
export const Settings = ({ pkg }: { pkg: Package }) => {
  const paths = [...new Set(pkg.settings?.map((item) => item.evidence.path))];
  return (
    <DocumentSection id="package-settings" title="설정">
      <div className="flex flex-col gap-2xl">
        {paths.map((path) => (
          <SettingsTable
            key={path}
            specifier={pkg.entries.find((entry) => entry.target === path)?.specifier ?? path}
            items={pkg.settings?.filter((item) => item.evidence.path === path) ?? []}
          />
        ))}
      </div>
    </DocumentSection>
  );
};

/** 관계 한 묶음의 표: 상대 항목 · 종류(생성물이면 파일, 검증이면 요지) · 근거 파일. */
const RelationTable = ({ title, items }: { title: string; items: RelationItem[] }) => (
  <div className="flex flex-col gap-sm">
    <h3 className="typo-body-medium-strong">{title}</h3>
    <DataTable caption={title} headers={['항목', '관계', '근거']} hiddenCaption>
      {items.map(({ relation, other }) => (
        <tr key={relation.id}>
          <th scope="row">
            <EntityLink id={other} />
          </th>
          <td>
            {RELATION_KIND[relation.kind]}
            {relation.kind === 'generated-artifact' && (
              <span className="block devhub-code text-text-light">
                {relation.artifacts.join(' · ')}
              </span>
            )}
            {relation.kind === 'verification' && (
              <span className="block typo-caption-small text-text-light">{relation.summary}</span>
            )}
          </td>
          <td>
            <Code>{relation.evidence.path}</Code>
          </td>
        </tr>
      ))}
    </DataTable>
  </div>
);

/**
 * 카탈로그 관계에서 유도한 위 · 아래 · 생성물 · 검증. 플러그인 화면처럼 있는 묶음만 그리고,
 * 관계가 하나도 없으면 절을 두지 않는다.
 */
export const Relations = ({ inspection }: { inspection: Inspection }) => {
  const groups = [
    { title: '기대는 쪽', items: inspection.upstream },
    { title: '기대오는 쪽', items: inspection.downstream },
    { title: '생성물', items: inspection.artifacts },
    { title: '검증', items: inspection.related },
  ].filter((group) => group.items.length > 0);
  if (!groups.length) return null;
  return (
    <DocumentSection id="package-relations" title="관계">
      <div className="flex flex-col gap-xl">
        {groups.map((group) => (
          <RelationTable key={group.title} title={group.title} items={group.items} />
        ))}
      </div>
    </DocumentSection>
  );
};
