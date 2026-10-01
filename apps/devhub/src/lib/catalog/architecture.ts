import type { Catalog, Platform, Relation, Visibility } from '../../domain/model';

import { BEND, COLUMN, GRID, MARGIN, NODE, ROW } from './architecture-layout';

/**
 * 카탈로그에서 유도하는 아키텍처 그림 모델. 노드는 앱 · 패키지 · 도구 전부, 선은 카탈로그 관계 하나에 하나다.
 * 관계를 더하거나 합치지 않는다 — 같은 두 노드 사이의 다른 종류 관계는 따로 휜 선이 된다.
 */

export type NodeKind = 'application' | 'package' | 'tool';

export type ArchNode = {
  id: string;
  label: string;
  kind: NodeKind;
  platform: Platform;
  /** 패키지만 가진다(매니페스트의 `private`). */
  visibility?: Visibility;
  /** 저장소 안 위치. */
  root: string;
  x: number;
  y: number;
};

type Point = { x: number; y: number };

export type ArchEdge = {
  id: string;
  kind: Relation['kind'];
  relation: Relation;
  /** 그리는 방향. 의존은 기대는 대상 → 기대는 쪽, 생성물은 만든 쪽 → 싣는 쪽, 검증은 검증하는 쪽 → 대상. */
  source: string;
  target: string;
  path: string;
  label: Point;
};

export type ArchitectureModel = {
  width: number;
  height: number;
  nodes: ArchNode[];
  edges: ArchEdge[];
};

/** 선을 그리는 방향의 양 끝. */
export const drawnEnds = (relation: Relation): { source: string; target: string } =>
  relation.kind === 'build-dependency' || relation.kind === 'consumer-dependency'
    ? { source: relation.to, target: relation.from }
    : { source: relation.from, target: relation.to };

export type Grid = Record<string, readonly [column: number, row: number]>;

const positionOf = (grid: Grid, id: string): Point | undefined => {
  const cell = grid[id];
  return cell && { x: MARGIN + cell[0] * COLUMN, y: MARGIN + cell[1] * ROW };
};

const centerOf = (node: ArchNode): Point => ({
  x: node.x + NODE.width / 2,
  y: node.y + NODE.height / 2,
});

/** 상자 가운데에서 `toward` 로 가는 선이 상자를 빠져나가는 점. */
const boxAnchor = (center: Point, toward: Point): Point => {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) return center;
  const scale = Math.min(
    dx === 0 ? Infinity : NODE.width / 2 / Math.abs(dx),
    dy === 0 ? Infinity : NODE.height / 2 / Math.abs(dy),
  );
  return { x: center.x + dx * scale, y: center.y + dy * scale };
};

/**
 * 같은 두 노드를 잇는 관계마다의 휨: 하나면 0, 여럿이면 가운데를 중심으로 벌린다.
 * 방향과 상관없이 두 ID 의 정렬 순서로 기준을 잡아, 반대 방향 선도 서로 떨어진다.
 */
const bendsOf = (relations: readonly Relation[]) => {
  const pairOf = (relation: Relation) => [relation.from, relation.to].sort().join('|');
  const groups = new Map<string, string[]>();
  for (const relation of relations) {
    const pair = pairOf(relation);
    groups.set(pair, [...(groups.get(pair) ?? []), relation.id]);
  }
  return new Map(
    relations.map((relation) => {
      const group = groups.get(pairOf(relation)) ?? [];
      return [relation.id, group.indexOf(relation.id) - (group.length - 1) / 2];
    }),
  );
};

const geometry = (source: ArchNode, target: ArchNode, bend: number) => {
  const [first, second] = [source, target].sort((a, b) => a.id.localeCompare(b.id));
  const a = centerOf(first);
  const b = centerOf(second);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const control = {
    x: (a.x + b.x) / 2 - ((b.y - a.y) / length) * bend * BEND * 2,
    y: (a.y + b.y) / 2 + ((b.x - a.x) / length) * bend * BEND * 2,
  };
  const start = boxAnchor(centerOf(source), control);
  const end = boxAnchor(centerOf(target), control);
  return {
    path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
    label: {
      x: 0.25 * start.x + 0.5 * control.x + 0.25 * end.x,
      y: 0.25 * start.y + 0.5 * control.y + 0.25 * end.y,
    },
    start,
    control,
    end,
  };
};

/** 선의 한 점. `t` 는 0(시작)부터 1(끝)까지. 테스트가 선이 상자를 지나는지 볼 때 쓴다. */
export const curvePoint = (edge: ArchEdge, t: number): Point => {
  const [, sx, sy, , cx, cy, ex, ey] = edge.path.split(' ');
  const [x0, y0, x1, y1, x2, y2] = [sx, sy, cx, cy, ex, ey].map(Number);
  const u = 1 - t;
  return {
    x: u * u * x0 + 2 * u * t * x1 + t * t * x2,
    y: u * u * y0 + 2 * u * t * y1 + t * t * y2,
  };
};

/** `grid` 는 그리기 자리다. 기본은 `layout.ts` 의 `GRID`. */
export const architectureModel = (catalog: Catalog, grid: Grid = GRID): ArchitectureModel => {
  const nodes: ArchNode[] = [
    ...catalog.applications.map((app) => ({
      id: app.id,
      label: app.id,
      kind: 'application' as const,
      platform: app.platform,
      root: app.root,
    })),
    ...catalog.packages.map((pkg) => ({
      id: pkg.id,
      label: pkg.id,
      kind: 'package' as const,
      platform: pkg.platform,
      visibility: pkg.visibility,
      root: pkg.root,
    })),
    ...catalog.tools.map((tool) => ({
      id: tool.id,
      label: tool.name,
      kind: 'tool' as const,
      platform: tool.platform,
      root: tool.root,
    })),
  ].flatMap((node) => {
    const position = positionOf(grid, node.id);
    return position ? [{ ...node, ...position }] : [];
  });

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const bends = bendsOf(catalog.relations);
  const edges: ArchEdge[] = catalog.relations.flatMap((relation) => {
    const { source, target } = drawnEnds(relation);
    const from = byId.get(source);
    const to = byId.get(target);
    if (!from || !to) return [];
    const { path, label } = geometry(from, to, bends.get(relation.id) ?? 0);
    return [{ id: relation.id, kind: relation.kind, relation, source, target, path, label }];
  });

  const columns = Math.max(...Object.values(grid).map(([column]) => column));
  const rows = Math.max(...Object.values(grid).map(([, row]) => row));
  return {
    width: MARGIN * 2 + columns * COLUMN + NODE.width,
    height: MARGIN * 2 + rows * ROW + NODE.height,
    nodes,
    edges,
  };
};

/** 관계가 하나도 없는 노드. 그림 맨 아래 띠에 서고 목록에서는 "관계 없음"이다. */
export const isolatedIds = (model: ArchitectureModel) => {
  const touched = new Set(model.edges.flatMap((edge) => [edge.source, edge.target]));
  return new Set(model.nodes.filter((node) => !touched.has(node.id)).map((node) => node.id));
};
