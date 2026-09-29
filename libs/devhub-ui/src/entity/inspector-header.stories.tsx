import type { Meta, StoryObj } from '@storybook/react-vite';

import { InspectorHeader } from './inspector-header';
import { Pager } from './pager';

const RECORDS = [
  { id: 'a', label: '앞 기록', href: '/records/a' },
  { id: 'b', label: '이 기록', href: '/records/b' },
  { id: 'c', label: '뒤 기록', href: '/records/c' },
];

const meta = {
  title: 'Entity/InspectorHeader',
  component: InspectorHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    kind: '기록',
    title: 'React와 react-native 버전은 `^` 없이 정확히 고정',
    pager: <Pager entities={RECORDS} current="b" unit="기록" />,
    sections: [
      { id: 'overview', title: '개요', icon: 'overview' },
      { id: 'source', title: '소스', icon: 'source' },
      { id: 'documents', title: '문서', icon: 'document' },
      { id: 'tests', title: '테스트', icon: 'test' },
    ],
  },
  argTypes: {
    pager: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof InspectorHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 상태 · 메타 한 줄은 `children` 으로 제목 아래에 둔다. */
export const WithMeta: Story = {
  args: {
    kind: '패키지',
    title: 'react-ui',
    children: <p className="typo-caption-small text-text-light">공개(배포) · 웹</p>,
  },
};
