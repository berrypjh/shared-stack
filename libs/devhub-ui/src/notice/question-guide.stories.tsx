import type { Meta, StoryObj } from '@storybook/react-vite';

import { QuestionGuide } from './question-guide';

const meta = {
  title: 'Notice/QuestionGuide',
  component: QuestionGuide,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    question: '에이전트가 과제에 맞는 플랫폼과 패키지를 골랐나?',
    points: [
      '과제마다 정답 플랫폼이 있다.',
      '고른 플랫폼을 보고하지 않으면 "보고 안 함" 으로 센다.',
    ],
  },
} satisfies Meta<typeof QuestionGuide>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 화면 머리의 질문 하나와 읽는 법. */
export const Playground: Story = {};
