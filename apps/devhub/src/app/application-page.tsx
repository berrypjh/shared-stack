import { useParams } from 'react-router-dom';

import { Code, EntityDetail, type Fact } from '@/components/entity/entity-detail';
import { catalog } from '@/data';
import { APP_ROLE, PLATFORM } from '@/lib/catalog/labels';

const factsOf = (id: string): Fact[] | undefined => {
  const app = catalog.applications.find((a) => a.id === id);
  if (!app) return undefined;
  return [
    ['역할', APP_ROLE[app.role]],
    ['플랫폼', PLATFORM[app.platform]],
    [
      '패키지 이름',
      app.packageName ? <Code key="name">{app.packageName}</Code> : '없음 — package.json 이 없다',
    ],
    ['Nx 프로젝트', <Code key="nx">{app.nxProject}</Code>],
  ];
};

/** `/applications/<id>` */
export const ApplicationPage = () => {
  const { id = '' } = useParams();
  return <EntityDetail sectionId="applications" id={id} facts={factsOf} />;
};
