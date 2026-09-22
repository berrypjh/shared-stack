import type { ReactNode } from 'react';

/** 상세 정보 칸의 조각. 항목 · 흐름 단계 · 기록 상세가 같은 모양으로 근거를 보인다. */

export const Empty = ({ reason }: { reason: string }) => (
  <p className="typo-caption-small text-text-light">없음 — {reason}</p>
);

/** 제목 있는 한 섹션. `id` 는 목차 링크의 대상이라 포커스를 받을 수 있다. */
export const InspectorSection = ({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  children: ReactNode;
}) => (
  <section
    id={id}
    tabIndex={-1}
    aria-labelledby={`${id}-heading`}
    className="flex scroll-mt-lg flex-col gap-sm py-lg last:pb-0"
  >
    <h3 id={`${id}-heading`} className="flex items-center gap-sm typo-body-small-strong">
      {title}
      {count !== undefined && <span className="typo-caption-small text-text-light">{count}</span>}
    </h3>
    {children}
  </section>
);
