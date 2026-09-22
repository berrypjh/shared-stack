/**
 * 아키텍처 그림의 자리. 저장소 사실이 아니라 그리기 결정이다 — 관계와 노드는 카탈로그에서 온다.
 * 격자는 열 × 행이다. 흐름(토큰 → 계약 → UI → 앱)이 위에서 아래로 읽히고, 웹과 RN 이 같은 행에 나란히 선다.
 * 관계가 없는 구성 요소는 맨 아래 띠(6 · 7행)에 둔다. 자리는 `checks.ts` 의 기준(선이 잇지 않는 상자를
 * 지나지 않음, 라벨이 겹치지 않음)을 만족하도록 골랐고 테스트가 그것을 지킨다.
 */
export const GRID: Record<string, readonly [column: number, row: number]> = {
  'design-tokens': [3, 0],
  'ui-core': [3, 1],
  'react-ui-css-build': [1, 1],
  'consumer-catalog-generator': [5, 1],
  'devhub-e2e': [0, 1],
  devhub: [0, 2],
  'react-ui': [1, 2],
  'consumer-retrieval': [3, 2],
  'react-native-ui': [5, 2],
  'demo-web': [0, 3],
  'tools-lib': [3, 3],
  'demo-mobile': [6, 3],
  'observability-collectors': [0, 4],
  'quality-lab': [1, 4],
  'devhub-ui': [3, 4],
  'consumer-eval': [3, 5],
  'observability-contracts': [0, 5],
  'quality-lab-e2e': [2, 5],

  'eslint-config': [0, 6],
  'prettier-config': [1, 6],
  tsconfig: [2, 6],
  'commitlint-config': [3, 6],
  'release-scripts': [4, 6],
  'berry-commit': [5, 6],
  'token-measurement': [0, 7],
  'treeshake-check': [1, 7],
  'eas-build-post-install': [2, 7],
};

export const NODE = { width: 200, height: 96 } as const;
export const COLUMN = 280;
export const ROW = 170;
export const MARGIN = 40;
/** 같은 두 노드를 잇는 선을 서로 떼어 놓는 휨. */
export const BEND = 100;
