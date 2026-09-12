import { ReactNode, useEffect, useState } from 'react';

import {
  IconButton,
  List,
  ListItem,
  SkipLink,
  ThemeName,
  ThemeProvider,
  themes,
} from '@berrypjh/react-ui';

import { NavLink, useLocation } from 'react-router-dom';

import { SelectControl } from './controls';
import { NAV, titleFor } from './nav';

/**
 * 앱 껍데기.
 *
 * 사이드바 색을 하드코딩하지 않는다 — 이 데모 자체가 Shared Stack 의 소비자 예시이므로
 * 크롬까지 semantic 토큰을 쓴다. 그래야 테마를 바꿨을 때 화면 전체가 함께 움직인다.
 */

/** 테마 이름을 사람이 읽는 라벨로. 여러 단어면 띄어 쓴다 (`deepSea` → `Deep Sea`). */
const themeLabel = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

const THEME_OPTIONS = themes.map((t) => ({
  value: t.name as ThemeName,
  label: themeLabel(t.name),
}));

/** 막대 셋. 아이콘은 소비자가 소유한다 — 라이브러리는 아이콘 세트를 들고 있지 않다. */
const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="M4 7h16M4 12h16M4 17h16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const Sidebar = () => (
  <nav
    aria-label="주요 메뉴"
    className="w-full h-full border-r border-stroke-default bg-background-surface flex flex-col"
  >
    <div className="px-lg py-lg border-b border-stroke-light">
      <p className="text-text-default text-xsm font-semiBold leading-none">Shared Stack</p>
      <p className="text-text-light text-xxsm mt-xs">디자인 시스템</p>
    </div>

    {/*
      묶음마다 배경 블록을 준다. 색·굵기·자간만으로는 어디서 끊기는지 눈에 먼저 들어오지
      않았다. 블록은 sidebar 의 surface 위에 default 를 얹어 만들고, 현재 항목은 반대로
      surface 로 되돌려 블록 밖으로 튀어나온 것처럼 보이게 한다. 세 테마 모두 두 색이 다르다.
    */}
    <div className="flex-1 overflow-y-auto px-xs py-md flex flex-col gap-md">
      {NAV.map((group, i) => (
        <div
          key={group.label ?? `g${i}`}
          data-testid="nav-group"
          className="bg-background-default rounded-md overflow-hidden py-sm"
        >
          {group.label && (
            <p
              id={`nav-group-${i}`}
              className="px-md pt-xs pb-sm text-text-light text-xxsm font-semiBold uppercase tracking-[0.08em]"
            >
              {group.label}
            </p>
          )}
          <List aria-labelledby={group.label ? `nav-group-${i}` : undefined}>
            {group.items.map((item) => (
              <ListItem key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'block px-md py-md text-xsm no-underline border-l-2 transition-colors',
                      // 현재 항목은 브랜드 색조, 호버는 중립적으로 한 단계 밝히기만 한다.
                      // 둘이 같은 배경이면 스쳐 지나가는 행이 선택된 것처럼 보인다.
                      // selected 는 8% 알파라 Tailwind 유틸(-rgb 파생)로는 알파가 날아간다. 변수를 그대로 쓴다.
                      isActive
                        ? 'border-l-stroke-primary bg-[var(--ds-background-selected)] text-text-primary font-semiBold'
                        : 'border-l-transparent text-text-default hover:bg-background-surface',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              </ListItem>
            ))}
          </List>
        </div>
      ))}
    </div>
  </nav>
);

const Topbar = ({
  title,
  mode,
  onMode,
  onOpenMenu,
  menuOpen,
}: {
  title: string;
  mode: ThemeName;
  onMode: (m: ThemeName) => void;
  onOpenMenu: () => void;
  menuOpen: boolean;
}) => (
  <header className="h-[52px] shrink-0 border-b border-stroke-default bg-background-surface flex items-center justify-between gap-md sm:gap-xl px-lg sticky top-0 z-10">
    <div className="flex items-center gap-md min-w-0">
      <IconButton
        size="sm"
        edge="start"
        onClick={onOpenMenu}
        aria-label="메뉴 열기"
        aria-expanded={menuOpen}
        data-testid="open-menu"
        className="lg:hidden"
      >
        <MenuIcon />
      </IconButton>
      {/* 좁은 화면에서는 바로 아래 h1 과 같은 말이라 접는다. */}
      <span className="hidden sm:block text-text-default text-xsm font-semiBold truncate">
        {title}
      </span>
    </div>
    <div className="flex items-center gap-md sm:gap-xl">
      <SelectControl
        label="Theme"
        value={mode}
        options={THEME_OPTIONS}
        onChange={onMode}
        testId="theme-select"
      />
    </div>
  </header>
);

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const [mode, setMode] = useState<ThemeName>('light');
  const [menuOpen, setMenuOpen] = useState(false);

  // 페이지를 옮기면 드로어는 할 일이 끝났다. 열린 채로 두면 이동한 화면을 가린다.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <ThemeProvider
      mode={mode}
      data-testid="theme-root"
      className="min-h-screen bg-[var(--demo-canvas)]"
    >
      <SkipLink targetId="main">본문으로 건너뛰기</SkipLink>

      <div className="flex min-h-screen w-full max-w-[1440px] mx-auto bg-background-default">
        {/* 데스크톱에서만 자리를 차지한다. 좁은 화면에서는 220px 이 본문을 먹는다. */}
        <div className="hidden lg:block w-[220px] shrink-0">
          <Sidebar />
        </div>

        {menuOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" data-testid="menu-drawer">
            <button
              type="button"
              aria-label="메뉴 닫기"
              onClick={() => setMenuOpen(false)}
              // preset 이 색을 rgb(var(--x-rgb) / 1) 로 굳혀 두어 Tailwind 알파 수식어(/60)가 먹지 않는다.
              className="absolute inset-0 bg-[rgb(var(--ds-background-dark-rgb)/0.6)] border-0 cursor-pointer"
            />
            <div className="relative w-[260px] max-w-[80vw] h-full shadow-lg">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar
            title={titleFor(pathname)}
            mode={mode}
            onMode={setMode}
            onOpenMenu={() => setMenuOpen(true)}
            menuOpen={menuOpen}
          />
          {/*
            skip link 의 대상이다. `tabIndex={-1}` 이 없으면 fragment 이동이 포커스를 옮기지
            않고 순차 포커스 시작점만 바꾼다. `scroll-mt` 는 52px sticky 헤더가 대상을 덮지
            않게 한다 (WCAG 2.4.11) — 헤더 높이는 앱이 알고 라이브러리는 모른다.
          */}
          <main id="main" tabIndex={-1} className="flex-1 min-w-0 py-xl scroll-mt-[52px]">
            {/* 좌우 여백은 react-deep-dive-zone 의 PageContainer 와 같은 규약을 쓴다. */}
            <div className="mx-auto w-full max-w-[1200px] px-lg sm:px-xl lg:px-2xl">{children}</div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};
