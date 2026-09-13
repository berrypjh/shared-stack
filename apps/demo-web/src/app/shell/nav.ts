/**
 * 정보 구조.
 *
 * 개발자가 이 도구를 여는 이유는 크게 넷이다 — 상태 확인, override 검증, 토큰 조회,
 * 컴포넌트 확인. 그룹은 그 작업 단위를 그대로 따른다.
 *
 * 컴포넌트 목록이 짧은 것은 의도다. 개별 컴포넌트 상태 탐색과 시각 회귀는 Storybook/Chromatic
 * 이 라이브러리 전체를 담당하고, 여기 있는 것은 실제 앱 통합(테마·프로필·CSS 캐스케이드·패키지 경계)
 * 을 확인하기 위한 대표 세트다.
 *
 * **컴포넌트 항목은 presentation registry 에서 파생한다.** 라벨·경로를 여기 다시 적으면
 * Designer Library Browser 와 사이드바가 서로 다른 이름을 부를 수 있다. Foundation·검증은
 * presentation definition 이 아니므로 계속 이 파일이 소유한다.
 *
 * 방향은 nav → registry 한 쪽이다. registry 와 definition 은 nav 를 import 하지 않으므로
 * cycle 이 생기지 않는다.
 */
import { GROUP_LABELS, PRESENTATION_GROUPS } from '../presentation/model';
import { allPresentations } from '../presentation/registry';

export type NavItem = { label: string; path: string; end: boolean };
/**
 * `components` 묶음은 registry 에서 파생된 컴포넌트 목록이고, 사이드바의 컴포넌트 검색이
 * **이 묶음만** 좁힌다. `fixed` 묶음(개요·검증·Foundation)은 컴포넌트가 아니라 검색과 무관하게
 * 남는다 — 검색어를 넣었다고 앱의 다른 화면으로 가는 길이 사라지면 안 된다.
 */
export type NavGroupKind = 'fixed' | 'components';

export type NavGroup = { label: string | null; kind: NavGroupKind; items: NavItem[] };

type NavSource = {
  label: string | null;
  kind: NavGroupKind;
  items: { label: string; path: string }[];
};

/** presentation definition 이 아닌 화면. 이 파일이 소유한다. */
const FIXED: NavSource[] = [
  { label: null, kind: 'fixed', items: [{ label: '개요', path: '/' }] },
  {
    label: '검증',
    kind: 'fixed',
    items: [{ label: 'Runtime', path: '/verify' }],
  },
  {
    label: 'Foundation',
    kind: 'fixed',
    items: [
      { label: 'Tokens', path: '/tokens' },
      { label: 'Palette', path: '/palette' },
      { label: 'Styles', path: '/foundation' },
    ],
  },
];

/** 묶음 순서는 `PRESENTATION_GROUPS`, 묶음 안 순서는 registry 등록 순서가 정한다. */
const componentGroups = (): NavSource[] =>
  PRESENTATION_GROUPS.map((group) => ({
    label: GROUP_LABELS[group],
    kind: 'components' as const,
    items: allPresentations()
      .filter((p) => p.data.group === group)
      .map((p) => ({ label: p.data.label, path: p.data.path })),
  })).filter((g) => g.items.length > 0);

const SOURCE: NavSource[] = [...FIXED, ...componentGroups()];

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
  kind: g.kind,
  items: g.items.map((i) => ({ ...i, end: needsExactMatch(i.path) })),
}));

/**
 * 검색어로 좁힌 정보 구조.
 *
 * 컴포넌트 묶음만 좁히고, 비는 묶음은 제목까지 감춘다 — 빈 제목만 남으면 그 묶음에 항목이
 * 없는 것인지 걸러진 것인지 알 수 없다. 이름과 묶음 이름 둘 다로 찾는다: "Layout" 으로도
 * 그 묶음을 꺼낼 수 있어야 한다.
 */
export const filterNav = (query: string): NavGroup[] => {
  const needle = query.trim().toLowerCase();
  if (needle === '') return NAV;

  return NAV.flatMap((group) => {
    if (group.kind === 'fixed') return [group];
    const groupMatches = (group.label ?? '').toLowerCase().includes(needle);
    const items = group.items.filter(
      (item) => groupMatches || item.label.toLowerCase().includes(needle),
    );
    return items.length > 0 ? [{ ...group, items }] : [];
  });
};

/** 검색으로 좁혔을 때 컴포넌트가 하나도 남지 않았는지. 빈 화면을 말없이 두지 않는다. */
export const hasComponentMatches = (groups: NavGroup[]): boolean =>
  groups.some((g) => g.kind === 'components' && g.items.length > 0);

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
