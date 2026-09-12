/**
 * 정보 구조.
 *
 * 개발자가 이 도구를 여는 이유는 크게 넷이다 — 상태 확인, override 검증, 토큰 조회,
 * 컴포넌트 확인. 그룹은 그 작업 단위를 그대로 따른다.
 *
 * 컴포넌트 목록이 짧은 것은 의도다. 개별 컴포넌트 상태 탐색과 시각 회귀는 Storybook/Chromatic
 * 이 라이브러리 전체를 담당하고, 여기 있는 것은 실제 앱 통합(테마·프로필·CSS 캐스케이드·패키지 경계)
 * 을 확인하기 위한 대표 세트다.
 */
export type NavItem = { label: string; path: string; end: boolean };
export type NavGroup = { label: string | null; items: NavItem[] };

type NavSource = { label: string | null; items: { label: string; path: string }[] };

const SOURCE: NavSource[] = [
  { label: null, items: [{ label: '개요', path: '/' }] },
  {
    label: '검증',
    items: [{ label: 'Runtime', path: '/verify' }],
  },
  {
    label: 'Foundation',
    items: [
      { label: 'Tokens', path: '/tokens' },
      { label: 'Styles', path: '/foundation' },
    ],
  },
  {
    label: '컴포넌트',
    items: [
      { label: 'Button', path: '/components/button' },
      { label: 'TextField', path: '/components/text-field' },
      { label: 'Select', path: '/components/select' },
      { label: 'SearchField', path: '/components/search-field' },
      { label: 'FAB', path: '/components/fab' },
      { label: 'IconButton', path: '/components/icon-button' },
    ],
  },
  {
    label: 'Layout',
    items: [
      { label: 'Stack', path: '/components/stack' },
      { label: 'Divider', path: '/components/divider' },
    ],
  },
  {
    label: 'Overlay',
    items: [{ label: 'Popover', path: '/components/popover' }],
  },
];

const ALL_PATHS = SOURCE.flatMap((g) => g.items.map((i) => i.path));

/**
 * 다른 항목의 상위 경로면 정확히 일치할 때만 active 로 본다.
 *
 * `/verify` 는 `/verify/profile` 의 접두사라, 이게 없으면 하위 페이지에서 둘 다 켜진다.
 * 손으로 표시하면 새 하위 경로가 생길 때마다 빠뜨리므로 경로에서 유도한다.
 * 루트는 예외 — NavLink 에서 `/` 는 모든 경로에 매칭된다.
 */
const needsExactMatch = (path: string): boolean =>
  path === '/' || ALL_PATHS.some((other) => other !== path && other.startsWith(`${path}/`));

export const NAV: NavGroup[] = SOURCE.map((g) => ({
  label: g.label,
  items: g.items.map((i) => ({ ...i, end: needsExactMatch(i.path) })),
}));

/** 경로 → 페이지 이름. Topbar 문맥 표시에 쓴다. */
export const titleFor = (pathname: string): string => {
  const flat = NAV.flatMap((g) => g.items);
  const exact = flat.find((i) => i.path === pathname);
  if (exact) return exact.label;
  const prefix = flat
    .filter((i) => i.path !== '/' && pathname.startsWith(i.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return prefix?.label ?? '개요';
};
