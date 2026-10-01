import type { Meta, StoryObj } from '@storybook/react-vite';

import { TermList } from './term-list';

const meta = {
  title: 'Doc/TermList',
  component: TermList,
  tags: ['autodocs'],
  args: {
    label: '옵션',
    items: [
      { term: '--split', meaning: 'dev · test (기본 dev)' },
      { term: '--trials', meaning: 'task 당 시행 횟수 (기본 1)' },
      { term: '--out · --run-id', meaning: '산출물 위치 (기본 tmp/llm-evals/<split>-<시각>)' },
    ],
  },
  render: (args) => (
    <div style={{ width: '320px' }}>
      <TermList {...args} />
    </div>
  ),
} satisfies Meta<typeof TermList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
