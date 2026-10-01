import { VisuallyHidden } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import type { OutlineItem } from '../markdown/outline';
import { Icon } from '../ui/icon';

import { DocToc } from './doc-toc';

/**
 * 문서 · 기록 화면의 가운데 칸 — 본문 46rem 에 옆 목차를 더한 폭으로 가운데 둔다. 머리 · 본문 ·
 * 뒤따르는 내용이 함께 들어 왼쪽 끝이 맞는다.
 */
export const DocumentColumn = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto flex w-full max-w-[61rem] flex-col gap-xl">{children}</div>
);

/** 머리(메타 · 경로)와 본문을 가르는 선. 문서 칸 전체 폭으로 긋는다. */
export const DocumentHead = ({ children }: { children: ReactNode }) => (
  <div className="border-b border-stroke-light pb-lg">{children}</div>
);

/**
 * markdown 이 아닌 문서형 화면의 절 — 제목 · 구분선 · 여백이 `DocContent` 의 `##` 와 같다. 상자 없이 선으로만 나눈다.
 * `#id` 로 오면 포커스를 받고, 제목 옆 `#` 링크(hover · 키보드 포커스일 때만 보임)로 위치를 공유한다.
 */
export const DocumentSection = ({
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
    className="mt-lg flex scroll-mt-xl flex-col gap-lg border-t border-stroke-light pt-xl"
  >
    <h2 className="group flex items-baseline gap-sm typo-heading-h5">
      {/* 절의 이름은 이 글자뿐이다 — 옆 `#` 링크의 숨은 글이 섞이지 않게. */}
      <span id={`${id}-heading`}>{title}</span>
      <a
        href={`#${id}`}
        className="text-text-light opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Icon name="hash" />
        <VisuallyHidden>{title} 절 링크</VisuallyHidden>
      </a>
    </h2>
    {children}
  </section>
);

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
      <div className="flex items-start gap-2xl">
        <div className="flex min-w-0 flex-1 flex-col gap-md">
          <details className="rounded-md border border-stroke-light bg-background-surface @3xl:hidden">
            <summary className="cursor-pointer px-md py-sm typo-body-small-strong">
              <span className="inline-flex items-center gap-sm">
                <Icon name="document" className="text-text-light" />이 페이지에서
                <span className="typo-caption-small text-text-light">{outline.length}</span>
              </span>
            </summary>
            <nav aria-label="이 페이지에서" className="px-md pb-md">
              <DocToc items={outline} />
            </nav>
          </details>
          {children}
        </div>
        <nav
          aria-label="이 페이지에서"
          className="sticky top-lg hidden max-h-[calc(100dvh-6rem)] w-52 shrink-0 overflow-y-auto @3xl:block"
        >
          <p className="mb-sm flex items-center gap-sm typo-caption-small text-text-light">
            <Icon name="document" />이 페이지에서
          </p>
          <DocToc items={outline} />
        </nav>
      </div>
    </div>
  );
};
