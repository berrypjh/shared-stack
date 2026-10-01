import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatusNotice } from './status-notice';

const meta = {
  title: 'Notice/StatusNotice',
  component: StatusNotice,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    kind: 'empty',
    kindLabel: '미수집',
    icon: '○',
    title: '아직 수집한 실행이 없음',
    cause: '공개 index.json 이 없거나 비어 있음.',
    commands: ['pnpm quality:eval'],
  },
} satisfies Meta<typeof StatusNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 값 대신 보이는 상태 — 이름 · 제목 · 원인 · 복사할 명령. */
export const Playground: Story = {};

/** 오류는 테두리로 보조한다. 뜻은 글이 전한다. */
export const Error: Story = {
  args: {
    kind: 'error',
    kindLabel: '오류',
    icon: '✕',
    title: '공개 artifact 가 계약과 맞지 않음',
    cause: '검증하지 못해 화면에 올리지 않았음',
    commands: [],
    tone: 'error',
  },
};

/** 값을 가리지 않는 경고 한 줄 — 실행 선택 바로 아래처럼 값 위에 둘 때. */
export const Compact: Story = {
  args: {
    kind: 'stale',
    kindLabel: '기준과 다른 source',
    icon: '⟳',
    title: '기준 source 와 다른 실행',
    cause: 'run source 11ce3d1 이 기준 d7f0ff8 과 다릅니다',
    compact: true,
  },
};
