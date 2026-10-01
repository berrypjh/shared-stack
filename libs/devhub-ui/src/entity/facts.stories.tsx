import type { Meta, StoryObj } from '@storybook/react-vite';

import { Facts } from './facts';

const meta = {
  title: 'Entity/Facts',
  component: Facts,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    facts: [
      { term: '종류', detail: '설계 결정' },
      { term: '날짜', detail: <time dateTime="2026-09-16">2026-09-16</time> },
      {
        term: '요약',
        detail: '렌더러가 특정 React로 빌드돼 있어 캐럿 범위 사용 불가. 웹 감각이 통하지 않는 자리',
      },
    ],
  },
} satisfies Meta<typeof Facts>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 내용이 여러 줄이면 `details` — 줄마다 한 항목이다. */
export const WithDetails: Story = {
  args: {
    facts: [
      { term: '주제', detail: '인증 흐름' },
      { term: '인용한 시나리오', details: ['브라우저 Google 로그인', '로그아웃과 세션 폐기'] },
    ],
  },
};

/** 내용이 빈 사실은 그리지 않는다 — `담당` 줄이 없다. */
export const SkipsEmpty: Story = {
  args: {
    facts: [
      { term: '스택', detail: 'React · Vite' },
      { term: '담당', detail: '' },
    ],
  },
};
