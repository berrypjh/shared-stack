import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';

import { Avatar } from './Avatar';

/**
 * 결정적 스토리만 둔다.
 *
 * Avatar 는 상호작용이 없어 hover·pressed·focus 스토리가 없다. 이미지 실패는 **존재하지 않는
 * URL** 로 재현한다 — 네트워크에 기대지 않으므로 Chromatic 에서도 같은 결과가 나온다.
 */
const LOADABLE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#10B981"/><circle cx="48" cy="36" r="16" fill="#F2F4F7"/><ellipse cx="48" cy="84" rx="28" ry="22" fill="#F2F4F7"/></svg>`,
  );

/** 절대 로드되지 않는다 — data URI 라 네트워크도 타지 않고 즉시 error 로 떨어진다. */
const BROKEN = 'data:image/png;base64,!!!not-an-image!!!';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    alt: '홍길동',
    children: '길동',
  },
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    shape: { control: 'inline-radio', options: ['circle', 'rounded'] },
    children: { control: 'text' },
    className: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

const rowStyle = { display: 'flex', gap: '16px', alignItems: 'center' } as const;
const stackStyle = { display: 'grid', gap: '12px', justifyItems: 'start' } as const;

export const Default: Story = {
  args: { src: LOADABLE },
};

/** `src` 가 없으면 이니셜이 그려진다. `alt` 가 이름이 되고 시각 글자는 트리에서 감춰진다. */
export const Fallback: Story = {
  args: { src: undefined },
};

/**
 * 이미지가 실패하면 fallback 으로 넘어간다.
 *
 * `src` 를 주었는데도 이니셜이 보이는 것이 이 스토리의 계약이다 — 깨진 이미지 아이콘이
 * 남지 않아야 한다.
 */
export const ImageError: Story = {
  args: { src: BROKEN },
};

/** 이름 없는 장식 Avatar. `alt=""` 라 접근성 트리에 아무것도 남기지 않는다. */
export const Decorative: Story = {
  args: { src: LOADABLE, alt: '' },
};

export const Sizes: Story = {
  args: { src: LOADABLE },
  render: (args) => (
    <div style={rowStyle}>
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
    </div>
  ),
};

export const Shapes: Story = {
  args: { src: LOADABLE },
  render: (args) => (
    <div style={rowStyle}>
      <Avatar {...args} shape="circle" size="lg" />
      <Avatar {...args} shape="rounded" size="lg" />
    </div>
  ),
};

/**
 * 이니셜 Avatar 의 면·글자는 테마를 따라 움직인다 (`background.grey` / `text.default`).
 * 사진 Avatar 는 테마와 무관하므로 여기서는 fallback 만 본다.
 */
export const AllThemes: Story = {
  args: { src: undefined },
  parameters: themeGalleryParameters,
  render: (args) => (
    <ThemeGallery>
      {() => (
        <div style={rowStyle}>
          <Avatar {...args} size="sm" />
          <Avatar {...args} size="md" />
          <Avatar {...args} size="lg" />
          <Avatar {...args} size="lg" shape="rounded" />
        </div>
      )}
    </ThemeGallery>
  ),
};

/**
 * 경계 조건.
 *
 * 상자는 고정이고 넘치는 이니셜만 잘린다 — 긴 글자가 원을 밀어내 레이아웃을 흔들지 않는다.
 * fallback 이 아예 없으면 빈 면이 자리만 지킨다.
 */
export const EdgeCases: Story = {
  args: { src: undefined },
  render: ({ children: _children, ...args }) => (
    <div style={stackStyle}>
      <div style={rowStyle}>
        <Avatar {...args} size="sm">
          홍
        </Avatar>
        <Avatar {...args} size="md">
          길동
        </Avatar>
        <Avatar {...args} size="lg">
          홍길동입니다
        </Avatar>
      </div>
      {/* fallback 없음 — 빈 면이 자리만 지킨다 */}
      <div style={rowStyle}>
        <Avatar {...args} size="sm" />
        <Avatar {...args} size="md" />
        <Avatar {...args} size="lg" />
      </div>
    </div>
  ),
};
