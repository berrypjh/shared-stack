import { Facts, INSPECTOR_ID, InspectorHeader, InspectorSection, Pager } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { catalog } from '@/data';
import type { Journey } from '@/domain/model';
import type { Entity } from '@/lib/catalog/entities';
import { groupByOwner } from '@/lib/catalog/reference-groups';

import {
  countByRunner,
  DocumentRows,
  SourceGroups,
  sourceSummary,
  TestRows,
} from '../entity/inspector-parts';
import { EntityLink } from '../ui/entity-link';

const OVERVIEW = { id: 'inspector-overview', title: '개요', icon: 'overview' } as const;
const SOURCE = { id: 'inspector-source', title: '소스', icon: 'source' } as const;
const DOCS = { id: 'inspector-documents', title: '문서', icon: 'document' } as const;
const TESTS = { id: 'inspector-tests', title: '테스트', icon: 'test' } as const;

const unique = <T,>(items: T[]) => [...new Set(items)];

/**
 * 단계를 고르지 않았을 때의 근거 — 플러그인 상세 정보와 같은 문법이다. 개요는 목표와 담당,
 * 소스 · 문서 · 테스트는 모든 단계가 드는 근거를 합친 것이다. 섹션은 늘 같은 순서로 모두 보이고, 비면 이유를 쓴다.
 */
export const JourneyInspector = ({
  journey,
  siblings,
}: {
  journey: Journey;
  siblings: Entity[];
}) => {
  const steps = journey.steps;
  const owners = unique(steps.map((step) => step.owner));
  const source = steps.flatMap((step) => step.source);
  const sourceCount = groupByOwner(catalog, source).reduce((n, g) => n + g.refs.length, 0);
  const documents = unique(steps.flatMap((step) => step.docs)).flatMap(
    (id) => catalog.documents.find((doc) => doc.id === id) ?? [],
  );
  const tests = unique(steps.flatMap((step) => step.tests)).flatMap(
    (id) => catalog.tests.find((suite) => suite.id === id) ?? [],
  );
  return (
    <div className="flex flex-col divide-y divide-stroke-light">
      <InspectorHeader
        kind="작업 흐름"
        title={journey.title}
        pager={<Pager entities={siblings} current={journey.id} unit="흐름" />}
        sections={[OVERVIEW, SOURCE, DOCS, TESTS]}
      >
        <p className="typo-caption-small text-text-light">
          단계 {steps.length}개 — 단계를 고르면 그 단계의 근거가 여기에 나옴
        </p>
      </InspectorHeader>
      <InspectorSection {...OVERVIEW}>
        <Facts
          facts={[
            { term: '목표', detail: journey.goal },
            {
              term: '담당',
              detail: (
                <List className="flex flex-col gap-xs">
                  {owners.map((owner) => (
                    <ListItem key={owner}>
                      <EntityLink id={owner} hash={INSPECTOR_ID} />
                    </ListItem>
                  ))}
                </List>
              ),
            },
          ]}
        />
      </InspectorSection>
      <InspectorSection {...SOURCE} count={sourceCount} summary={sourceSummary(source)}>
        <SourceGroups refs={source} empty="어느 단계도 저장소 소스를 들지 않음" />
      </InspectorSection>
      <InspectorSection {...DOCS} count={documents.length}>
        <DocumentRows items={documents} empty="어느 단계도 문서를 근거로 들지 않음" />
      </InspectorSection>
      <InspectorSection {...TESTS} count={tests.length} summary={countByRunner(tests)}>
        <TestRows items={tests} empty="어느 단계도 테스트 묶음을 들지 않음" />
      </InspectorSection>
    </div>
  );
};
