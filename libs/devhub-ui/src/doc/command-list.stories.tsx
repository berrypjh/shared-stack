import type { Meta, StoryObj } from '@storybook/react-vite';

import { CommandList } from './command-list';

const meta = {
  title: 'Doc/CommandList',
  component: CommandList,
  tags: ['autodocs'],
  args: {
    label: '예시 명령',
    copyLabel: (command: string) => `명령 복사: ${command}`,
    commands: [
      'npx @berrypjh/react-ui summary',
      'npx @berrypjh/react-ui find button',
      'npx @berrypjh/react-ui api Button --signature',
    ],
  },
} satisfies Meta<typeof CommandList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 좁은 칸 — 어절 단위로 줄을 바꾸고 이어지는 줄은 들여 쓴다. */
export const Narrow: Story = {
  args: {
    commands: [
      'pnpm ui:lookup --platform --prompt="RN 화면에 Box 추가" --deps=@berrypjh/react-native-ui',
      'pnpm ui:lookup --token=color.primary --limit=10',
    ],
  },
  render: (args) => (
    <div style={{ width: '320px' }}>
      <CommandList {...args} />
    </div>
  ),
};
