/**
 * 화면 주소. 검색 · 사용처 같은 lib 코드가 route 를 알아야 할 때 여기서 만든다.
 * route 표(`app/router.tsx`)와 어긋나면 검색 테스트가 결과를 눌러 확인한다.
 */

export type EntityKind = 'application' | 'package' | 'tool';

/** 앱 · 도구는 자기 화면이 없어 아키텍처 그림의 그 노드로 간다. */
const SECTION: Record<EntityKind, string> = {
  application: 'architecture',
  package: 'packages',
  tool: 'architecture',
};

export const entityHref = (kind: EntityKind, id: string) => `/${SECTION[kind]}/${id}`;
export const journeyHref = (id: string) => `/journeys/${id}`;
export const stepHref = (journeyId: string, stepId: string) =>
  `/journeys/${journeyId}/steps/${stepId}`;
export const documentHref = (id: string) => `/documents/${id}`;
export const recordHref = (id: string) => `/records/${id}`;

/** 저장소 경로 하나의 화면. 경로의 `/` 는 그대로, 각 부분은 인코딩한다. */
export const sourceHref = (path: string) =>
  `/sources/${path.split('/').map(encodeURIComponent).join('/')}`;

export const symbolAnchor = (symbol: string) => `symbol-${symbol}`;

export const symbolHref = (path: string, symbol: string) =>
  `${sourceHref(path)}#${symbolAnchor(symbol)}`;
