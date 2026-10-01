import type { Meta, StoryObj } from '@storybook/react-vite';

import { Mono, NamedCode } from './mono';

const meta = {
  title: 'Data Display/Mono',
  component: Mono,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { children: 'pnpm quality:eval' },
} satisfies Meta<typeof Mono>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 경로 · 명령 · ID 를 그대로 읽게 하는 칩. */
export const Playground: Story = {};

/** 사람이 읽는 이름 아래 작은 코드 이름. 이름과 코드가 같으면 이름만 보인다. */
export const WithName: Story = {
  render: () => (
    <NamedCode name="Progressive + Verification" code="progressive-with-verification" />
  ),
};
