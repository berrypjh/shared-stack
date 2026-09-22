import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import type { ArchitectureModel, ArchNode } from '@/lib/catalog/architecture';
import { entityById } from '@/lib/catalog/entities';
import { RELATION_KIND } from '@/lib/catalog/labels';

import { kindLine, nodeHref, platformLine } from './presentation';

const LINK = 'text-text-link underline-offset-2 hover:underline';

/**
 * 고른 노드: 종류 · 플랫폼 · 위치, 전체 관계(필터와 상관없이)와 근거 파일, 항목 화면 링크.
 * 관계 링크는 상대 노드를 고르며 `#devhub-inspector` 로 상세 정보에 머문다.
 */
export const NodeInspector = ({
  node,
  model,
  query,
}: {
  node: ArchNode;
  model: ArchitectureModel;
  query: string;
}) => {
  const edges = model.edges.filter((edge) => edge.source === node.id || edge.target === node.id);
  const labelOf = (id: string) => model.nodes.find((n) => n.id === id)?.label ?? id;
  const entity = entityById(node.id);
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <p className="typo-caption-small text-text-light">{kindLine(node)}</p>
        <h2 className="typo-body-medium-strong">{node.label}</h2>
        <p className="typo-caption-small text-text-light">
          {platformLine(node)} · <span className="font-mono">{node.root}</span>
        </p>
        {entity && (
          <Link to={entity.href} className={`typo-body-small ${LINK}`}>
            항목 화면에서 보기
          </Link>
        )}
      </header>
      <section aria-labelledby="node-relations" className="flex flex-col gap-sm">
        <h3 id="node-relations" className="typo-body-small-strong">
          관계 <span className="typo-caption-small text-text-light">{edges.length}</span>
        </h3>
        {edges.length ? (
          <List className="flex flex-col gap-md">
            {edges.map((edge) => {
              const other = edge.source === node.id ? edge.target : edge.source;
              const arrow = edge.source === node.id ? '→' : '←';
              return (
                <ListItem key={edge.id} className="flex flex-col gap-2xs typo-body-small">
                  <span>
                    {arrow}{' '}
                    <Link to={`${nodeHref(other, query)}#devhub-inspector`} className={LINK}>
                      {labelOf(other)}
                    </Link>{' '}
                    <span className="text-text-light">· {RELATION_KIND[edge.kind]}</span>
                  </span>
                  <span className="devhub-code text-text-light">
                    근거 {edge.relation.evidence.path}
                  </span>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <p className="typo-body-small text-text-light">
            없음 — 카탈로그에 이 구성 요소의 관계가 없다
          </p>
        )}
      </section>
    </div>
  );
};
