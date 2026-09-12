import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';

import { Stack } from '../stack/Stack';

import { Divider } from './Divider';

/**
 * `Divider` 는 **선 하나**를 그린다.
 *
 * 두께와 색은 토큰이 정한다 (`semanticBorder.divider`, `stroke.light`). 굵기·색 prop 이
 * 없으므로 그것들을 바꿔 보는 story 도 없다.
 *
 * **주변 여백을 갖지 않는다.** 아래 story 의 간격은 전부 `Stack` 의 `gap` 이 만든 것이다 —
 * 실제 사용도 그렇게 합성한다.
 *
 * hover·focus·pressed story 가 없다 — 그런 API 가 없다. Divider 는 비상호작용이고 포커스를
 * 받지 않는다.
 */
const meta = {
  title: 'Components/Layout/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    decorative: { control: 'boolean' },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

const textStyle: CSSProperties = {
  color: 'var(--ds-text-default)',
  fontSize: 'var(--ds-body-small-font-size)',
  lineHeight: 'var(--ds-body-small-line-height)',
  margin: 0,
};

const Paragraph = ({ children }: { children: ReactNode }) => <p style={textStyle}>{children}</p>;

/** 기본은 가로선이고 시맨틱이다 — `<hr>` 의 native separator 역할이 그대로 남는다. */
export const Default: Story = {
  args: {},
  render: (args) => (
    <Stack gap="lg">
      <Paragraph>위쪽 문단입니다.</Paragraph>
      <Divider {...args} />
      <Paragraph>아래쪽 문단입니다.</Paragraph>
    </Stack>
  ),
};

/**
 * 세로선은 가로 `Stack` 안에서 형제 높이만큼 늘어난다.
 *
 * 높이를 주지 않는다 — `align-self: stretch` 가 형제를 따라간다. `aria-orientation="vertical"`
 * 은 이때만 붙는다 (separator 의 기본 방향이 horizontal 이라 가로에는 적지 않는다).
 */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <Stack direction="row" gap="lg" align="center">
      <Paragraph>왼쪽</Paragraph>
      <Divider {...args} />
      <Paragraph>가운데</Paragraph>
      <Divider {...args} />
      <Paragraph>오른쪽</Paragraph>
    </Stack>
  ),
};

/**
 * 순수 장식이면 `decorative` 로 native separator 시맨틱을 끈다.
 *
 * 접근성 트리에 구분자를 하나 더 만들 이유가 없을 때 — 카드 테두리·행 경계 같은 크롬 — 에
 * 쓴다. 시각은 기본과 **똑같다**: 바뀌는 것은 보조 기술에 보이는 구조뿐이다.
 */
export const Decorative: Story = {
  args: { decorative: true },
  render: (args) => (
    <Stack gap="lg">
      <Paragraph>이 선은 시각 장식이라 스크린리더가 구분자로 읽지 않습니다.</Paragraph>
      <Divider {...args} />
      <Paragraph>같은 그룹에 이어지는 내용입니다.</Paragraph>
    </Stack>
  ),
};

/**
 * 목록 항목 사이에 끼워 넣는 실제 모양.
 *
 * 간격은 Divider 가 아니라 `Stack` 의 `gap` 이 만든다. 그래서 소비자가 한 곳에서만 조절한다.
 */
export const BetweenItems: Story = {
  args: {},
  render: (args) => (
    <Stack gap="md">
      <Paragraph>첫 번째 항목</Paragraph>
      <Divider {...args} />
      <Paragraph>두 번째 항목</Paragraph>
      <Divider {...args} />
      <Paragraph>세 번째 항목</Paragraph>
    </Stack>
  ),
};
