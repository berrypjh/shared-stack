import { type ArchitectureModel, curvePoint } from './architecture';
import { NODE } from './architecture-layout';

/**
 * 그림이 읽히는지의 기계적 기준. 선이 잇지 않는 상자를 지나거나, 라벨끼리 · 라벨과 상자가 겹치면 문제다.
 * 자리(`layout.ts`)를 바꾸면 테스트가 이 목록이 비었는지 본다.
 */
export const layoutProblems = (model: ArchitectureModel): string[] => {
  const through = model.edges.flatMap((edge) =>
    model.nodes
      .filter((node) => node.id !== edge.source && node.id !== edge.target)
      .filter((node) =>
        Array.from({ length: 41 }, (_, i) => curvePoint(edge, i / 40)).some(
          (p) =>
            p.x > node.x - 4 &&
            p.x < node.x + NODE.width + 4 &&
            p.y > node.y - 4 &&
            p.y < node.y + NODE.height + 4,
        ),
      )
      .map((node) => `${edge.id} crosses ${node.id}`),
  );
  const labels = model.edges.flatMap((a, i) =>
    model.edges
      .slice(i + 1)
      .filter((b) => Math.abs(a.label.x - b.label.x) < 90 && Math.abs(a.label.y - b.label.y) < 20)
      .map((b) => `${a.id} ~ ${b.id}`),
  );
  const onNode = model.edges.flatMap((edge) =>
    model.nodes
      .filter(
        (node) =>
          edge.label.x > node.x - 40 &&
          edge.label.x < node.x + NODE.width + 40 &&
          edge.label.y > node.y - 8 &&
          edge.label.y < node.y + NODE.height + 8,
      )
      .map((node) => `${edge.id} label on ${node.id}`),
  );
  return [...through, ...labels, ...onNode];
};
