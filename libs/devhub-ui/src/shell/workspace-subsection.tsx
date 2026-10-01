'use client';

import { type ReactNode, useId } from 'react';

/**
 * `WorkspaceSection` 안의 작은 묶음(h3). 이어지면 둘째부터 위에 구분선과 여백을 둬 묶음 경계가 보인다.
 * `anchor` 를 주면 다른 화면의 링크가 이 묶음을 가리킬 수 있다(`#anchor` 로 오면 포커스를 받는다).
 */
export const WorkspaceSubsection = ({
  title,
  anchor,
  children,
}: {
  title: string;
  anchor?: string;
  children: ReactNode;
}) => {
  const generated = useId();
  const headingId = `${anchor ?? generated}-heading`;
  return (
    <section
      id={anchor}
      tabIndex={anchor ? -1 : undefined}
      aria-labelledby={headingId}
      className="flex flex-col gap-md border-t border-stroke-light pt-lg first-of-type:border-t-0 first-of-type:pt-0"
    >
      <h3 id={headingId} className="typo-body-small-strong text-text-default">
        {title}
      </h3>
      {children}
    </section>
  );
};
