'use client';

import { type RefObject, useEffect, useRef } from 'react';

import { useDevHubLocation } from '../provider/devhub-provider';

import { INSPECTOR_ID, MAIN_CONTENT_ID } from './workspace';

/**
 * route 이동 뒤의 포커스 · 스크롤. 라우터는 둘 다 하지 않으므로 여기서 한다.
 *
 * - 주소에 `#id` 가 있으면 그 요소로 스크롤하고 포커스한다(`#devhub-inspector` 로 상세 정보에 머문다).
 * - 경로가 바뀌면 창과 두 칸의 스크롤을 맨 위로 되돌리고 문서 맨 앞(`start`)에 포커스한다.
 *   다음 Tab 이 "본문으로 건너뛰기"다 — 페이지를 처음 열었을 때와 같다. 누른 링크나 상세 정보에 머물지 않는다.
 * - `canvasViews` 에 맞는 그림 화면 안에서 선택만 바뀌면 아무것도 하지 않는다 — 포커스가 누른 노드에 남는다.
 * - 처음 열 때는 브라우저 기본을 그대로 둔다. StrictMode 의 effect 재실행은 같은 주소라 건너뛴다.
 */
export const useRouteFocus = (start: RefObject<HTMLElement | null>, canvasViews: RegExp[]) => {
  const { pathname, hash } = useDevHubLocation();
  const last = useRef<string | null>(null);

  useEffect(() => {
    const viewOf = (path: string) =>
      canvasViews.map((pattern) => path.match(pattern)?.[0]).find(Boolean) ?? path;
    const key = `${pathname}${hash}`;
    const previous = last.current;
    last.current = key;
    if (previous === key) return;

    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView?.({ block: 'start' });
        target.focus({ preventScroll: true });
        return;
      }
    }
    if (previous === null) return;
    // 그림 화면 안에서 선택만 바뀌었다: 누른 노드에 포커스가 남고 스크롤도 그대로다.
    if (viewOf(previous.split('#')[0]) === viewOf(pathname)) return;

    window.scrollTo(0, 0);
    for (const id of [MAIN_CONTENT_ID, INSPECTOR_ID]) {
      const pane = document.getElementById(id);
      if (pane) pane.scrollTop = 0;
    }
    start.current?.focus({ preventScroll: true });
  }, [pathname, hash, start, canvasViews]);
};
