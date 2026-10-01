import {
  Inspector,
  useDocumentTitle,
  ViewSwitch,
  WorkspaceFrame,
  WorkspaceHeader,
  WorkspaceSection,
} from '@berrypjh/devhub-ui';

import { useLocation } from 'react-router-dom';

import { EntityNotFound, placeOf } from '@/components/entity/entity-not-found';
import { FlowCanvas, type FlowText } from '@/components/flow/flow-canvas';
import { JourneyInspector } from '@/components/flow/journey-inspector';
import { JourneyOutline } from '@/components/flow/journey-outline';
import { boxOf, LEGEND, ownerLabel, statusLine } from '@/components/flow/presentation';
import { StepInspector } from '@/components/flow/step-inspector';
import { SECTION_ICON } from '@/components/ui/view-icons';
import { catalog } from '@/data';
import type { Journey, StepStatus } from '@/domain/model';
import { findSection } from '@/lib/catalog/entities';
import { flowModel } from '@/lib/catalog/flow';
import { inspectStep } from '@/lib/catalog/inspect-step';
import { STEP_STATUS } from '@/lib/catalog/labels';
import { journeyHref, stepHref } from '@/lib/catalog/routes';

const SECTION = findSection('journeys');
const STATUSES = Object.keys(STEP_STATUS) as StepStatus[];

/** `/journeys/<id>[/steps/<stepId>]`. route 가 아니라 주소에서 읽는다 — 단계를 골라도 화면이 남는다. */
const selectionOf = (pathname: string) => {
  const [, , journeyId = '', steps, stepId] = pathname.split('/');
  return { journeyId, stepId: steps === 'steps' ? stepId : undefined };
};

const JourneyView = ({ journey, stepId }: { journey: Journey; stepId?: string }) => {
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
  useDocumentTitle(inspection ? `${inspection.step.intent} · ${journey.title}` : journey.title);

  if (stepId && !inspection) {
    return (
      <EntityNotFound
        section={{
          title: journey.title,
          path: journeyHref(journey.id),
          icon: SECTION_ICON.journeys,
        }}
        id={stepId}
      />
    );
  }

  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader
          eyebrow={SECTION.title}
          icon={SECTION_ICON[SECTION.id]}
          title={journey.title}
        />
        <p className="typo-paragraph-default">{journey.goal}</p>
        <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-md gap-y-xs typo-body-small">
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
            가로 줄은 실행 위치, 화살표는 다음 단계. 점선 상자는 저장소 밖에서 에이전트 · 사람이
            하는 단계. 목록 보기에 같은 흐름이 글로 있음.
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
          <JourneyInspector journey={journey} siblings={SECTION.entities} />
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
