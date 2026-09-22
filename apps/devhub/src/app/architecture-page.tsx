import {
  Inspector,
  useDocumentTitle,
  ViewSwitch,
  WorkspaceFrame,
  WorkspaceHeader,
  WorkspaceSection,
} from '@berrypjh/devhub-ui';

import { useLocation, useSearchParams } from 'react-router-dom';

import { ArchitectureMap } from '@/components/architecture/architecture-map';
import { ArchitectureOutline } from '@/components/architecture/architecture-outline';
import { FilterBar } from '@/components/architecture/filter-bar';
import { NodeInspector } from '@/components/architecture/node-inspector';
import { RelationLists } from '@/components/architecture/relation-lists';
import { EntityNotFound } from '@/components/entity/entity-not-found';
import { catalog } from '@/data';
import { architectureModel } from '@/lib/catalog/architecture';
import { filterModel, filterQuery, parseFilters } from '@/lib/catalog/architecture-filters';

const MODEL = architectureModel(catalog);
const PLACE = { title: '아키텍처', path: '/architecture', icon: 'architecture' } as const;

/** `/architecture/<id>` 의 id. route 가 아니라 주소에서 읽는다 — 이 화면은 선택이 바뀌어도 남는다. */
const selectedIdOf = (pathname: string) => pathname.split('/')[2] || undefined;

/**
 * `/architecture` · `/architecture/<id>`: 카탈로그 관계로 그린 구조. 그림과 목록은 같은 필터 · 선택을 쓴다.
 * 이 화면은 선택이 바뀌어도 다시 그려지지 않아(한 route element) 그림의 이동 · 확대와 보기 방식이 남는다.
 */
export const ArchitecturePage = () => {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const filters = parseFilters(params);
  const query = filterQuery(filters);
  const selectedId = selectedIdOf(pathname);
  const node = MODEL.nodes.find((n) => n.id === selectedId);
  const model = filterModel(MODEL, filters);
  const basePath = selectedId ? `/architecture/${selectedId}` : '/architecture';
  useDocumentTitle(node ? `${node.label} · 아키텍처` : '아키텍처');

  if (selectedId && !node) return <EntityNotFound section={PLACE} id={selectedId} />;

  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader eyebrow="아키텍처" icon="architecture" title="현재 구조" />
        <p className="typo-body-small">
          카탈로그 관계만 그렸다. 선 하나가 관계 하나이고, 종류는 선 모양과 라벨로 나뉜다. 화살표는
          흐름 방향이다: 의존은 기대는 대상 → 기대는 쪽, 생성물은 만든 쪽 → 싣는 쪽, 검증은 검증하는
          쪽 → 대상.
        </p>
        <WorkspaceSection id="architecture-map" title="구성 요소와 관계">
          <ViewSwitch
            label="아키텍처"
            tools={<FilterBar basePath={basePath} active={filters} />}
            canvas={
              <ArchitectureMap
                model={model}
                selectedId={selectedId}
                query={query}
                clearHref={basePath}
              />
            }
            list={
              <ArchitectureOutline
                model={model}
                selectedId={selectedId}
                query={query}
                clearHref={basePath}
              />
            }
          />
        </WorkspaceSection>
        <RelationLists />
      </WorkspaceFrame>
      <Inspector>{node && <NodeInspector node={node} model={MODEL} query={query} />}</Inspector>
    </>
  );
};
