import type { Meta, StoryObj } from '@storybook/react-vite';

import { RecordMeta } from './record-meta';

const meta = {
  title: 'Entity/RecordMeta',
  component: RecordMeta,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    date: '2026-09-22',
    kind: '설계 결정',
  },
} satisfies Meta<typeof RecordMeta>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 종류 글자는 앱의 어휘(`RECORD_KIND` 같은)가 정한다 — 여기는 문자열만 받는다. */
export const Kinds: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '8px' }}>
      <RecordMeta date="2026-09-22" kind="설계 결정" />
      <RecordMeta date="2026-09-16" kind="문제 해결" />
      <RecordMeta date="2026-09-07" kind="구현" />
    </div>
  ),
};
