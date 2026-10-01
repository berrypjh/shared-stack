import type { Catalog, Relation, TestSuite } from './model';

/**
 * 카탈로그에서 유도하는 조회. 위 · 아래 관계와 테스트는 레코드에 두 번 적지 않고 여기서 계산한다.
 * 위(upstream)는 기대는 쪽이다: 의존의 `to`, 생성물의 `from`. 검증은 위아래가 아니라 따로 본다.
 */

type Flow = Exclude<Relation, { kind: 'verification' }>;

const isFlow = (relation: Relation): relation is Flow => relation.kind !== 'verification';

const sourceOf = (relation: Flow) =>
  relation.kind === 'generated-artifact' ? relation.from : relation.to;

const targetOf = (relation: Flow) =>
  relation.kind === 'generated-artifact' ? relation.to : relation.from;

/** `id` 가 기대는 관계(의존하는 대상 · 받아 싣는 생성물). */
export const upstreamOf = (catalog: Catalog, id: string): Flow[] =>
  catalog.relations.filter(isFlow).filter((relation) => targetOf(relation) === id);

/** `id` 에 기대는 관계. */
export const downstreamOf = (catalog: Catalog, id: string): Flow[] =>
  catalog.relations.filter(isFlow).filter((relation) => sourceOf(relation) === id);

/** 위쪽 · 아래쪽 상대의 ID. */
export const upstreamIds = (catalog: Catalog, id: string) => upstreamOf(catalog, id).map(sourceOf);

export const downstreamIds = (catalog: Catalog, id: string) =>
  downstreamOf(catalog, id).map(targetOf);

/** `id` 를 확인하는 검증 관계. */
export const verifiersOf = (catalog: Catalog, id: string) =>
  catalog.relations.filter((relation) => relation.kind === 'verification' && relation.to === id);

/** `id` 를 확인하는 테스트 묶음. */
export const testsOf = (catalog: Catalog, id: string): TestSuite[] =>
  catalog.tests.filter((suite) => suite.subjects.includes(id));
