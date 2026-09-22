import type { ReactNode } from 'react';

import type { OutlineItem } from '../markdown/outline';

import { DocToc } from './doc-toc';

/**
 * 문서와 "이 페이지에서". 기준은 화면이 아니라 작업 영역의 폭(container query)이다 — 양옆 칸이 폭마다 다르게 차지한다.
 * 넓으면 본문 옆에서 스크롤을 따라오고, 좁으면 본문 위에 접힌다. 한 번에 하나만 보인다(다른 하나는 `hidden`).
 */
export const DocumentLayout = ({
  outline,
  children,
}: {
  outline: OutlineItem[];
  children: ReactNode;
}) => {
  if (outline.length === 0) return children;
  return (
    <div className="@container">
      <div className="flex items-start gap-xl">
        <div className="flex min-w-0 flex-1 flex-col gap-md">
          <details className="rounded-md border border-stroke-light bg-background-surface @4xl:hidden">
            <summary className="cursor-pointer px-md py-sm typo-body-small-strong">
              이 페이지에서{' '}
              <span className="typo-caption-small text-text-light">{outline.length}</span>
            </summary>
            <nav aria-label="이 페이지에서" className="px-md pb-md">
              <DocToc items={outline} />
            </nav>
          </details>
          {children}
        </div>
        <nav
          aria-label="이 페이지에서"
          className="sticky top-md hidden max-h-[calc(100dvh-8rem)] w-52 shrink-0 overflow-y-auto @4xl:block"
        >
          <p className="mb-sm typo-caption-small text-text-light">이 페이지에서</p>
          <DocToc items={outline} />
        </nav>
      </div>
    </div>
  );
};
