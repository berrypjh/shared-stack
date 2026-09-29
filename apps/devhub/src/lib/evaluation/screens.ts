/**
 * 평가의 화면 한 벌. 탐색기 · 화면 머리 · 문서 제목이 모두 여기서 온다. 모든 화면이 수집기가
 * export 한 실행을 읽는다. `group` 이 탐색기의 묶음이고, 개요는 묶음 없이 평가 섹션 제목이 가리킨다.
 */
export type EvaluationScreen = {
  id: string;
  path: string;
  label: string;
  lead: string;
  group?: string;
};

export const EVALUATION_SCREENS = [
  {
    id: 'overview',
    path: '/evaluation',
    label: '개요',
    lead: '실행 하나의 번들 budget · 컨텍스트 · 평가를 서로 합치지 않고 독립 카드로 보여 줌.',
  },
  {
    id: 'bundles',
    path: '/evaluation/bundles',
    label: '번들',
    lead: 'size-limit budget 과 esbuild tree-shaking 진단을 method · 압축 · 조정 조건과 함께 봄. 조건이 모두 같을 때만 baseline delta 를 냄.',
    group: '품질',
  },
  {
    id: 'ai',
    path: '/evaluation/ai',
    label: 'AI 평가',
    lead: '평가 metric 을 원본 이름 · 분자 · 분모 · n 과 executor 출처와 함께 봄. 서로 다른 metric 을 합친 점수는 없음.',
    group: 'AI',
  },
] as const satisfies readonly EvaluationScreen[];

export type ScreenId = (typeof EVALUATION_SCREENS)[number]['id'];

export const screenOf = (id: ScreenId): EvaluationScreen => {
  const screen = EVALUATION_SCREENS.find((candidate) => candidate.id === id);
  if (!screen) throw new Error(`평가 화면에 ${id} 가 없다`);
  return screen;
};

export const screenPath = (id: ScreenId) => screenOf(id).path;
