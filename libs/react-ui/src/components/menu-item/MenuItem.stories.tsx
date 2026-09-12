import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Select } from '../select';

import { MenuItem } from './MenuItem';

/**
 * `MenuItem` 은 **슬롯 마커**다. 스스로는 `null` 을 렌더하고, `value`·`children`·`disabled` 를
 * 부모인 `Select` 가 children 으로 읽어 옵션을 만든다.
 *
 * 그래서 이 페이지의 story 는 전부 `Select` 안에 넣은 모습이다 — 홀로 둔 `MenuItem` 은 화면에
 * 아무것도 남기지 않는다 (`RendersNothingAlone` 가 그 사실을 검사한다). 옵션의 시각·키보드
 * 동작은 `Select` 가 소유하므로 상태 story 는 `Components/Selection/Select` 에 있다.
 */
const meta = {
  title: 'Components/Selection/MenuItem',
  component: MenuItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: { control: 'text', description: 'Select 가 읽는 옵션 값' },
    disabled: { control: 'boolean' },
    selected: { control: 'boolean' },
    children: { control: false },
    className: { control: false },
    onClick: { control: false },
  },
} satisfies Meta<typeof MenuItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InSelect: Story = {
  args: { value: 'viewer', children: 'Viewer' },
  render: (args) => (
    <Select aria-label="Role" defaultValue="viewer">
      <MenuItem {...args} />
      <MenuItem value="editor">Editor</MenuItem>
      <MenuItem value="admin">Admin</MenuItem>
    </Select>
  ),
};

/** 선택할 수 없는 옵션. 목록에는 남고 포인터·키보드 선택에서만 빠진다. */
export const DisabledOption: Story = {
  args: { value: 'owner', children: 'Owner (invite only)', disabled: true },
  render: (args) => (
    <Select aria-label="Role" defaultValue="editor">
      <MenuItem value="editor">Editor</MenuItem>
      <MenuItem {...args} />
    </Select>
  ),
};

/**
 * `Select` 밖의 `MenuItem` 은 DOM 에 아무것도 만들지 않는다. 실수로 단독 사용했을 때
 * "왜 안 보이지" 로 시간을 쓰지 않도록 이 계약을 눈과 검사 양쪽에 남겨 둔다.
 */
export const RendersNothingAlone: Story = {
  args: { value: 'solo', children: 'Solo' },
  render: (args) => (
    <div data-testid="menu-item-host">
      <MenuItem {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const host = within(canvasElement).getByTestId('menu-item-host');
    await expect(host).toBeEmptyDOMElement();
  },
};
