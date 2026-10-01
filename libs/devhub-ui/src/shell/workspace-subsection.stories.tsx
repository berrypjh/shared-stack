import type { Meta, StoryObj } from '@storybook/react-vite';

import { WorkspaceSubsection } from './workspace-subsection';

const meta = {
  title: 'Shell/WorkspaceSubsection',
  component: WorkspaceSubsection,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { title: '@berrypjh/react-ui', children: <p className="typo-body-small">내용</p> },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof WorkspaceSubsection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 섹션 안의 작은 묶음. */
export const Playground: Story = {};

/** 이어지면 둘째부터 구분선과 여백이 생긴다. */
export const Stacked: Story = {
  render: (args) => (
    <div className="flex flex-col gap-md">
      <WorkspaceSubsection {...args} title="@berrypjh/react-ui" />
      <WorkspaceSubsection {...args} title="@berrypjh/react-native-ui" />
    </div>
  ),
};
