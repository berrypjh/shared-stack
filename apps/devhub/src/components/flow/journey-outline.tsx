import { Link } from 'react-router-dom';

import { catalog } from '@/data';
import type { ConsumerJourney } from '@/domain/model';

import { LINK } from '../ui/entity-link';

import { ownerLabel, statusLine, stepHref } from './presentation';

const contextName = (id: string) => catalog.contexts.find((c) => c.id === id)?.name ?? id;

/**
 * 흐름을 글로: 단계마다 번호 · 할 일 · 상태 · 실행 위치 · 담당 · 동작, 그리고 다음 단계 전부.
 * 그림의 노드와 선이 모두 여기 있다 — 그림 없이 흐름 전체를 읽을 수 있다.
 */
export const JourneyOutline = ({
  journey,
  selectedId,
}: {
  journey: ConsumerJourney;
  selectedId?: string;
}) => {
  const orderOf = (id: string) => journey.steps.findIndex((step) => step.id === id) + 1;
  return (
    <ol aria-label={`${journey.title} 단계`} className="flex flex-col divide-y divide-stroke-light">
      {journey.steps.map((step, index) => {
        const selected = step.id === selectedId;
        const heading = `outline-step-${step.id}`;
        return (
          <li key={step.id}>
            <article aria-labelledby={heading} className="flex flex-col gap-xs py-md">
              <h3 id={heading} className="typo-body-small-strong">
                {index + 1}.{' '}
                <Link
                  to={stepHref(journey.id, step.id)}
                  aria-current={selected ? 'page' : undefined}
                  className={LINK}
                >
                  {step.intent}
                </Link>
                {selected && <span className="typo-caption-small"> · 선택됨</span>}
              </h3>
              <p className="typo-caption-small text-text-light">
                {statusLine(step.status)} · {contextName(step.context)} · {ownerLabel(step.owner)}
              </p>
              <p className="typo-body-small">{step.behavior}</p>
              <ul aria-label="다음 단계" className="flex flex-col gap-2xs typo-body-small">
                {step.next.length ? (
                  step.next.map((id) => (
                    <li key={id}>
                      다음 →{' '}
                      <Link to={stepHref(journey.id, id)} className={LINK}>
                        {orderOf(id)}. {journey.steps[orderOf(id) - 1].intent}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-text-light">다음 → 없음 (흐름의 끝)</li>
                )}
              </ul>
            </article>
          </li>
        );
      })}
    </ol>
  );
};
