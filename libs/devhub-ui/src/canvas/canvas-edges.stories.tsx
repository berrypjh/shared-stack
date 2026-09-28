import type { Meta, StoryObj } from '@storybook/react-vite';

import { type CanvasEdge, CanvasEdges } from './canvas-edges';

const EDGES: CanvasEdge[] = [
  { id: 'a-b', path: 'M 40 40 L 260 40' },
  {
    id: 'b-c',
    path: 'M 260 60 L 40 160',
    dash: '4 3',
    label: { x: 150, y: 105, text: '빌드 의존' },
  },
  {
    id: 'c-a',
    path: 'M 40 180 C 40 240, 260 240, 260 80',
    label: { x: 150, y: 240, text: '생성물' },
  },
];

const meta = {
  title: 'Canvas/CanvasEdges',
  component: CanvasEdges,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    edges: EDGES,
    width: 300,
    height: 260,
  },
  argTypes: {
    edges: { control: false },
  },
} satisfies Meta<typeof CanvasEdges>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 노드와 같은 좌표계에 겹쳐 그리는 선. 장식(`aria-hidden`)이다 — 같은 관계가 목록 보기에 글로도 있다.
 * 노드 상자는 이 이야기에 없다 — 실제로는 `CanvasViewport` 안에서 노드와 함께 절대 위치로 겹친다.
 */
export const Playground: Story = {
  render: (args) => (
    <div
      style={{
        position: 'relative',
        width: args.width,
        height: args.height,
        border: '1px dashed var(--ds-stroke-light)',
      }}
    >
      <CanvasEdges {...args} />
    </div>
  ),
};

/** 선 모양(실선 · dash)만으로 종류를 구분한다 — 색으로만 구분하지 않는다. */
export const LineStyles: Story = {
  render: () => (
    <div style={{ position: 'relative', width: 300, height: 120 }}>
      <CanvasEdges
        width={300}
        height={120}
        edges={[
          { id: 'solid', path: 'M 20 30 L 280 30', label: { x: 150, y: 18, text: '실선' } },
          {
            id: 'dashed',
            path: 'M 20 70 L 280 70',
            dash: '4 3',
            label: { x: 150, y: 58, text: 'dash' },
          },
        ]}
      />
    </div>
  ),
};
