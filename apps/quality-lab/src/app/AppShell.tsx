import { type ReactNode, useEffect, useRef, useState } from 'react';

import { IconButton, SkipLink, Switch, ThemeProvider } from '@berrypjh/react-ui';

import { NavLink, useLocation } from 'react-router-dom';

import { isEnd, NAV } from './nav';

export type ThemeMode = 'light' | 'dark';

const NAV_ID = 'primary-nav';

/** 막대 셋. 아이콘은 소비자가 소유한다. */
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

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block px-md py-md text-xsm no-underline border-l-2',
    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-stroke-primary',
    isActive
      ? 'border-l-stroke-primary bg-[var(--ds-background-selected)] text-text-primary font-semiBold'
      : 'border-l-transparent text-text-default hover:bg-background-default',
  ].join(' ');

/**
 * 앱 껍데기. 크롬까지 semantic 토큰을 써서 테마를 바꾸면 화면 전체가 함께 움직인다.
 *
 * 내비게이션은 한 벌이다. 넓은 폭에서는 사이드바, 좁은 폭에서는 메뉴 버튼이 여닫는
 * disclosure 로 같은 `<nav>` 를 보여준다 — landmark 와 `aria-current` 가 두 벌이 되지 않는다.
 */
export const AppShell = ({
  theme,
  onThemeChange,
  children,
}: {
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  children: ReactNode;
}) => {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <ThemeProvider mode={theme} className="min-h-screen bg-background-default text-text-default">
      <SkipLink targetId="main">본문으로 건너뛰기</SkipLink>

      <header className="sticky top-0 z-10 h-[52px] flex items-center justify-between gap-md px-lg border-b border-stroke-default bg-background-surface">
        <div className="flex items-center gap-md min-w-0">
          <IconButton
            ref={toggleRef}
            size="sm"
            edge="start"
            aria-label="메뉴"
            aria-expanded={menuOpen}
            aria-controls={NAV_ID}
            onClick={() => setMenuOpen((open) => !open)}
            className="lg:hidden"
          >
            <MenuIcon />
          </IconButton>
          <span className="text-text-default text-xsm font-semiBold truncate">Quality Lab</span>
        </div>
        <Switch
          checked={theme === 'dark'}
          onChange={(e) => onThemeChange(e.target.checked ? 'dark' : 'light')}
        >
          다크 모드
        </Switch>
      </header>

      <div className="lg:flex">
        <nav
          id={NAV_ID}
          aria-label="주요 메뉴"
          className={[
            menuOpen ? 'block' : 'hidden',
            'lg:block lg:w-[220px] lg:shrink-0 lg:sticky lg:top-[52px] lg:h-[calc(100vh-52px)]',
            'border-b lg:border-b-0 lg:border-r border-stroke-default bg-background-surface py-md',
          ].join(' ')}
        >
          <ul className="list-none m-0 p-0">
            {NAV.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} end={isEnd(item.path)} className={navLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/*
          SkipLink 의 대상. `tabIndex={-1}` 이 있어야 fragment 이동이 포커스를 옮기고,
          `scroll-mt` 가 52px sticky 헤더에 가려지지 않게 한다 (WCAG 2.4.11).
        */}
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 min-w-0 px-lg sm:px-xl py-xl scroll-mt-[52px]"
        >
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
};
