import type { ReactNode } from 'react';

import { Icon, type IconName } from '../ui/icon';

/** 건너뛰기 링크 · 상세 정보 링크의 대상. 앱 접두를 붙인다 — 문서 제목에서 만든 id 와 겹치지 않게. */
export const MAIN_CONTENT_ID = 'devhub-main';
export const INSPECTOR_ID = 'devhub-inspector';

/** 가운데 칸. 첫 자식은 `WorkspaceHeader` 다. `lg` 부터 혼자 스크롤한다. */
export const WorkspaceFrame = ({ children }: { children: ReactNode }) => (
  <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative min-w-0 lg:overflow-y-auto">
    <div className="flex flex-col gap-xl px-lg pt-lg pb-4xl sm:px-2xl sm:pt-xl sm:pb-5xl">
      {children}
    </div>
  </main>
);

/** 작업 영역 안의 제목 있는 묶음. 제목이 구역의 이름이다. `#id` 로 오면 포커스를 받는다. */
export const WorkspaceSection = ({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) => (
  <section
    id={id}
    tabIndex={-1}
    aria-labelledby={`${id}-heading`}
    className="flex flex-col gap-md rounded-lg border border-stroke-light bg-background-surface p-lg"
  >
    <h2 id={`${id}-heading`} className="typo-body-small-strong">
      {title}
    </h2>
    {children}
  </section>
);

/** 고른 대상의 이름. `lg` 미만에서는 상세 정보가 본문 뒤에 오므로 그리로 가는 링크를 둔다. */
export const WorkspaceHeader = ({
  eyebrow,
  icon,
  title,
}: {
  eyebrow: string;
  icon?: IconName;
  title: string;
}) => (
  <header className="flex flex-col gap-xs">
    <p className="flex items-center gap-sm typo-caption-small text-text-light">
      {icon && <Icon name={icon} />}
      {eyebrow}
    </p>
    <h1 className="typo-heading-h5">{title}</h1>
    <a
      href={`#${INSPECTOR_ID}`}
      className="self-start typo-caption-small text-text-link underline-offset-2 hover:underline lg:hidden"
    >
      상세 정보로 이동
    </a>
  </header>
);
