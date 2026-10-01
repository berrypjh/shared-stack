import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import type { ArchEdge, ArchitectureModel } from '@/lib/catalog/architecture';
import { RELATION_KIND } from '@/lib/catalog/labels';

import { NoMatch } from './architecture-map';
import { kindLine, nodeHref, platformLine } from './presentation';

const LINK = 'text-text-link underline-offset-2 hover:underline';

/** 관계 한 줄: 상대 노드(링크)와 관계 종류. 그림의 선 라벨과 같은 글이다. */
const EdgeRows = ({
  edges,
  otherEnd,
  labelOf,
  query,
}: {
  edges: ArchEdge[];
  otherEnd: (edge: ArchEdge) => string;
  labelOf: (id: string) => string;
  query: string;
}) => (
  <List className="flex flex-col gap-xs">
    {edges.map((edge) => (
      <ListItem key={edge.id}>
        <Link to={nodeHref(otherEnd(edge), query)} className={LINK}>
          {labelOf(otherEnd(edge))}
        </Link>
        <span className="text-text-light"> · {RELATION_KIND[edge.kind]}</span>
      </ListItem>
    ))}
  </List>
);

/**
 * 그림을 글로: 노드마다 종류 · 공개 여부 · 플랫폼 · 위치, 그리고 그려진 선을 나가는 쪽 · 들어오는 쪽으로.
 * 그림이 보여 주는 것을 모두 여기서 읽을 수 있다(선 방향은 그림의 화살표 방향이다).
 */
export const ArchitectureOutline = ({
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
  const labelOf = (id: string) => model.nodes.find((node) => node.id === id)?.label ?? id;

  return (
    <ul aria-label="구성 요소" className="flex flex-col divide-y divide-stroke-light">
      {model.nodes.map((node) => {
        const outgoing = model.edges.filter((edge) => edge.source === node.id);
        const incoming = model.edges.filter((edge) => edge.target === node.id);
        const selected = node.id === selectedId;
        return (
          <li key={node.id}>
            <article aria-labelledby={`outline-${node.id}`} className="flex flex-col gap-sm py-lg">
              <h3 id={`outline-${node.id}`} className="typo-body-small-strong">
                <Link
                  to={nodeHref(node.id, query)}
                  aria-current={selected ? 'page' : undefined}
                  className={LINK}
                >
                  {node.label}
                </Link>
                {selected && <span className="typo-caption-small"> · 선택됨</span>}
              </h3>
              <p className="typo-caption-small text-text-light">
                {kindLine(node)} · {platformLine(node)} ·{' '}
                <span className="font-mono">{node.root}</span>
              </p>
              <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-md gap-y-sm typo-body-small">
                {outgoing.length > 0 && (
                  <>
                    <dt className="text-text-light">나가는 선 {outgoing.length}</dt>
                    <dd>
                      <EdgeRows
                        edges={outgoing}
                        otherEnd={(edge) => edge.target}
                        labelOf={labelOf}
                        query={query}
                      />
                    </dd>
                  </>
                )}
                {incoming.length > 0 && (
                  <>
                    <dt className="text-text-light">들어오는 선 {incoming.length}</dt>
                    <dd>
                      <EdgeRows
                        edges={incoming}
                        otherEnd={(edge) => edge.source}
                        labelOf={labelOf}
                        query={query}
                      />
                    </dd>
                  </>
                )}
                {outgoing.length + incoming.length === 0 && (
                  <>
                    <dt className="text-text-light">관계</dt>
                    <dd className="text-text-light">없음</dd>
                  </>
                )}
              </dl>
            </article>
          </li>
        );
      })}
    </ul>
  );
};
