import { useId } from 'react';

export type CanvasEdge = {
  id: string;
  path: string;
  /** SVG dash. 선의 종류는 색이 아니라 모양과 글자로 구분한다. */
  dash?: string;
  /** 선의 뜻을 말하는 글. 흐름처럼 모든 선이 같은 뜻이면 없다. */
  label?: { x: number; y: number; text: string };
};

/**
 * 노드와 같은 좌표의 선과 라벨. 보조 기술에는 장식이다 — 같은 관계가 목록 보기에 글로 있다.
 * 화살표 표식 id 는 그림마다 따로 둔다: 같은 그림이 "크게 보기"에서 한 번 더 그려진다.
 */
export const CanvasEdges = ({
  edges,
  width,
  height,
}: {
  edges: CanvasEdge[];
  width: number;
  height: number;
}) => {
  const marker = useId();
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ds-stroke-dark)" />
        </marker>
      </defs>
      {edges.map((edge) => (
        <path
          key={edge.id}
          d={edge.path}
          fill="none"
          stroke="var(--ds-stroke-dark)"
          strokeWidth={1.5}
          strokeDasharray={edge.dash}
          markerEnd={`url(#${marker})`}
        />
      ))}
      {edges.map((edge) =>
        edge.label ? (
          <text
            key={`${edge.id}-label`}
            x={edge.label.x}
            y={edge.label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--ds-text-light)"
            stroke="var(--ds-background-default)"
            strokeWidth={4}
            paintOrder="stroke"
            fontSize={12}
          >
            {edge.label.text}
          </text>
        ) : null,
      )}
    </svg>
  );
};
