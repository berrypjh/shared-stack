import type { ReactNode } from 'react';

import { ExplorerDrawerProvider } from './explorer-drawer';

/**
 * 상단 바 + 탐색기 · 작업 영역 · 상세 정보 세 칸.
 *
 * - `lg` 부터 셸은 화면 높이에 맞고 칸마다 따로 스크롤한다 — 페이지 자체는 스크롤하지 않는다.
 *   옆 칸은 `lg` 에서 좁고(15 · 20rem) `xl` 부터 넓다(18 · 24rem). 1024px 에서 본문이 폰보다 좁아지지 않게.
 * - `lg` 미만은 한 열이다. 작업 영역 다음에 상세 정보가 오고, 탐색기는 서랍이다.
 * - 아주 넓은 화면에서는 115rem 에서 멈추고 가운데 선다. 셸은 `surface`, 바깥은 `default` 배경.
 *
 * `topBar` 는 `TopBar`, `explorer` 는 `Explorer`(안에 `ExplorerPane`), `children` 은 화면이 그리는
 * `WorkspaceFrame`(`<main>`)과 `Inspector`(`<aside>`) 두 칸이다.
 */
export const DevHubShell = ({
  topBar,
  explorer,
  children,
}: {
  topBar: ReactNode;
  explorer: ReactNode;
  children: ReactNode;
}) => (
  <ExplorerDrawerProvider>
    <div className="mx-auto grid min-h-dvh w-full max-w-[115rem] grid-rows-[auto_1fr] border-stroke-light bg-background-surface min-[115rem]:border-x lg:h-dvh lg:grid-rows-[auto_minmax(0,1fr)]">
      {topBar}
      <div className="grid grid-cols-[minmax(0,1fr)] lg:min-h-0 lg:grid-cols-[15rem_minmax(0,1fr)_20rem] xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
        {explorer}
        {children}
      </div>
    </div>
  </ExplorerDrawerProvider>
);
