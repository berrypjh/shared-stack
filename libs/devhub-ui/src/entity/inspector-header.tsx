import type { ReactNode } from 'react';

import { InspectorContents, type InspectorSectionMeta } from './inspector-section';

/**
 * 상세 정보 칸의 머리: 종류와 이전 · 다음(첫 줄 끝, 이웃으로 가면 도착하는 자리), 제목,
 * 상태 · 메타 한 줄(`children`), 섹션 목차.
 */
export const InspectorHeader = ({
  kind,
  title,
  pager,
  sections,
  contentsLabel,
  children,
}: {
  kind: ReactNode;
  title: ReactNode;
  /** 보통 `Pager`. */
  pager?: ReactNode;
  sections?: readonly InspectorSectionMeta[];
  contentsLabel?: string;
  children?: ReactNode;
}) => (
  <header className="flex flex-col gap-sm pb-lg">
    <div className="flex items-center justify-between gap-sm">
      <p className="min-w-0 typo-caption-small text-text-light">{kind}</p>
      {pager}
    </div>
    <h2 className="typo-body-medium-strong break-words">{title}</h2>
    {children}
    {sections && <InspectorContents sections={sections} label={contentsLabel} />}
  </header>
);
