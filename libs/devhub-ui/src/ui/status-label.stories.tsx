import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatusLabel } from './status-label';

const meta = {
  title: 'Data Display/StatusLabel',
  component: StatusLabel,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { tone: 'passed', label: '통과' },
} satisfies Meta<typeof StatusLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 통과 — 아이콘은 장식이고 뜻은 글이 전한다. */
export const Playground: Story = {};

/** 실패. */
export const Failed: Story = { args: { tone: 'failed', label: '실패' } };
