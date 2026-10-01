import type { Meta, StoryObj } from '@storybook/react-vite';

import { FilterEmpty } from './filter-empty';

const meta = {
  title: 'Notice/FilterEmpty',
  component: FilterEmpty,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { message: '조건에 맞는 구성 요소가 없음.', clearHref: '/architecture' },
} satisfies Meta<typeof FilterEmpty>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 필터가 아무것도 남기지 않았을 때 — 필터를 푸는 링크를 준다. */
export const Playground: Story = {};
