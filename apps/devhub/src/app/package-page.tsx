import { useParams } from 'react-router-dom';

import { Code, EntityDetail, type Fact, ListFact } from '@/components/entity/entity-detail';
import { catalog } from '@/data';
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

/** `/packages/<id>` */
export const PackagePage = () => {
  const { id = '' } = useParams();
  return <EntityDetail sectionId="packages" id={id} facts={factsOf} />;
};
