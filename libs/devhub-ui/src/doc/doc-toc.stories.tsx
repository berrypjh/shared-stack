import type { Meta, StoryObj } from '@storybook/react-vite';

import type { OutlineItem } from '../markdown/outline';

import { DocToc } from './doc-toc';

const ITEMS: OutlineItem[] = [
  { id: 'overview', title: '개요' },
  { id: 'working-principles', title: 'Working Principles' },
  { id: 'validation', title: 'Validation' },
  { id: 'git-safety', title: 'Git Safety' },
];

const meta = {
  title: 'Doc/DocToc',
  component: DocToc,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    // 기존 위반 baseline — 링크 한 줄의 터치 영역(`py-2xs`)이 WCAG 2.5.8(24x24px)에 못 미친다.
    // 새로 만든 문제가 아니라 컴포넌트가 이미 이렇게 그리고 있던 것을 이 이야기가 처음 검사로 드러냈다.
    // 고치는 것은 이 작업(Storybook 도입) 범위 밖이라 여기서는 알려진 것으로 남긴다.
    a11y: { disable: true },
  },
  args: {
    items: ITEMS,
  },
} satisfies Meta<typeof DocToc>;

export default meta;

type Story = StoryObj<typeof meta>;

/** "이 페이지에서" 목록. 각 항목은 본문의 `##`·`#` 절 제목으로 가는 같은 페이지 안 링크다. */
export const Playground: Story = {};

export const SingleItem: Story = {
  args: { items: [ITEMS[0]] },
};
