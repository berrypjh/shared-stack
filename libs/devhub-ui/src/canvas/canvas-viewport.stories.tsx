import type { Meta, StoryObj } from '@storybook/react-vite';

import { CanvasEdges } from './canvas-edges';
import { CanvasViewport, type LegendItem } from './canvas-viewport';

const CONTENT = { width: 640, height: 360 };

const NODES = [
  { id: 'tokens', x: 40, y: 40, label: 'design-tokens' },
  { id: 'ui-core', x: 40, y: 200, label: 'ui-core' },
  { id: 'react-ui', x: 320, y: 200, label: 'react-ui' },
];

const LEGEND: LegendItem[] = [
  { label: '빌드 의존', line: null },
  { label: '생성물', line: '4 3' },
];

const NodeBox = ({ node }: { node: (typeof NODES)[number] }) => (
  <div
    role="link"
    tabIndex={0}
    className="absolute flex h-20 w-40 flex-col justify-center gap-xs rounded-lg border border-stroke-light bg-background-surface p-md shadow-xs"
    style={{ left: node.x, top: node.y }}
  >
    <span className="typo-body-small-strong">{node.label}</span>
    <span className="devhub-code text-text-light">libs/{node.id}</span>
  </div>
);

const meta = {
  title: 'Canvas/CanvasViewport',
  component: CanvasViewport,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    label: '아키텍처 그림',
    content: CONTENT,
    legend: LEGEND,
    summary: `노드 ${NODES.length}개`,
    children: ({ reveal }) => (
      <>
        <CanvasEdges
          width={CONTENT.width}
          height={CONTENT.height}
          edges={[
            { id: 'tokens-core', path: 'M 120 100 L 120 200' },
            { id: 'core-react', path: 'M 200 240 L 320 240', dash: '4 3' },
          ]}
        />
        <ul className="contents">
          {NODES.map((node) => (
            <li
              key={node.id}
              onFocus={() => reveal({ x: node.x, y: node.y, width: 160, height: 80 })}
            >
              <NodeBox node={node} />
            </li>
          ))}
        </ul>
      </>
    ),
  },
  argTypes: {
    content: { control: false },
    legend: { control: false },
    children: { control: false },
    selected: { control: false },
  },
} satisfies Meta<typeof CanvasViewport>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * DevHub 의 모든 그림이 쓰는 이동 · 확대 표면. 끌기로 이동, Ctrl+휠로 확대, 방향키로 이동,
 * "크게 보기" 로 같은 그림을 창 크기 `<dialog>` 로 연다.
 */
export const Playground: Story = {};

/** 딥링크로 골라 들어온 노드 — 열 때 그 사각형이 보기 안으로 옮겨진다. */
export const WithSelection: Story = {
  args: {
    selected: { x: 320, y: 200, width: 160, height: 80 },
  },
};
