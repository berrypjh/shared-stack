import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';

import { Switch } from './Switch';

const meta = {
  title: 'Components/Selection/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    children: '새 댓글 알림',
  },
  argTypes: {
    className: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

const matrixStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
  gap: '8px 16px',
} as const;

const stackStyle = { display: 'grid', gap: '12px', justifyItems: 'start' } as const;

/**
 * 정적으로 그릴 수 있는 상태 전부. hover·pressed 는 여기 없다 — Switch 는 그 상태의 시각을
 * 두지 않았다(없는 상태를 스토리를 위해 지어내지 않는다). 포커스는 `Keyboard` 가 play 로 켜고,
 * 방향은 `RightToLeft` 가 본다. 테마마다 반복되므로 id 를 쓰지 않는다.
 */
const SwitchMatrix = () => (
  <div style={matrixStyle}>
    <Switch>꺼짐</Switch>
    <Switch defaultChecked>켜짐</Switch>
    <Switch disabled>비활성 · 꺼짐</Switch>
    <Switch disabled defaultChecked>
      비활성 · 켜짐
    </Switch>
    <Switch aria-label="보이는 라벨 없음" />
  </div>
);

/** controlled — `checked` 가 진실이고 `onChange` 는 native 이벤트다. */
export const Playground: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div style={stackStyle}>
        <Switch checked={checked} onChange={(event) => setChecked(event.target.checked)}>
          새 댓글 알림
        </Switch>
        <output>{checked ? '켜짐' : '꺼짐'}</output>
      </div>
    );
  },
};

/** 등록된 모든 테마에서 같은 상태 매트릭스를 한 스크린샷에 담는다. */
export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => <ThemeGallery>{() => <SwitchMatrix />}</ThemeGallery>,
};

/**
 * 키보드·라벨 클릭은 native 가 소유한다. Tab 이 들어오면 `:focus-visible` outline 이 보이고
 * Space 가 켜고 끄며, 보이는 라벨을 누르면 토글된다. (키 입력은 user-event 시뮬레이션이다.)
 */
export const Keyboard: Story = {
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
  render: () => (
    <div style={stackStyle}>
      <Switch>새 댓글 알림</Switch>
      <Switch>다크 모드</Switch>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alerts = canvas.getByRole('switch', { name: '새 댓글 알림' });
    const dark = canvas.getByRole('switch', { name: '다크 모드' });

    await userEvent.tab();
    await expect(alerts).toHaveFocus();
    await expect(getComputedStyle(alerts).outlineStyle).toBe('solid');

    await userEvent.keyboard(' ');
    await expect(alerts).toBeChecked();
    await userEvent.keyboard(' ');
    await expect(alerts).not.toBeChecked();

    await userEvent.click(canvas.getByText('다크 모드'));
    await expect(dark).toBeChecked();
  },
};

/**
 * RTL 에서는 thumb 이 **반대쪽으로** 간다 — `margin-inline-start` 가 물리 오른쪽 여백이 된다.
 * 역할·상태·키보드는 방향과 무관하다.
 */
export const RightToLeft: Story = {
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
  render: () => (
    <div dir="rtl" style={stackStyle}>
      <Switch>إشعارات التعليقات</Switch>
      <Switch defaultChecked>الوضع الداكن</Switch>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const off = canvas.getByRole('switch', { name: 'إشعارات التعليقات' });
    const on = canvas.getByRole('switch', { name: 'الوضع الداكن' });

    await expect(getComputedStyle(on, '::before').marginRight).not.toBe('0px');
    await expect(getComputedStyle(on, '::before').marginLeft).toBe('0px');
    await expect(getComputedStyle(off, '::before').marginRight).toBe('0px');

    await userEvent.tab();
    await userEvent.keyboard(' ');
    await expect(off).toBeChecked();
  },
};

export const LongLabel: Story = {
  args: {
    children:
      '내가 쓴 글에 새 댓글이 달리거나 누군가 나를 언급하면 이메일과 푸시 알림으로 알려 줍니다',
  },
  render: (args) => (
    <div style={{ maxWidth: '320px' }}>
      <Switch {...args} />
    </div>
  ),
};

/**
 * Windows 고대비. 트랙 배경은 지워지지만 테두리와 border 로 그린 thumb 이 남고, 켜짐은 thumb
 * 위치와 `Highlight`, 비활성은 `GrayText` 로 구분된다. Chromatic 이 `forcedColors` 로 찍는다.
 */
export const ForcedColors: Story = {
  parameters: { chromatic: { forcedColors: 'active', prefersReducedMotion: 'reduce' } },
  render: () => <SwitchMatrix />,
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('switch', { name: '꺼짐' })).toHaveFocus();
  },
};
