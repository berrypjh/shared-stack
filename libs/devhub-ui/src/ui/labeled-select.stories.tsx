import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { LabeledSelect } from './labeled-select';

const meta = {
  title: 'Data Display/LabeledSelect',
  component: LabeledSelect,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    label: '실행',
    value: 'run-b',
    options: [
      { value: 'run-a', label: 'run-a' },
      { value: 'run-b', label: 'run-b' },
    ],
    onChange: fn(),
  },
} satisfies Meta<typeof LabeledSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 보이는 label 이 이름인 native select. */
export const Playground: Story = {};

/** 현재 값이 목록에 없으면 그 값을 선택 불가로 보여 준다. */
export const UnknownValue: Story = { args: { value: 'run-z' } };
