import { useParams } from 'react-router-dom';

import { Code, EntityDetail, type Fact } from '@/components/entity/entity-detail';
import { catalog } from '@/data';

const factsOf = (id: string): Fact[] | undefined => {
  const tool = catalog.tools.find((t) => t.id === id);
  if (!tool) return undefined;
  return [
    ['위치', <Code key="root">{tool.root}</Code>],
    ['형태', tool.rootKind === 'file' ? '스크립트 파일 하나' : '디렉터리'],
    [
      'Nx 프로젝트',
      tool.nxProject ? (
        <Code key="nx">{tool.nxProject}</Code>
      ) : (
        '없음 — Nx 프로젝트가 아니라 nx affected 에 걸리지 않는다'
      ),
    ],
  ];
};

/** `/engineering/<id>` */
export const ToolPage = () => {
  const { id = '' } = useParams();
  return <EntityDetail sectionId="engineering" id={id} facts={factsOf} />;
};
