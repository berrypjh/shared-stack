import type { Meta, StoryObj } from '@storybook/react-vite';

import { BarChart, type BarGroup } from './bar-chart';

const GROUPS: BarGroup[] = [
  {
    label: 'gzip',
    bars: [
      { key: 'button', label: 'Button', value: 1.8, scale: 4, text: '1.8 kB', tone: 'default' },
      { key: 'select', label: 'Select', value: 3.6, scale: 4, marker: 4, text: '3.6 kB' },
      {
        key: 'table',
        label: 'Table',
        value: 4.9,
        scale: 4,
        marker: 4,
        text: '4.9 kB',
        tone: 'over',
      },
    ],
  },
];

const meta = {
  title: 'Chart/BarChart',
  component: BarChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    title: '컴포넌트별 번들 크기',
    description: '최신 실행의 gzip 크기, 한도는 4 kB',
    unit: 'kB',
    groups: GROUPS,
  },
  argTypes: {
    groups: { control: false },
  },
} satisfies Meta<typeof BarChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 막대마다 값 글이 늘 보인다 — hover 없이 읽힌다. 기준선(`marker`)을 넘으면 `tone: 'over'`. */
export const Playground: Story = {};

/** 측정하지 못한 값은 0 막대가 아니라 "막대 없음"으로 남는다 — 없는 것을 0 으로 보이지 않는다. */
export const WithMissingValue: Story = {
  args: {
    groups: [
      {
        label: 'gzip',
        bars: [
          ...GROUPS[0].bars,
          {
            key: 'unmeasured',
            label: 'NewComponent',
            value: null,
            scale: null,
            text: '측정 안 됨',
          },
        ],
      },
    ],
  },
};

/** 묶음 여러 개 — 같은 조건(단위 · 기준)의 값만 한 차트에 둔다는 계약을 보여준다. */
export const MultipleGroups: Story = {
  args: {
    groups: [
      GROUPS[0],
      {
        label: 'minified',
        bars: [
          { key: 'button', label: 'Button', value: 5.1, scale: 12, text: '5.1 kB' },
          { key: 'select', label: 'Select', value: 9.8, scale: 12, marker: 12, text: '9.8 kB' },
        ],
      },
    ],
  },
};
