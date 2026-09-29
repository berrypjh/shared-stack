import type { ReactNode } from 'react';

/** 용어와 내용. 내용은 한 덩어리(`detail`)이거나 줄마다 하나(`details`)다. 비면 그리지 않는다. */
export type Fact = { term: string; detail?: ReactNode; details?: readonly ReactNode[] };

const isEmpty = (node: ReactNode) => node === undefined || node === null || node === '';

/** 상세 정보 개요의 용어 · 내용 표. 빈 사실은 근거가 아니라 잡음이라 뺀다. */
export const Facts = ({ facts }: { facts: readonly Fact[] }) => (
  <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-md gap-y-sm">
    {facts
      .filter((fact) => (fact.details ? fact.details.length > 0 : !isEmpty(fact.detail)))
      .map((fact) => (
        <div key={fact.term} className="contents">
          <dt className="typo-caption-small text-text-light">{fact.term}</dt>
          <dd className="typo-body-small break-words">
            {fact.details ? (
              <ul className="flex flex-col gap-xs">
                {fact.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            ) : (
              fact.detail
            )}
          </dd>
        </div>
      ))}
  </dl>
);
