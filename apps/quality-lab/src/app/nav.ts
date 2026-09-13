export type NavItem = { path: string; label: string };

/** 정보 구조. 사이드바 라벨과 페이지 h1 은 같은 문장이다. */
export const NAV: readonly NavItem[] = [
  { path: '/', label: '개요' },
  { path: '/runs', label: '실행 기록' },
];

/** 다른 항목의 상위 경로면 정확히 일치할 때만 현재 위치로 친다. */
export const isEnd = (path: string) =>
  NAV.some((other) => other.path !== path && other.path.startsWith(path));
