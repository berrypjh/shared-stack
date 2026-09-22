import { CanvasEdges, CanvasViewport, INSPECTOR_ID, type Rect } from '@berrypjh/devhub-ui';
import { SkipLink } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import type { ArchitectureModel, ArchNode } from '@/lib/catalog/architecture';
import { NODE } from '@/lib/catalog/architecture-layout';
import { RELATION_KIND } from '@/lib/catalog/labels';

import { boxOf, DASH, kindLine, LEGEND, nodeHref, platformLine } from './presentation';

/** 필터가 아무것도 남기지 않았을 때. 그림과 목록이 같은 글을 쓴다. */
export const NoMatch = ({ clearHref }: { clearHref: string }) => (
  <div
    role="status"
    className="flex flex-col gap-sm rounded-lg border border-dashed border-stroke-default p-xl typo-body-small"
  >
    <p>조건에 맞는 구성 요소가 없습니다.</p>
    <Link to={clearHref} className="self-start text-text-link underline-offset-2 hover:underline">
      필터 모두 해제
    </Link>
  </div>
);

const rectOf = (node: ArchNode): Rect => ({ x: node.x, y: node.y, ...NODE });

/**
 * 노드 하나는 그 노드 주소로 가는 진짜 링크다. 포커스를 받으면 보기 안으로 옮기고,
 * 고른 노드 바로 뒤에 상세 정보로 가는 건너뛰기 링크가 온다.
 */
const NodeItem = ({
  node,
  query,
  selected,
  onFocus,
}: {
  node: ArchNode;
  query: string;
  selected: boolean;
  onFocus: (rect: Rect) => void;
}) => (
  <li
    className="absolute"
    style={{ left: node.x, top: node.y, width: NODE.width, height: NODE.height }}
  >
    <Link
      to={nodeHref(node.id, query)}
      aria-current={selected ? 'page' : undefined}
      onFocus={() => onFocus(rectOf(node))}
      className={[
        'flex h-full flex-col gap-2xs rounded-lg bg-background-surface p-md text-text-default shadow-xs hover:border-stroke-dark',
        boxOf(node),
        selected
          ? 'outline-2 outline-offset-2 outline-stroke-primary bg-[image:linear-gradient(var(--ds-background-selected),var(--ds-background-selected))]'
          : '',
      ].join(' ')}
    >
      <span className="typo-caption-small text-text-light">
        {kindLine(node)}
        {selected && (
          <span aria-hidden="true" className="typo-body-small-strong text-text-default">
            {' '}
            · 선택됨
          </span>
        )}
      </span>
      <span className="truncate typo-body-small-strong">{node.label}</span>
      <span className="truncate devhub-code text-text-light">{node.root}</span>
      <span className="typo-caption-small text-text-light">{platformLine(node)}</span>
    </Link>
    {selected && <SkipLink targetId={INSPECTOR_ID}>이 구성 요소의 상세 정보로 이동</SkipLink>}
  </li>
);

/** 카탈로그 관계로 그린 현재 구조. URL 의 노드가 선택이다. */
export const ArchitectureMap = ({
  model,
  selectedId,
  query,
  clearHref,
}: {
  model: ArchitectureModel;
  selectedId?: string;
  query: string;
  clearHref: string;
}) => {
  if (model.nodes.length === 0) return <NoMatch clearHref={clearHref} />;
  const selected = model.nodes.find((node) => node.id === selectedId);
  const summary = `구성 요소 ${model.nodes.length}개 · 관계 ${model.edges.length}개 · 선택: ${
    selected ? selected.label : '없음'
  }`;
  const edges = model.edges.map((edge) => ({
    id: edge.id,
    path: edge.path,
    dash: DASH[edge.kind] ?? undefined,
    label: { ...edge.label, text: RELATION_KIND[edge.kind] },
  }));

  return (
    <CanvasViewport
      label="아키텍처 그림"
      content={{ width: model.width, height: model.height }}
      legend={LEGEND}
      summary={summary}
      selected={selected && rectOf(selected)}
    >
      {({ reveal }) => (
        <>
          <CanvasEdges edges={edges} width={model.width} height={model.height} />
          <ol aria-label="구성 요소" className="absolute top-0 left-0">
            {model.nodes.map((node) => (
              <NodeItem
                key={node.id}
                node={node}
                query={query}
                selected={node.id === selectedId}
                onFocus={reveal}
              />
            ))}
          </ol>
        </>
      )}
    </CanvasViewport>
  );
};
