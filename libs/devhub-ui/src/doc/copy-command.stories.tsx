import type { Meta, StoryObj } from '@storybook/react-vite';

import { CopyCommand } from './copy-command';

const meta = {
  title: 'Doc/CopyCommand',
  component: CopyCommand,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { command: 'pnpm quality:eval' },
} satisfies Meta<typeof CopyCommand>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 명령 한 줄과 복사 버튼. 버튼은 복사만 한다. */
export const Playground: Story = {};
