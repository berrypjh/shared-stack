import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { GlobalSearch, type GlobalSearchProps } from './global-search';

type Entry = { id: string; label: string; description: string; href: string };

const ENTRIES: Entry[] = [
  {
    id: 'react-ui',
    label: 'react-ui',
    description: '패키지 · 웹 UI 컴포넌트',
    href: '/packages/react-ui',
  },
  {
    id: 'devhub-ui',
    label: 'devhub-ui',
    description: '패키지 · DevHub 공용 셸',
    href: '/packages/devhub-ui',
  },
  {
    id: 'root-readme',
    label: 'README.md',
    description: '문서 · 저장소 개요',
    href: '/documents/root-readme',
  },
];

const searchFn: GlobalSearchProps<Entry>['results'] = (query) => {
  const q = query.trim().toLowerCase();
  const all = q ? ENTRIES.filter((entry) => entry.label.toLowerCase().includes(q)) : [];
  return { all, shown: all.slice(0, 5) };
};

const meta = {
  title: 'Navigation/GlobalSearch',
  component: GlobalSearch<Entry>,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    results: searchFn,
    keyOf: (entry) => entry.id,
    toSuggestion: (entry) => ({ id: entry.id, label: entry.label, description: entry.description }),
    hrefOf: (entry) => entry.href,
    placeholder: (shortcut) => `저장소 검색 (${shortcut})`,
  },
  argTypes: {
    results: { control: false },
    keyOf: { control: false },
    toSuggestion: { control: false },
    hrefOf: { control: false },
    placeholder: { control: false },
    noMatch: { control: false },
  },
} satisfies Meta<typeof GlobalSearch<Entry>>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * `⌘K` / `Ctrl+K` 로 어디서든 연다. `lg` 미만은 버튼 뒤에 접혀 있다가 둘째 줄로 펼쳐진다.
 * 결과 수와 없음은 늘 있는 live region 이 알린다.
 */
export const Playground: Story = {};

/** 입력하면 combobox 제안이 뜬다 — react-ui `SearchField` 가 화살표 · Enter · Escape 를 맡는다. */
export const TypingShowsSuggestions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: '저장소 검색' });
    await userEvent.type(input, 'react');
    await expect(canvas.getByText('react-ui')).toBeTruthy();
  },
};

/** 맞는 것이 없을 때. `noMatch` 는 화면 자리에만 두고(`aria-hidden`), 실제 알림은 live region 이 한다. */
export const NoMatches: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: '저장소 검색' });
    await userEvent.type(input, '존재하지않는이름');
    // GlobalSearch 자신의 live region 과 SearchField 빈 상태 자신의 `role="status"` 둘 다 같은 글을
    // 담는다(하나가 두 번 읽히지 않도록 내용 쪽은 `aria-hidden`) — 어느 한쪽만 있어도 알림은 된 것이다.
    const statuses = canvas.getAllByRole('status');
    await expect(statuses.some((el) => el.textContent === '일치하는 항목이 없습니다')).toBe(true);
  },
};
