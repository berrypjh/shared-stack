import { WorkspaceSection } from '@berrypjh/devhub-ui';
import { Table, TableScroll } from '@berrypjh/react-ui';

import { useParams } from 'react-router-dom';

import { Code, EntityDetail, type Fact, ListFact } from '@/components/entity/entity-detail';
import { catalog } from '@/data';
import type { Package, Setting } from '@/domain/model';
import { PACKAGE_KIND, PLATFORM } from '@/lib/catalog/labels';

/** 공개 여부는 매니페스트의 `private` 에서 온다. Internal 은 글자로 분명히 쓴다. */
const factsOf = (id: string): Fact[] | undefined => {
  const pkg = catalog.packages.find((p) => p.id === id);
  if (!pkg) return undefined;
  return [
    ['종류', PACKAGE_KIND[pkg.kind]],
    [
      '공개 여부',
      pkg.visibility === 'public'
        ? '공개 — npm 에 배포된다'
        : 'Internal — private, 배포되지 않는다',
    ],
    ['플랫폼', PLATFORM[pkg.platform]],
    ['패키지 이름', <Code key="name">{pkg.packageName}</Code>],
    ['진입점', <ListFact key="entries" items={pkg.entries.map((entry) => entry.specifier)} />],
  ];
};

/** 설정 파일 하나의 규칙 표. 제목은 소비자가 그 파일을 import 하는 specifier 다. */
const SettingsTable = ({ specifier, items }: { specifier: string; items: readonly Setting[] }) => (
  <div className="flex flex-col gap-sm">
    <h3 className="devhub-code text-text-light">{specifier}</h3>
    <TableScroll label={`표: ${specifier} 설정`} className="rounded-md border border-stroke-light">
      <Table hiddenCaption>
        <caption>{specifier} 설정</caption>
        <thead>
          {/* 규칙 열은 내용만큼, 값 열은 1/4, 설명이 나머지를 가진다. 자동 너비는 값 열이 설명을 눌렀다. */}
          <tr>
            <th scope="col" className="w-px whitespace-nowrap">
              규칙
            </th>
            <th scope="col" className="w-1/4">
              값
            </th>
            <th scope="col">설명</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.evidence.symbol}>
              <td className="whitespace-nowrap">
                <Code>{item.evidence.symbol}</Code>
              </td>
              <td>
                <Code>{item.value}</Code>
              </td>
              <td>{item.note}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableScroll>
  </div>
);

/** 설정 패키지가 정하는 규칙. 파일마다 표 하나이고, 키와 값은 파일 원문, 설명은 카탈로그가 적은 것이다. */
const Settings = ({ pkg }: { pkg: Package }) => {
  const paths = [...new Set(pkg.settings?.map((item) => item.evidence.path))];
  return (
    <WorkspaceSection id="package-settings" title="설정">
      {/* 파일마다 표 하나. 표 사이는 섹션 안의 기본 간격보다 넓게 띄운다. */}
      <div className="flex flex-col gap-2xl">
        {paths.map((path) => (
          <SettingsTable
            key={path}
            specifier={pkg.entries.find((entry) => entry.target === path)?.specifier ?? path}
            items={pkg.settings?.filter((item) => item.evidence.path === path) ?? []}
          />
        ))}
      </div>
    </WorkspaceSection>
  );
};

/** `/packages/<id>` */
export const PackagePage = () => {
  const { id = '' } = useParams();
  const pkg = catalog.packages.find((p) => p.id === id);
  return (
    <EntityDetail sectionId="packages" id={id} facts={factsOf}>
      {pkg?.settings && <Settings pkg={pkg} />}
    </EntityDetail>
  );
};
