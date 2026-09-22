import type {
  ConsumerJourney,
  ExecutionContext,
  JourneyStep,
  StepStatus,
} from '../../domain/model';

/**
 * 흐름 그림의 좌표. 카탈로그 흐름에서 매번 유도하고 저장하지 않는다.
 * 레인은 흐름이 실제로 거치는 실행 위치(카탈로그 순서), 열은 `next` 를 따른다.
 */

export const NODE = { width: 224, height: 120 } as const;
const GAP_X = 56;
const GAP_Y = 16;
const LANE_PADDING = 20;
const LABEL_WIDTH = 136;
const LOOP_DEPTH = 40;

export type FlowLane = { id: string; name: string; y: number; height: number };

export type FlowNode = {
  id: string;
  /** 흐름 안의 번호(1부터). 목록의 번호와 같다. */
  order: number;
  x: number;
  y: number;
  intent: string;
  status: StepStatus;
  context: string;
  owner: string;
};

export type FlowEdge = { id: string; from: string; to: string; back: boolean; path: string };

export type FlowModel = {
  width: number;
  height: number;
  lanes: FlowLane[];
  nodes: FlowNode[];
  edges: FlowEdge[];
};

/**
 * 단계의 열: 앞선 어떤 단계도 가리키지 않으면 0, 아니면 가리키는 앞 단계 중 가장 깊은 것 + 1.
 * 뒤로 가는 선(루프)은 깊이를 더하지 않는다.
 */
const columnsOf = (steps: readonly JourneyStep[]) => {
  const position = new Map(steps.map((step, index) => [step.id, index]));
  const column = new Map(steps.map((step) => [step.id, 0]));
  for (const step of steps) {
    for (const target of step.next) {
      if ((position.get(target) ?? -1) <= (position.get(step.id) ?? 0)) continue;
      column.set(target, Math.max(column.get(target) ?? 0, (column.get(step.id) ?? 0) + 1));
    }
  }
  return column;
};

const edgePath = (from: FlowNode, to: FlowNode, back: boolean) => {
  if (back) {
    const sx = from.x + NODE.width / 2;
    const tx = to.x + NODE.width / 2;
    const low = Math.max(from.y, to.y) + NODE.height + LOOP_DEPTH;
    return `M ${sx} ${from.y + NODE.height} C ${sx} ${low}, ${tx} ${low}, ${tx} ${to.y + NODE.height}`;
  }
  const sx = from.x + NODE.width;
  const sy = from.y + NODE.height / 2;
  const tx = to.x;
  const ty = to.y + NODE.height / 2;
  const bend = Math.max(24, (tx - sx) / 2);
  return `M ${sx} ${sy} C ${sx + bend} ${sy}, ${tx - bend} ${ty}, ${tx} ${ty}`;
};

export const flowModel = (
  journey: ConsumerJourney,
  contexts: readonly ExecutionContext[],
): FlowModel => {
  const { steps } = journey;
  const column = columnsOf(steps);
  const used = contexts.filter((context) => steps.some((step) => step.context === context.id));

  // 같은 레인 · 같은 열의 단계는 레인 안에서 위아래로 쌓는다.
  const slot = new Map<string, number>();
  const depth = new Map<string, number>();
  for (const step of steps) {
    const cell = `${step.context}:${column.get(step.id)}`;
    slot.set(step.id, depth.get(cell) ?? 0);
    depth.set(cell, (depth.get(cell) ?? 0) + 1);
  }
  const rowsOf = (context: string) =>
    Math.max(...[...depth].filter(([cell]) => cell.startsWith(`${context}:`)).map(([, n]) => n));

  const hasLoop = steps.some((step, index) =>
    step.next.some((target) => steps.findIndex((s) => s.id === target) <= index),
  );
  let y = 0;
  const lanes: FlowLane[] = used.map((context) => {
    const rows = rowsOf(context.id);
    const height =
      LANE_PADDING * 2 + rows * NODE.height + (rows - 1) * GAP_Y + (hasLoop ? LOOP_DEPTH : 0);
    const lane = { id: context.id, name: context.name, y, height };
    y += height;
    return lane;
  });
  const laneY = new Map(lanes.map((lane) => [lane.id, lane.y]));

  const nodes: FlowNode[] = steps.map((step, index) => ({
    id: step.id,
    order: index + 1,
    x: LABEL_WIDTH + (column.get(step.id) ?? 0) * (NODE.width + GAP_X),
    y:
      (laneY.get(step.context) ?? 0) +
      LANE_PADDING +
      (slot.get(step.id) ?? 0) * (NODE.height + GAP_Y),
    intent: step.intent,
    status: step.status,
    context: step.context,
    owner: step.owner,
  }));

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const position = new Map(steps.map((step, index) => [step.id, index]));
  const edges: FlowEdge[] = steps.flatMap((step) =>
    step.next.flatMap((target) => {
      const from = byId.get(step.id);
      const to = byId.get(target);
      if (!from || !to) return [];
      const back = (position.get(target) ?? 0) <= (position.get(step.id) ?? 0);
      return [
        {
          id: `${step.id}->${target}`,
          from: step.id,
          to: target,
          back,
          path: edgePath(from, to, back),
        },
      ];
    }),
  );

  const columns = Math.max(...nodes.map((node) => column.get(node.id) ?? 0)) + 1;
  return { width: LABEL_WIDTH + columns * (NODE.width + GAP_X), height: y, lanes, nodes, edges };
};
