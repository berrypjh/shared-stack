export type NavItem = { path: string; label: string; lead: string };

/** 정보 구조 한 벌. 사이드바 라벨·페이지 h1·현재 항목이 모두 여기서 온다. */
export const NAV = [
  {
    path: '/',
    label: '개요',
    lead: '실행 하나의 테스트·번들 budget·컨텍스트·평가를 서로 합치지 않고 독립 카드로 보여줍니다.',
  },
  {
    path: '/quality/tests',
    label: '테스트',
    lead: 'runner report 에서 온 source·case 결과입니다. source 파일 수와 실행한 case 수를 섞지 않습니다.',
  },
  {
    path: '/quality/checks',
    label: '검증',
    lead: 'lint·typecheck·build·tools 는 서로 다른 검증입니다. 실행하지 않은 검증은 통과가 아닙니다.',
  },
  {
    path: '/quality/packages',
    label: '패키지 표면',
    lead: 'package.json 이 선언한 exports 와 실제 산출물, catalog 재생성 결과를 source 근거로 봅니다.',
  },
  {
    path: '/bundles',
    label: '번들',
    lead: 'size-limit budget 과 esbuild tree-shaking 진단을 method·압축·조정 조건과 함께 봅니다. 조건이 모두 같을 때만 baseline delta 를 냅니다.',
  },
  {
    path: '/ai',
    label: 'AI 평가',
    lead: '평가 metric 을 원본 이름·분자·분모·n 과 executor 출처와 함께 봅니다. 서로 다른 metric 을 합친 점수는 없습니다.',
  },
  {
    path: '/design-system',
    label: '디자인 시스템',
    lead: '테마·산출물·component state 근거를 source·test 위치와 잇습니다. source 참조만으로 test 됨으로 보지 않습니다.',
  },
  {
    path: '/runs',
    label: '실행 기록',
    lead: '공개 index 의 실행 목록과 고른 실행의 상세입니다.',
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
