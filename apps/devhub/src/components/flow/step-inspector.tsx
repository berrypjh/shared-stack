import { Empty, INSPECTOR_ID, InspectorSection, Pager } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import type { StepInspection } from '@/lib/catalog/inspect-step';
import { GAP_KIND } from '@/lib/catalog/labels';

import { CommandRows, DocumentRows, SourceGroups, TestRows } from '../entity/inspector-parts';
import { EntityLink, LINK } from '../ui/entity-link';

import { statusLine, stepHref } from './presentation';

const SECTIONS = [
  ['overview', '개요'],
  ['next', '다음 단계'],
  ['source', '소스'],
  ['commands', '명령'],
  ['tests', '테스트'],
  ['documents', '문서'],
  ['gaps', '근거 공백'],
] as const;

const TITLE = Object.fromEntries(SECTIONS) as Record<(typeof SECTIONS)[number][0], string>;
const idOf = (key: string) => `step-${key}`;

/**
 * 고른 단계의 근거: 동작 · 실행 위치 · 담당, 다음 단계, 소스 · 명령 · 테스트 · 문서 · 공백.
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
      <header className="flex flex-col gap-sm pb-lg">
        <div className="flex items-center justify-between gap-sm">
          <p className="typo-caption-small text-text-light">
            {journey.title} · {inspection.order}단계
          </p>
          <Pager entities={siblings} current={step.id} unit="단계" />
        </div>
        <h2 className="typo-body-medium-strong">{step.intent}</h2>
        <p className="typo-caption-small">{statusLine(step.status)}</p>
        <nav aria-label="단계 상세 목차">
          <ul className="flex flex-wrap gap-x-md gap-y-xs">
            {SECTIONS.map(([key, title]) => (
              <li key={key}>
                <a href={`#${idOf(key)}`} className={`typo-caption-small ${LINK}`}>
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <InspectorSection id={idOf('overview')} title={TITLE.overview}>
        <p className="typo-body-small">{step.behavior}</p>
        <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-md gap-y-xs typo-body-small">
          <dt className="text-text-light">실행 위치</dt>
          <dd>
            {context?.name ?? step.context}
            {context && (
              <span className="block typo-caption-small text-text-light">{context.summary}</span>
            )}
          </dd>
          <dt className="text-text-light">담당</dt>
          <dd>
            <EntityLink id={step.owner} hash={INSPECTOR_ID} />
          </dd>
        </dl>
      </InspectorSection>

      <InspectorSection id={idOf('next')} title={TITLE.next} count={inspection.next.length}>
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

      <InspectorSection id={idOf('source')} title={TITLE.source} count={step.source.length}>
        <SourceGroups refs={step.source} empty={empty.source} />
      </InspectorSection>

      <InspectorSection
        id={idOf('commands')}
        title={TITLE.commands}
        count={inspection.commands.length}
      >
        <CommandRows items={inspection.commands} empty={empty.commands} />
      </InspectorSection>

      <InspectorSection id={idOf('tests')} title={TITLE.tests} count={inspection.tests.length}>
        <TestRows items={inspection.tests} empty={empty.tests} />
      </InspectorSection>

      <InspectorSection
        id={idOf('documents')}
        title={TITLE.documents}
        count={inspection.documents.length}
      >
        <DocumentRows items={inspection.documents} empty={empty.documents} />
      </InspectorSection>

      <InspectorSection id={idOf('gaps')} title={TITLE.gaps} count={gaps.length}>
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
