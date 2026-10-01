import type { Meta, StoryObj } from '@storybook/react-vite';

import { NotFound } from './not-found';

const meta = {
  title: 'Notice/NotFound',
  component: NotFound,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    eyebrow: '패키지',
    icon: 'package',
    title: '카탈로그에 없는 항목',
    message: '패키지에 old-ui 항목이 없음.',
    backHref: '/packages',
    backLabel: '패키지 목록으로 가기',
  },
} satisfies Meta<typeof NotFound>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 고른 항목이 없을 때의 작업 영역 — 목록으로 돌아가는 링크와 빈 옆 칸. */
export const Playground: Story = {};
