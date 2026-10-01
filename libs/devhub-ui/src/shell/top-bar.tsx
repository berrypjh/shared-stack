'use client';

import type { ReactNode } from 'react';

import { useDevHub } from '../provider/devhub-provider';
import { ThemeSwitch } from '../theme/theme-switch';
import { Icon } from '../ui/icon';

import { ExplorerToggle } from './explorer-drawer';

/**
 * `lg` 부터: 줄바꿈 없는 한 줄 — 제품명, 요약(`xl` 부터, 먼저 말줄임), 검색, 테마. 검색과 테마는 오른쪽 끝에 선다.
 * `lg` 미만: 화면 위에 붙는 한 줄 — 메뉴(탐색기 서랍), 제품명, 검색 버튼, 테마.
 * 검색 버튼이 검색 칸을 둘째 줄로 연다. `lg` 부터 검색 칸은 늘 보인다.
 * 화면 사이 이동은 탐색기가 맡는다.
 */
export const TopBar = ({
  summary,
  search,
}: {
  /** 저장소 · 스냅샷 같은 한 줄. `xl` 부터만 보인다. */
  summary?: ReactNode;
  /** `GlobalSearch`. */
  search?: ReactNode;
}) => {
  const { productName, themePair } = useDevHub();
  return (
    <header className="flex min-h-14 items-center gap-sm border-b max-lg:flex-wrap border-stroke-light bg-background-surface px-lg py-sm max-lg:sticky max-lg:top-0 max-lg:z-20 lg:gap-lg">
      <div className={`flex min-w-0 flex-1 items-center gap-sm ${summary ? 'xl:flex-none' : ''}`}>
        <ExplorerToggle />
        <p className="flex min-w-0 items-center gap-sm typo-body-medium-strong">
          <Icon name="brand" className="text-text-link" />
          <span className="truncate">{productName}</span>
        </p>
      </div>
      {summary && (
        <p className="hidden min-w-0 flex-1 truncate typo-caption-small text-text-light xl:block">
          {summary}
        </p>
      )}
      {search}
      <ThemeSwitch themePair={themePair} />
    </header>
  );
};
