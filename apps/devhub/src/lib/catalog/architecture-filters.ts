import type { Platform, Visibility } from '../../domain/model';

import type { ArchitectureModel, NodeKind } from './architecture';

/**
 * 그림 · 목록이 함께 쓰는 필터. URL query(`?kind=…&visibility=…&platform=…`)에 두고,
 * 허용된 값만 받는다 — 모르는 값은 버린다. 여럿이면 모두 만족하는 노드만 남는다.
 */
export type ArchitectureFilters = {
  kind?: NodeKind;
  visibility?: Visibility;
  platform?: Platform;
};

export const FILTER_VALUES = {
  kind: ['application', 'package', 'tool'],
  visibility: ['public', 'internal'],
  platform: ['web', 'react-native', 'platform-neutral', 'node'],
} as const satisfies Record<keyof ArchitectureFilters, readonly string[]>;

type Param = keyof ArchitectureFilters;

const PARAMS = Object.keys(FILTER_VALUES) as Param[];

export const parseFilters = (params: URLSearchParams): ArchitectureFilters =>
  Object.fromEntries(
    PARAMS.flatMap((param) => {
      const value = params.get(param);
      return value && (FILTER_VALUES[param] as readonly string[]).includes(value)
        ? [[param, value]]
        : [];
    }),
  );

/** 필터를 query 로. 키 순서를 고정해 같은 필터는 같은 주소가 된다. 비면 빈 문자열. */
export const filterQuery = (filters: ArchitectureFilters) => {
  const query = new URLSearchParams(
    PARAMS.flatMap((param) => (filters[param] ? [[param, filters[param]]] : [])),
  ).toString();
  return query ? `?${query}` : '';
};

/**
 * 조건에 맞는 노드와, 양 끝이 모두 남은 선만. 공개 여부는 패키지만 가지므로 그 필터는 패키지만 남긴다.
 */
export const filterModel = (
  model: ArchitectureModel,
  filters: ArchitectureFilters,
): ArchitectureModel => {
  const nodes = model.nodes.filter(
    (node) =>
      (!filters.kind || node.kind === filters.kind) &&
      (!filters.visibility || node.visibility === filters.visibility) &&
      (!filters.platform || node.platform === filters.platform),
  );
  const kept = new Set(nodes.map((node) => node.id));
  const edges = model.edges.filter((edge) => kept.has(edge.source) && kept.has(edge.target));
  return { ...model, nodes, edges };
};
