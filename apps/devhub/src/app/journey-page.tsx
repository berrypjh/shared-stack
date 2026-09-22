import {
  Inspector,
  INSPECTOR_ID,
  useDocumentTitle,
  ViewSwitch,
  WorkspaceFrame,
  WorkspaceHeader,
  WorkspaceSection,
} from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { useLocation } from 'react-router-dom';

import { EntityNotFound, placeOf } from '@/components/entity/entity-not-found';
import { FlowCanvas, type FlowText } from '@/components/flow/flow-canvas';
import { JourneyOutline } from '@/components/flow/journey-outline';
import {
  boxOf,
  journeyHref,
  LEGEND,
  ownerLabel,
  statusLine,
  stepHref,
} from '@/components/flow/presentation';
import { StepInspector } from '@/components/flow/step-inspector';
import { EntityLink } from '@/components/ui/entity-link';
import { catalog } from '@/data';
import type { ConsumerJourney, StepStatus } from '@/domain/model';
import { findSection } from '@/lib/catalog/entities';
import { flowModel } from '@/lib/catalog/flow';
import { inspectStep } from '@/lib/catalog/inspect-step';
import { ACTOR, PLATFORM, STEP_STATUS } from '@/lib/catalog/labels';

const SECTION = findSection('journeys');
const STATUSES = Object.keys(STEP_STATUS) as StepStatus[];

/** `/journeys/<id>[/steps/<stepId>]`. route 가 아니라 주소에서 읽는다 — 단계를 골라도 화면이 남는다. */
const selectionOf = (pathname: string) => {
  const [, , journeyId = '', steps, stepId] = pathname.split('/');
  return { journeyId, stepId: steps === 'steps' ? stepId : undefined };
};

/** 흐름 전체의 요약: 상태별 단계 수, 거치는 실행 위치, 담당. 근거는 단계를 골라 본다. */
const JourneySummary = ({ journey }: { journey: ConsumerJourney }) => {
  const owners = [...new Set(journey.steps.map((step) => step.owner))];
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <p className="typo-caption-small text-text-light">{ACTOR[journey.actor]}</p>
        <h2 className="typo-body-medium-strong">{journey.title}</h2>
        <p className="typo-body-small">
          단계를 고르면 그 단계의 소스 · 명령 · 테스트 · 문서 · 근거 공백이 여기에 나옵니다.
        </p>
      </header>
      <section aria-labelledby="journey-owners" className="flex flex-col gap-sm">
        <h3 id="journey-owners" className="typo-body-small-strong">
          담당 <span className="typo-caption-small text-text-light">{owners.length}</span>
        </h3>
        <List className="flex flex-col gap-xs typo-body-small">
          {owners.map((owner) => (
            <ListItem key={owner}>
              <EntityLink id={owner} hash={INSPECTOR_ID} />
            </ListItem>
          ))}
        </List>
      </section>
    </div>
  );
};

const JourneyView = ({ journey, stepId }: { journey: ConsumerJourney; stepId?: string }) => {
  const model = flowModel(journey, catalog.contexts);
  const inspection = stepId ? inspectStep(catalog, journey.id, stepId) : undefined;
  const lanes = model.lanes.map((lane) => lane.name).join(' → ');
  const counts = STATUSES.map(
    (status) => [status, journey.steps.filter((step) => step.status === status).length] as const,
  ).filter(([, n]) => n > 0);
  const text: FlowText = {
    status: (node) => statusLine(node.status),
    owner: (node) => ownerLabel(node.owner),
    box: (node) => boxOf(node.status),
    href: (node) => stepHref(journey.id, node.id),
  };
  useDocumentTitle(
    inspection ? `${inspection.step.intent} · ${journey.title}` : `${journey.title} · 소비 흐름`,
  );

  if (stepId && !inspection) {
    return (
      <EntityNotFound
        section={{ title: journey.title, path: journeyHref(journey.id), icon: 'flow' }}
        id={stepId}
      />
    );
  }

  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader eyebrow={ACTOR[journey.actor]} icon="flow" title={journey.title} />
        <p className="typo-body-small">{journey.goal}</p>
        <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-md gap-y-xs typo-body-small">
          {journey.platform && (
            <>
              <dt className="text-text-light">플랫폼</dt>
              <dd>{PLATFORM[journey.platform]}</dd>
            </>
          )}
          <dt className="text-text-light">단계</dt>
          <dd>
            {journey.steps.length}개 —{' '}
            {counts.map(([status, n]) => `${statusLine(status)} ${n}`).join(' · ')}
          </dd>
          <dt className="text-text-light">실행 위치</dt>
          <dd>{lanes}</dd>
        </dl>
        <WorkspaceSection id="journey-flow" title="흐름">
          <p className="typo-caption-small text-text-light">
            가로 줄은 실행 위치, 화살표는 다음 단계다. 점선 상자는 저장소 밖에서 일어나 문서만
            말하는 단계다. 목록 보기에 같은 흐름이 글로 있다.
          </p>
          <ViewSwitch
            label={journey.title}
            canvas={
              <FlowCanvas
                label={`${journey.title} 흐름 그림`}
                model={model}
                selectedId={stepId}
                text={text}
                legend={LEGEND}
              />
            }
            list={<JourneyOutline journey={journey} selectedId={stepId} />}
          />
        </WorkspaceSection>
      </WorkspaceFrame>
      <Inspector>
        {inspection ? (
          <StepInspector inspection={inspection} />
        ) : (
          <JourneySummary journey={journey} />
        )}
      </Inspector>
    </>
  );
};

/**
 * `/journeys/<id>` · `/journeys/<id>/steps/<stepId>`: 저장소가 증명하는 흐름 하나.
 * 흐름마다 화면을 새로 그린다(`key`) — 다른 흐름의 이동 · 확대가 남지 않는다.
 */
export const JourneyPage = () => {
  const { pathname } = useLocation();
  const { journeyId, stepId } = selectionOf(pathname);
  const journey = catalog.journeys.find((j) => j.id === journeyId);
  if (!journey) return <EntityNotFound section={placeOf(SECTION)} id={journeyId} />;
  return <JourneyView key={journey.id} journey={journey} stepId={stepId} />;
};
