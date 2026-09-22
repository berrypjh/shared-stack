import { WorkspaceSection } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { catalog } from '@/data';
import type { Relation } from '@/domain/model';
import { RELATION_KIND } from '@/lib/catalog/labels';

import { EntityLink } from '../ui/entity-link';

const KINDS: Relation['kind'][] = [
  'build-dependency',
  'consumer-dependency',
  'generated-artifact',
  'verification',
];

/** 관계의 선언 방식, 생성물 경로, 또는 검증 내용. */
const detailOf = (relation: Relation) => {
  switch (relation.kind) {
    case 'build-dependency':
    case 'consumer-dependency':
      return relation.declaredBy;
    case 'generated-artifact':
      return relation.artifacts.join(' · ');
    case 'verification':
      return relation.summary;
  }
};

/** 모든 관계를 종류별 글로. 근거 파일과 함께 — 필터를 타지 않는 정본 목록이다. */
export const RelationLists = () =>
  KINDS.map((kind) => {
    const relations = catalog.relations.filter((relation) => relation.kind === kind);
    return (
      <WorkspaceSection
        key={kind}
        id={`relations-${kind}`}
        title={`${RELATION_KIND[kind]} ${relations.length}`}
      >
        <List className="flex flex-col divide-y divide-stroke-light">
          {relations.map((relation) => (
            <ListItem key={relation.id} className="flex flex-col gap-2xs py-sm">
              <span className="typo-body-small">
                <EntityLink id={relation.from} /> → <EntityLink id={relation.to} />
              </span>
              <span className="typo-caption-small break-all text-text-light">
                {detailOf(relation)} · 근거{' '}
                <span className="font-mono">{relation.evidence.path}</span>
              </span>
            </ListItem>
          ))}
        </List>
      </WorkspaceSection>
    );
  });
