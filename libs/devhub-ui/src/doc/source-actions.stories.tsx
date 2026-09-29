import type { Meta, StoryObj } from '@storybook/react-vite';

import { RecordMeta } from '../entity/record-meta';

import { CopyButton } from './copy-button';
import { SourceActions } from './source-actions';

const PATH = 'docs/records/2026-09-19-onboarding-intro-accessibility.md';

const meta = {
  title: 'Doc/SourceActions',
  component: SourceActions,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    path: PATH,
    actions: <CopyButton text={PATH} label={`경로 복사: ${PATH}`} />,
    views: [
      { href: '#commit', label: 'github.com에서 보기 @ 65b3958', icon: 'commit' },
      { href: '#branch', label: '최신 main에서 보기', icon: 'branch' },
    ],
  },
  argTypes: {
    lead: { control: false },
    actions: { control: false },
  },
} satisfies Meta<typeof SourceActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 기록 머리: 날짜 · 종류가 경로 앞 같은 줄에 온다. */
export const WithRecordMeta: Story = {
  args: { lead: <RecordMeta date="2026-09-19" kind="문제 해결" /> },
};

/** 링크를 만들 수 없으면 보기 줄 대신 이유를 쓴다. */
export const WithoutLinks: Story = {
  args: {
    views: [],
    warning: '스냅샷 커밋에 없는 경로(커밋되지 않음) — 링크를 만들지 않았다',
  },
};
