'use client';

import { List, ListItem } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import { isCurrentPath, useDevHub } from '../provider/devhub-provider';
import { ThemeSwitch } from '../theme/theme-switch';
import { Icon, type IconName } from '../ui/icon';

import { ExplorerToggle } from './explorer-drawer';

const VIEW_LINK =
  'flex min-h-9 items-center gap-sm whitespace-nowrap rounded-md px-md typo-body-small text-text-light hover:bg-background-default aria-[current=page]:bg-(--ds-background-selected) aria-[current=page]:text-text-default aria-[current=page]:typo-body-small-strong';

/** 상단 바의 보기 하나. `exact` 면 그 주소에서만 현재다(개요). 아니면 그 아래 항목 주소에서도 현재다. */
export type TopBarView = {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  exact?: boolean;
};

/**
 * `lg` 부터: 줄바꿈 없는 한 줄 — 제품명, 요약(`xl` 부터, 먼저 말줄임), 검색, 보기, 테마.
 * `lg` 미만: 화면 위에 붙는 한 줄 — 메뉴(탐색기 서랍), 제품명, 검색 버튼, 테마. 보기는 서랍이 나열하고,
 * 검색 버튼이 검색 칸을 둘째 줄로 연다. `lg` 부터 검색 칸은 늘 보인다.
 * 보기의 현재 표시는 URL 이 정한다.
 */
export const TopBar = ({
  views,
  summary,
  search,
}: {
  views: TopBarView[];
  /** 저장소 · 스냅샷 같은 한 줄. `xl` 부터만 보인다. */
  summary?: ReactNode;
  /** `GlobalSearch`. */
  search?: ReactNode;
}) => {
  const { productName, router } = useDevHub();
  const { Link, location } = router;
  return (
    <header className="flex min-h-14 items-center gap-sm border-b max-lg:flex-wrap border-stroke-light bg-background-surface px-lg py-sm max-lg:sticky max-lg:top-0 max-lg:z-20 lg:gap-lg">
      <div className="flex min-w-0 flex-1 items-center gap-sm lg:flex-none">
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
      <nav aria-label="보기" className="ml-auto hidden shrink-0 lg:block">
        <List className="flex items-center gap-xs">
          {views.map((view) => (
            <ListItem key={view.id}>
              <Link
                to={view.href}
                aria-current={
                  isCurrentPath(location.pathname, view.href, view.exact ?? false)
                    ? 'page'
                    : undefined
                }
                className={VIEW_LINK}
              >
                <Icon name={view.icon} />
                {view.label}
              </Link>
            </ListItem>
          ))}
        </List>
      </nav>
      <ThemeSwitch />
    </header>
  );
};
