import { type ReactNode, useId } from 'react';

import { WorkspaceSection } from '@berrypjh/devhub-ui';

/**
 * 평가 화면의 제목 있는 묶음. 2단계는 작업 영역의 섹션(`WorkspaceSection`)이고, 3단계는 그 안의
 * 작은 묶음이다. `anchor` 는 다른 화면의 링크가 가리키는 id 다 — 없으면 화면 안에서만 쓰는 id 를 쓴다.
 */
export const Section = ({
  title,
  level = 2,
  anchor,
  children,
}: {
  title: string;
  level?: 2 | 3;
  anchor?: string;
  children: ReactNode;
}) => {
  const generated = useId();
  if (level === 2) {
    return (
      <WorkspaceSection id={anchor ?? `evaluation-${generated}`} title={title}>
        {children}
      </WorkspaceSection>
    );
  }
  const headingId = `${anchor ?? generated}-heading`;
  return (
    <section
      id={anchor}
      tabIndex={anchor ? -1 : undefined}
      aria-labelledby={headingId}
      className="flex flex-col gap-sm"
    >
      <h3 id={headingId} className="typo-body-small-strong text-text-default">
        {title}
      </h3>
      {children}
    </section>
  );
};
