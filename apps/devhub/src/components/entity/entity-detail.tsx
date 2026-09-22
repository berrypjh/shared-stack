import {
  Inspector,
  useDocumentTitle,
  WorkspaceFrame,
  WorkspaceHeader,
  WorkspaceSection,
} from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import { catalog } from '@/data';
import { downstreamIds, upstreamIds, verifiersOf } from '@/domain/graph';
import { findSection, type SectionId } from '@/lib/catalog/entities';
import { inspect } from '@/lib/catalog/inspection';

import { EntityLink } from '../ui/entity-link';
import { SECTION_ICON } from '../ui/view-icons';

import { EntityNotFound, placeOf } from './entity-not-found';
import { InspectorPanel } from './inspector-panel';

export type Fact = [term: string, detail: ReactNode];

export const ROWS = 'grid grid-cols-[7rem_minmax(0,1fr)] gap-x-md gap-y-sm typo-body-small';

export const Code = ({ children }: { children: string }) => (
  <span className="devhub-code">{children}</span>
);

const Links = ({ ids }: { ids: string[] }) =>
  ids.length ? (
    <span className="flex flex-wrap gap-x-md">
      {[...new Set(ids)].map((id) => (
        <EntityLink key={id} id={id} />
      ))}
    </span>
  ) : (
    <span className="text-text-light">없음</span>
  );

/**
 * 앱 · 패키지 · 도구 항목 화면의 공통 문법: 가운데는 이름 · 목적 · 사실 · 관계 요약,
 * 오른쪽은 근거(`InspectorPanel`). 없는 ID 는 "카탈로그에 없는 항목"이다.
 */
export const EntityDetail = ({
  sectionId,
  id,
  facts,
}: {
  sectionId: SectionId;
  id: string;
  facts: (id: string) => Fact[] | undefined;
}) => {
  const section = findSection(sectionId);
  const entity = section.entities.find((e) => e.id === id);
  const inspection = entity ? inspect(catalog, id) : undefined;
  useDocumentTitle(entity ? entity.label : `${section.title}에 없는 항목`);
  const rows = entity && facts(id);
  if (!entity || !inspection || !rows) return <EntityNotFound section={placeOf(section)} id={id} />;

  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader
          eyebrow={section.title}
          icon={SECTION_ICON[section.id]}
          title={entity.label}
        />
        <p className="typo-body-small">{inspection.purpose}</p>
        <WorkspaceSection id="entity-facts" title="사실">
          <dl className={ROWS}>
            {rows.map(([term, detail]) => (
              <div key={term} className="contents">
                <dt className="text-text-light">{term}</dt>
                <dd className="min-w-0">{detail}</dd>
              </div>
            ))}
          </dl>
        </WorkspaceSection>
        <WorkspaceSection id="entity-relations" title="관계">
          <dl className={ROWS}>
            <dt className="text-text-light">기대는 쪽</dt>
            <dd>
              <Links ids={upstreamIds(catalog, id)} />
            </dd>
            <dt className="text-text-light">기대오는 쪽</dt>
            <dd>
              <Links ids={downstreamIds(catalog, id)} />
            </dd>
            <dt className="text-text-light">검증하는 쪽</dt>
            <dd>
              <Links ids={verifiersOf(catalog, id).map((relation) => relation.from)} />
            </dd>
          </dl>
        </WorkspaceSection>
      </WorkspaceFrame>
      <Inspector>
        <InspectorPanel inspection={inspection} siblings={section.entities} unit={section.title} />
      </Inspector>
    </>
  );
};

/** 항목 목록 한 줄씩. */
export const ListFact = ({ items }: { items: string[] }) => (
  <List className="flex flex-col gap-2xs">
    {items.map((item) => (
      <ListItem key={item}>
        <Code>{item}</Code>
      </ListItem>
    ))}
  </List>
);
