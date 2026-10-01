import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExplorerDrawerProvider } from './explorer-drawer';
import { TopBar } from './top-bar';

const meta = {
  title: 'Shell/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    summary: <span className="devhub-code">berrypjh/shared-stack · 커밋 f64a9f3</span>,
    search: <input aria-label="저장소 검색" placeholder="흐름 · 패키지 · 소스 검색 (⌘K)" />,
  },
  argTypes: {
    summary: { control: false },
    search: { control: false },
  },
  decorators: [
    (Story) => (
      <ExplorerDrawerProvider>
        <Story />
      </ExplorerDrawerProvider>
    ),
  ],
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 제품명, 요약(`xl` 부터), 검색, 테마. 화면 사이 이동은 여기 없다 — 왼쪽 탐색기가 맡는다.
 * `lg` 미만에서는 메뉴 버튼(탐색기 서랍)이 왼쪽에 더해진다.
 */
export const Playground: Story = {};

/** 요약이 없으면 그 자리는 비고, 제품명 쪽이 넓게 남는다. */
export const WithoutSummary: Story = {
  args: { summary: undefined },
};

/** 좁은 화면 — 메뉴 버튼과 검색 버튼만 보인다. 검색 칸은 그 버튼을 눌러야 둘째 줄로 열린다. */
export const NarrowViewport: Story = {
  parameters: { viewport: { value: 'mobile' } },
};
