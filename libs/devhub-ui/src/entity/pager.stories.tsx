import type { Meta, StoryObj } from '@storybook/react-vite';

import type { PagerItem } from './pager';
import { Pager } from './pager';

const ENTITIES: PagerItem[] = [
  { id: 'design-tokens', label: 'design-tokens', href: '/packages/design-tokens' },
  { id: 'ui-core', label: 'ui-core', href: '/packages/ui-core' },
  { id: 'react-ui', label: 'react-ui', href: '/packages/react-ui' },
];

const meta = {
  title: 'Entity/Pager',
  component: Pager,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    entities: ENTITIES,
    current: 'ui-core',
    unit: '패키지',
  },
  argTypes: {
    entities: { control: false },
  },
} satisfies Meta<typeof Pager>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 이웃이 둘 다 있는 가운데 항목. 링크는 상세 정보(`#devhub-inspector`)로 이어진다. */
export const Playground: Story = {};

/** 첫 항목 — 이전 자리는 비활성 버튼이라 자리는 그대로다. */
export const FirstItem: Story = {
  args: { current: 'design-tokens' },
};

/** 마지막 항목 — 다음 자리가 비활성이다. */
export const LastItem: Story = {
  args: { current: 'react-ui' },
};
