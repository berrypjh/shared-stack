import { ReactNode, useEffect, useState } from 'react';

import {
  IconButton,
  List,
  ListItem,
  SearchField,
  SegmentControl,
  type SegmentOption,
  SkipLink,
  ThemeName,
  ThemeProvider,
  themes,
} from '@berrypjh/react-ui';

import { NavLink, useLocation } from 'react-router-dom';

import { useViewMode, type ViewMode } from '../presentation/viewMode';

import { SelectControl } from './controls';
import { filterNav, hasComponentMatches, titleFor } from './nav';

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

/**
 * 사이드바 — 이 앱의 **유일한** 내비게이션.
 *
 * Designer 에도 따로 컴포넌트 목록을 두지 않는다. 같은 registry 에서 같은 항목·같은 링크를
 * 그리는 목록이 둘이면 landmark 와 `aria-current` 가 두 벌이 되고, 데스크톱에서는 Canvas 왼쪽에
 * 링크 열이 두 개 붙는다. 컴포넌트 검색은 그 목록이 있는 여기 위에 둔다.
 *
 * `to` 에 현재 `search` 를 그대로 실어 보낸다. Designer 에서 항목을 눌렀을 때 `view=designer`
 * 가 조용히 사라지면 이동만으로 mode 가 바뀌어 버린다. 지우는 것이 아니라 옮기는 것이므로
 * view 이외의 parameter 도 손대지 않는다 — Developer 에서는 search 가 비어 있어 `view` 가
 * 새로 붙지도 않는다.
 *
 * `isActive` 는 pathname 으로만 계산되므로 query 를 실어도 현재 위치 표시는 그대로다.
 *
 * 검색어는 이 컴포넌트의 일시적 UI 상태다. 데스크톱 사이드바와 모바일 드로어는 같은 폭에서
 * 동시에 보이지 않으므로 각자 들고 있어도 갈리지 않는다.
 */
const Sidebar = ({ search }: { search: string }) => {
  const [query, setQuery] = useState('');
  const groups = filterNav(query);
  const noMatches = query.trim() !== '' && !hasComponentMatches(groups);

  return (
    <nav
      aria-label="주요 메뉴"
      className="w-full h-full border-r border-stroke-default bg-background-surface flex flex-col"
    >
      <div className="px-lg py-lg border-b border-stroke-light">
        <p className="text-text-default text-xsm font-semiBold leading-none">Shared Stack</p>
        <p className="text-text-light text-xxsm mt-xs">디자인 시스템</p>
      </div>

      {/*
      컴포넌트 검색. 보이는 라벨이 없으므로 이름은 `inputProps` 로 native input 에 직접 준다 —
      `SearchField` 의 나머지 prop 은 래퍼로 가고 `inputProps` 만 input 에 닿는다.
    */}
      <div className="px-md py-md border-b border-stroke-light">
        <SearchField
          variant="boxed"
          fullWidth
          value={query}
          onValueChange={setQuery}
          clearable
          clearAriaLabel="검색어 지우기"
          placeholder="컴포넌트 검색"
          inputProps={{ 'aria-label': '컴포넌트 검색', 'data-testid': 'component-search' }}
        />
      </div>

      {/*
      묶음마다 배경 블록을 준다. 색·굵기·자간만으로는 어디서 끊기는지 눈에 먼저 들어오지
      않았다. 블록은 sidebar 의 surface 위에 default 를 얹어 만들고, 현재 항목은 반대로
      surface 로 되돌려 블록 밖으로 튀어나온 것처럼 보이게 한다. 세 테마 모두 두 색이 다르다.
    */}
      <div className="flex-1 overflow-y-auto px-xs py-md flex flex-col gap-md">
        {groups.map((group, i) => (
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
                    to={{ pathname: item.path, search }}
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

        {noMatches && (
          <p role="status" className="px-md py-sm text-text-light text-xxsm">
            일치하는 컴포넌트가 없습니다.
          </p>
        )}
      </div>
    </nav>
  );
};

/**
 * 좁은 topbar 에서는 라벨을 줄인다. 보이는 글자를 없애지 않고 짧은 쪽으로 바꾸기만 하고,
 * `ariaLabel` 로 접근 가능한 이름을 두 폭에서 같게 고정한다. 짧은 라벨이 긴 이름에 포함되므로
 * Label in Name (WCAG 2.5.3) 도 지켜진다.
 */
const viewLabel = (short: string, full: string) => (
  <>
    <span className="sm:hidden">{short}</span>
    <span className="hidden sm:inline">{full}</span>
  </>
);

const VIEW_OPTIONS: readonly SegmentOption<ViewMode>[] = [
  { value: 'developer', label: viewLabel('Dev', 'Developer'), ariaLabel: 'Developer' },
  { value: 'designer', label: viewLabel('Design', 'Designer'), ariaLabel: 'Designer' },
];

const Topbar = ({
  title,
  theme,
  onThemeChange,
  viewMode,
  onViewModeChange,
  onOpenMenu,
  menuOpen,
}: {
  title: string;
  theme: ThemeName;
  onThemeChange: (t: ThemeName) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
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
      {/*
        App 수준 switch 다 — 컴포넌트별 toolbar 안에 넣지 않는다.
        `SegmentControl` 은 `inline-size: 100%` 로 트랙을 채우므로 폭을 여기서 묶는다.
        그러지 않으면 topbar 에서 제목·테마·메뉴 자리를 밀어낸다.
      */}
      <div className="shrink-0 w-[120px] sm:w-[176px]">
        <SegmentControl
          aria-label="View"
          value={viewMode}
          options={VIEW_OPTIONS}
          onChange={onViewModeChange}
          data-testid="view-switch"
        />
      </div>
      <SelectControl
        label="Theme"
        value={theme}
        options={THEME_OPTIONS}
        onChange={onThemeChange}
        testId="theme-select"
      />
    </div>
  </header>
);

export const AppShell = ({
  theme,
  onThemeChange,
  children,
}: {
  theme: ThemeName;
  onThemeChange: (t: ThemeName) => void;
  children: ReactNode;
}) => {
  const { pathname, search } = useLocation();
  const [viewMode, setViewMode] = useViewMode();
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
      mode={theme}
      data-testid="theme-root"
      className="min-h-screen bg-[var(--demo-canvas)]"
    >
      <SkipLink targetId="main">본문으로 건너뛰기</SkipLink>

      <div className="flex min-h-screen w-full max-w-[1440px] mx-auto bg-background-default">
        {/* 데스크톱에서만 자리를 차지한다. 좁은 화면에서는 220px 이 본문을 먹는다. */}
        <div className="hidden lg:block w-[220px] shrink-0">
          <Sidebar search={search} />
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
              <Sidebar search={search} />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar
            title={titleFor(pathname)}
            theme={theme}
            onThemeChange={onThemeChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
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
