import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';
import { Avatar } from '../avatar';
import { IconButton } from '../icon-button';

import { Badge } from './Badge';

/**
 * Badge 는 **overlay indicator** 다 — 앵커 위에 얹는 알림/개수/점.
 *
 * 상호작용이 없어 hover·pressed·focus 스토리가 없다. 대신 **앵커가 계속 살아 있는지**를
 * `WithInteractiveChild` 가 play 로 확인한다 — 이 컴포넌트가 조용히 깨지는 자리다.
 */
const meta = {
  title: 'Components/Data Display/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    count: 3,
    children: <Avatar alt="홍길동">길동</Avatar>,
  },
  argTypes: {
    count: { control: 'number' },
    max: { control: 'number' },
    variant: { control: 'inline-radio', options: ['count', 'dot'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    intent: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'error', 'neutral'],
    },
    placement: {
      control: 'inline-radio',
      options: ['top-end', 'top-start', 'bottom-end', 'bottom-start'],
    },
    invisible: { control: 'boolean' },
    label: { control: 'text' },
    content: { control: false },
    children: { control: false },
    className: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

const rowStyle = { display: 'flex', gap: '32px', alignItems: 'center' } as const;
const stackStyle = { display: 'grid', gap: '24px', justifyItems: 'start' } as const;

export const Count: Story = {};

export const Dot: Story = {
  args: { variant: 'dot', label: '읽지 않은 알림 있음' },
};

/**
 * 화면은 축약(`99+`), 낭독은 `label` 의 실제 수.
 *
 * "구십구 플러스" 는 정보가 아니라서 둘을 일부러 갈라 둔다.
 */
export const Max: Story = {
  args: { count: 137, max: 99, label: '읽지 않은 알림 137개' },
};

export const Invisible: Story = {
  args: { invisible: true },
};

export const Placements: Story = {
  render: (args) => (
    <div style={rowStyle}>
      <Badge {...args} placement="top-end" />
      <Badge {...args} placement="top-start" />
      <Badge {...args} placement="bottom-end" />
      <Badge {...args} placement="bottom-start" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={stackStyle}>
      <div style={rowStyle}>
        <Badge {...args} size="sm" />
        <Badge {...args} size="md" />
      </div>
      <div style={rowStyle}>
        <Badge {...args} variant="dot" size="sm" label="읽지 않음" />
        <Badge {...args} variant="dot" size="md" label="읽지 않음" />
      </div>
    </div>
  ),
};

/**
 * `warning`·`success` 가 없는 것은 의도다 — 7개 테마 실측에서 그 면 위의 `text.contrastText`
 * 가 ember 에서 4.35·4.34 로 WCAG AA(4.5)에 미달한다. 어휘에서 빼는 편이 기준을 낮추는 것보다 낫다.
 */
export const Intents: Story = {
  render: (args) => (
    <div style={rowStyle}>
      <Badge {...args} intent="primary" />
      <Badge {...args} intent="secondary" />
      <Badge {...args} intent="error" />
      <Badge {...args} intent="neutral" />
    </div>
  ),
};

/**
 * **회귀 방지 스토리.** 배지가 앵커를 감싸도 앵커는 계속 버튼이고, 이름도 클릭도 그대로다.
 *
 * 표시자가 `pointer-events: none` 을 잃으면 이 play 가 깨진다 — Storybook 은 실제 브라우저라
 * jsdom 이 못 보는 그 회귀를 여기서 잡는다.
 */
export const WithInteractiveChild: Story = {
  args: {
    count: 5,
    label: '읽지 않은 알림 5개',
    children: <IconButton aria-label="알림">🔔</IconButton>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: '알림' });

    // 래퍼가 role·이름을 바꾸지 않았다.
    await expect(button).toBeInTheDocument();

    // 배지가 포커스를 가로채지 않는다.
    await userEvent.tab();
    await expect(button).toHaveFocus();

    // 배지가 클릭을 삼키지 않는다.
    await userEvent.click(button);
    await expect(button).toHaveFocus();

    // 배지 이름은 앵커 이름과 별도로 남는다.
    await expect(canvas.getByRole('img', { name: '읽지 않은 알림 5개' })).toBeInTheDocument();
  },
};

export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: (args) => (
    <ThemeGallery>
      {() => (
        <div style={rowStyle}>
          <Badge {...args} intent="error" />
          <Badge {...args} intent="primary" />
          <Badge {...args} intent="secondary" />
          <Badge {...args} intent="neutral" />
          <Badge {...args} variant="dot" intent="error" label="읽지 않음" />
        </div>
      )}
    </ThemeGallery>
  ),
};

/**
 * forced-colors(Windows 고대비) 검토용.
 *
 * 그 모드에서 배지 면과 링은 시스템 색으로 평탄화된다. `badge.scss` 가 `CanvasText` 테두리를
 * 켜므로 dot 이 사라지지 않고 count 도 경계를 유지해야 한다. 스크린샷으로는 강제 모드를 켤 수
 * 없어 **검토 대상을 한 화면에 모아 두는** 것이 이 스토리의 역할이다
 * (규칙 자체는 `forcedColors.test.ts` 가 검사한다).
 */
export const ForcedColors: Story = {
  render: (args) => (
    <div style={stackStyle}>
      <div style={rowStyle}>
        <Badge {...args} intent="error" />
        <Badge {...args} intent="neutral" />
        <Badge {...args} variant="dot" intent="error" label="읽지 않음" />
        <Badge {...args} variant="dot" size="sm" intent="primary" label="읽지 않음" />
      </div>
      <div style={rowStyle}>
        <Badge {...args} count={137} label="읽지 않은 알림 137개">
          <IconButton aria-label="알림">🔔</IconButton>
        </Badge>
      </div>
    </div>
  ),
};

/**
 * 경계 조건.
 *
 * `count={0}` 은 유효한 값이라 렌더된다 (미지정과 다르다). `content` 는 `max` 를 받지 않는다 —
 * 축약은 숫자 규칙이다. 앵커가 없으면 배지만 남는다.
 */
export const EdgeCases: Story = {
  render: ({ children: _children, ...args }) => (
    <div style={rowStyle}>
      <Badge {...args} count={0}>
        <Avatar alt="홍길동">길동</Avatar>
      </Badge>
      <Badge {...args} content="NEW" max={9}>
        <Avatar alt="김철수">철수</Avatar>
      </Badge>
      <Badge {...args} count={1000} max={999}>
        <Avatar alt="이영희">영희</Avatar>
      </Badge>
      <Badge {...args} count={7} />
    </div>
  ),
};
