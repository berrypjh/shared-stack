import { Facts, InspectorHeader, InspectorSection, Pager } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { catalog } from '@/data';
import type { Entity } from '@/lib/catalog/entities';
import type { Inspection } from '@/lib/catalog/inspection';
import { GAP_KIND, PLATFORM, VISIBILITY } from '@/lib/catalog/labels';
import { groupByOwner } from '@/lib/catalog/reference-groups';

import {
  countByRunner,
  DocumentRows,
  SourceGroups,
  sourceSummary,
  TestRows,
} from '../entity/inspector-parts';
import { FileRow } from '../source/file-row';

const OVERVIEW = { id: 'inspector-overview', title: '개요', icon: 'overview' } as const;
const SOURCE = { id: 'inspector-source', title: '소스', icon: 'source' } as const;
const DOCS = { id: 'inspector-documents', title: '문서', icon: 'document' } as const;
const TESTS = { id: 'inspector-tests', title: '테스트', icon: 'test' } as const;

/** 공개 여부의 근거 한 줄. 값은 매니페스트의 `private` 에서 온다. */
const VISIBILITY_REASON = {
  public: 'package.json 에 private 이 없어 npm 에 배포됨',
  internal: 'package.json 의 private: true. 워크스페이스 안에서만 씀',
} as const;

/**
 * 패키지의 근거 — 플러그인 · 작업 흐름 상세 정보와 같은 네 구획이다. 개요는 요약 · 공개 여부 · 플랫폼과 위치,
 * 소스 · 문서 · 테스트는 카탈로그가 드는 근거다. 진입점 · 관계는 가운데 화면에 있다.
 * 섹션은 늘 같은 순서로 모두 보이고, 비면 이유를 쓴다.
 */
export const PackageInspector = ({
  inspection,
  siblings,
}: {
  inspection: Inspection;
  siblings: Entity[];
}) => {
  const { overview, visibility } = inspection;
  const sourceCount = groupByOwner(catalog, inspection.source).reduce(
    (n, g) => n + g.refs.length,
    0,
  );
  return (
    <div className="flex flex-col divide-y divide-stroke-light">
      <InspectorHeader
        kind="패키지"
        title={inspection.title}
        pager={<Pager entities={siblings} current={inspection.id} unit="패키지" />}
        sections={[OVERVIEW, SOURCE, DOCS, TESTS]}
      >
        <p className="typo-caption-small text-text-light">
          {VISIBILITY[visibility.value]} · {PLATFORM[inspection.platform]}
        </p>
      </InspectorHeader>
      <InspectorSection {...OVERVIEW}>
        <Facts
          facts={[
            { term: '요약', detail: inspection.purpose },
            {
              term: '공개 여부',
              detail: `${VISIBILITY[visibility.value]} — ${VISIBILITY_REASON[visibility.value]}`,
            },
            { term: '플랫폼', detail: PLATFORM[inspection.platform] },
            {
              term: 'Nx 프로젝트',
              detail: <span className="devhub-code">{overview.nxProject}</span>,
            },
          ]}
        />
        <List className="flex flex-col gap-sm">
          <FileRow source={overview.root} label="위치" />
        </List>
        {overview.gaps.length > 0 && (
          <List className="flex flex-col gap-xs">
            {overview.gaps.map((gap) => (
              <ListItem key={gap.note} className="typo-caption-small text-text-warning">
                {GAP_KIND[gap.kind]} — {gap.note}
              </ListItem>
            ))}
          </List>
        )}
      </InspectorSection>
      <InspectorSection {...SOURCE} count={sourceCount} summary={sourceSummary(inspection.source)}>
        <SourceGroups refs={inspection.source} />
      </InspectorSection>
      <InspectorSection {...DOCS} count={inspection.documents.length}>
        <DocumentRows items={inspection.documents} empty={inspection.empty.documents} />
      </InspectorSection>
      <InspectorSection
        {...TESTS}
        count={inspection.tests.length}
        summary={countByRunner(inspection.tests)}
      >
        <TestRows items={inspection.tests} empty={inspection.empty.tests} />
      </InspectorSection>
    </div>
  );
};
