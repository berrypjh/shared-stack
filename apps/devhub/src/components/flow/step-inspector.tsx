import {
  Empty,
  Facts,
  INSPECTOR_ID,
  InspectorHeader,
  InspectorSection,
  Pager,
} from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import type { StepInspection } from '@/lib/catalog/inspect-step';
import { GAP_KIND } from '@/lib/catalog/labels';

import {
  countByRunner,
  DocumentRows,
  SourceGroups,
  sourceSummary,
  TestRows,
} from '../entity/inspector-parts';
import { EntityLink, LINK } from '../ui/entity-link';

import { statusLine, stepHref } from './presentation';

const OVERVIEW = { id: 'step-overview', title: '개요', icon: 'overview' } as const;
const NEXT = { id: 'step-next', title: '다음 단계', icon: 'flow' } as const;
const SOURCE = { id: 'step-source', title: '소스', icon: 'source' } as const;
const TESTS = { id: 'step-tests', title: '테스트', icon: 'test' } as const;
const DOCS = { id: 'step-documents', title: '문서', icon: 'document' } as const;
const GAPS = { id: 'step-gaps', title: '근거 공백', icon: 'warning' } as const;

/**
 * 고른 단계의 근거: 동작 · 실행 위치 · 담당, 다음 단계, 소스 · 테스트 · 문서 · 공백.
 * 섹션은 늘 같은 순서로 보이고 비면 이유를 쓴다. 단계 링크는 `#devhub-inspector` 로 이 칸에 머문다.
 */
export const StepInspector = ({ inspection }: { inspection: StepInspection }) => {
  const { journey, step, context, empty } = inspection;
  const siblings = journey.steps.map((s, index) => ({
    id: s.id,
    label: `${index + 1}. ${s.intent}`,
    href: stepHref(journey.id, s.id),
  }));
  const gaps = step.gaps ?? [];
  return (
    <div className="flex flex-col divide-y divide-stroke-light">
      <InspectorHeader
        kind={`${journey.title} · ${inspection.order}단계`}
        title={step.intent}
        pager={<Pager entities={siblings} current={step.id} unit="단계" />}
        sections={[OVERVIEW, NEXT, SOURCE, TESTS, DOCS, GAPS]}
        contentsLabel="단계 상세 목차"
      >
        <p className="typo-caption-small">{statusLine(step.status)}</p>
      </InspectorHeader>

      <InspectorSection {...OVERVIEW}>
        <Facts
          facts={[
            { term: '동작', detail: step.behavior },
            {
              term: '실행 위치',
              detail: (
                <>
                  {context?.name ?? step.context}
                  {context && (
                    <span className="block typo-caption-small text-text-light">
                      {context.summary}
                    </span>
                  )}
                </>
              ),
            },
            { term: '담당', detail: <EntityLink id={step.owner} hash={INSPECTOR_ID} /> },
          ]}
        />
      </InspectorSection>

      <InspectorSection {...NEXT} count={inspection.next.length}>
        {inspection.next.length ? (
          <List className="flex flex-col gap-xs typo-body-small">
            {inspection.next.map((next) => (
              <ListItem key={next.id}>
                →{' '}
                <Link to={`${stepHref(journey.id, next.id)}#${INSPECTOR_ID}`} className={LINK}>
                  {next.order}. {next.intent}
                </Link>
              </ListItem>
            ))}
          </List>
        ) : (
          <Empty reason={empty.next} />
        )}
      </InspectorSection>

      <InspectorSection {...SOURCE} count={step.source.length} summary={sourceSummary(step.source)}>
        <SourceGroups refs={step.source} empty={empty.source} />
      </InspectorSection>

      <InspectorSection
        {...TESTS}
        count={inspection.tests.length}
        summary={countByRunner(inspection.tests)}
      >
        <TestRows items={inspection.tests} empty={empty.tests} />
      </InspectorSection>

      <InspectorSection {...DOCS} count={inspection.documents.length}>
        <DocumentRows items={inspection.documents} empty={empty.documents} />
      </InspectorSection>

      <InspectorSection {...GAPS} count={gaps.length}>
        {gaps.length ? (
          <List className="flex flex-col gap-xs">
            {gaps.map((gap) => (
              <ListItem key={gap.note} className="typo-caption-small text-text-warning">
                {GAP_KIND[gap.kind]} — {gap.note}
              </ListItem>
            ))}
          </List>
        ) : (
          <Empty reason="이 단계에 기록된 근거 공백이 없다" />
        )}
      </InspectorSection>
    </div>
  );
};
