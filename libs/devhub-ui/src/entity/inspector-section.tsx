import type { ReactNode } from 'react';

import { Icon, type IconName } from '../ui/icon';

/** 상세 정보 칸의 조각. 항목 · 흐름 단계 · 기록 상세가 같은 모양으로 근거를 보인다. */

export const Empty = ({ reason }: { reason: string }) => (
  <p className="typo-caption-small text-text-light">없음 — {reason}</p>
);

/** 목차 한 칸이자 섹션 머리. 목차와 섹션이 같은 아이콘 · 제목을 쓴다. */
export type InspectorSectionMeta = { id: string; title: string; icon?: IconName };

/** 상세 정보 머리의 목차. 섹션 머리와 같은 아이콘을 앞에 둔다. */
export const InspectorContents = ({
  sections,
  label = '상세 목차',
}: {
  sections: readonly InspectorSectionMeta[];
  label?: string;
}) => (
  <nav aria-label={label}>
    <ul className="flex flex-wrap gap-x-md gap-y-xs">
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="inline-flex items-center gap-xs typo-caption-small text-text-link underline-offset-2 hover:underline"
          >
            {section.icon && <Icon name={section.icon} />}
            {section.title}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

/** 제목 있는 한 섹션. `id` 는 목차 링크의 대상이라 포커스를 받을 수 있다. */
export const InspectorSection = ({
  id,
  title,
  icon,
  count,
  summary,
  children,
}: {
  id: string;
  title: string;
  icon?: IconName;
  count?: number;
  /** 목록을 읽기 전에 무엇이 들었는지 알려 주는 한 줄. 예: `저장소 2 · web 1`. */
  summary?: string;
  children: ReactNode;
}) => (
  <section
    id={id}
    tabIndex={-1}
    aria-labelledby={`${id}-heading`}
    className="flex scroll-mt-lg flex-col gap-sm py-lg last:pb-0"
  >
    <div className="flex flex-col gap-2xs">
      <h3 id={`${id}-heading`} className="flex items-center gap-sm typo-body-small-strong">
        {icon && <Icon name={icon} className="text-text-light" />}
        {title}
        {count !== undefined && <span className="typo-caption-small text-text-light">{count}</span>}
      </h3>
      {summary && <p className="pl-xl typo-caption-small text-text-light">{summary}</p>}
    </div>
    {children}
  </section>
);
