/**
 * `source` 는 화면이 무엇을 읽는가다. `artifact` 는 수집기가 export 한 run 을,
 * `browser-session` 은 지금 이 탭의 브라우저 API 를 읽는다 — 둘은 출처·시간이 다르다.
 */
export type NavItem = {
  path: string;
  label: string;
  lead: string;
  source: 'artifact' | 'browser-session';
};

/** 정보 구조 한 벌. 사이드바 라벨·페이지 h1·현재 항목이 모두 여기서 온다. */
export const NAV = [
  {
    path: '/',
    label: '개요',
    lead: '실행 하나의 테스트·번들 budget·컨텍스트·평가를 서로 합치지 않고 독립 카드로 보여줍니다.',
    source: 'artifact',
  },
  {
    path: '/quality/tests',
    label: '테스트',
    lead: 'runner report 에서 온 source·case 결과입니다. source 파일 수와 실행한 case 수를 섞지 않습니다.',
    source: 'artifact',
  },
  {
    path: '/quality/checks',
    label: '검증',
    lead: 'lint·typecheck·build·tools 는 서로 다른 검증입니다. 실행하지 않은 검증은 통과가 아닙니다.',
    source: 'artifact',
  },
  {
    path: '/quality/packages',
    label: '패키지 표면',
    lead: 'package.json 이 선언한 exports 와 실제 산출물, catalog 재생성 결과를 source 근거로 봅니다.',
    source: 'artifact',
  },
  {
    path: '/bundles',
    label: '번들',
    lead: 'size-limit budget 과 esbuild tree-shaking 진단을 method·압축·조정 조건과 함께 봅니다. 조건이 모두 같을 때만 baseline delta 를 냅니다.',
    source: 'artifact',
  },
  {
    path: '/ai',
    label: 'AI 평가',
    lead: '평가 metric 을 원본 이름·분자·분모·n 과 executor 출처와 함께 봅니다. 서로 다른 metric 을 합친 점수는 없습니다.',
    source: 'artifact',
  },
  {
    path: '/design-system',
    label: '디자인 시스템',
    lead: '테마·산출물·component state 근거를 source·test 위치와 잇습니다. source 참조만으로 test 됨으로 보지 않습니다.',
    source: 'artifact',
  },
  {
    path: '/accessibility',
    label: '접근성',
    lead: '접근성 근거를 출처별로 나눠 봅니다. axe 검사·token 대비 test·CSS 텍스트 검사·UI test·수동 확인은 서로 다른 근거이고 합친 점수는 없습니다.',
    source: 'artifact',
  },
  {
    path: '/browser',
    label: '브라우저 세션',
    lead: '이 탭에서 지금 새로 읽은 환경·capability·performance entry 입니다. 저장·전송하지 않고 저장소 run 과 출처·시간이 다릅니다.',
    source: 'browser-session',
  },
  {
    path: '/runs',
    label: '실행 기록',
    lead: '공개 index 의 실행 목록과 고른 실행의 상세입니다.',
    source: 'artifact',
  },
] as const satisfies readonly NavItem[];

export type NavPath = (typeof NAV)[number]['path'];

export const navItem = (path: NavPath): NavItem => {
  const item = NAV.find((candidate) => candidate.path === path);
  if (!item) throw new Error(`NAV 에 ${path} 가 없습니다`);
  return item;
};

/** 다른 항목의 상위 경로면 정확히 일치할 때만 현재 위치로 친다. */
export const isEnd = (path: string) =>
  NAV.some((other) => other.path !== path && other.path.startsWith(path));
