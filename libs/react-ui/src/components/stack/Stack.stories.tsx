import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';

import { Box } from '../box/Box';

import { Stack } from './Stack';

/**
 * `Stack` 은 **1차원 레이아웃 primitive** 다 — 자식을 한 축으로 흘리는 것이 전부다.
 *
 * 스타일시트가 없고 색·여백·모서리 prop 도 없다. 그래서 테마 갤러리 story 가 없다 — 테마마다
 * 달라지는 것이 Stack 에는 하나도 없어서 비교할 것이 없다. 아래 story 의 색은 전부 자식(데모용
 * 상자)이 가진 것이고, 면이 필요하면 `Box` 와 겹쳐 쓴다 (`WithBox`).
 *
 * hover·selected·focus story 도 없다 — 그런 API 가 없다. Stack 은 비상호작용이다.
 */
const meta = {
  title: 'Components/Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    direction: { control: 'inline-radio', options: ['column', 'row'] },
    gap: { control: 'text' },
    align: { control: 'inline-radio', options: ['start', 'center', 'end', 'stretch'] },
    justify: { control: 'inline-radio', options: ['start', 'center', 'end', 'between'] },
    wrap: { control: 'boolean' },
    children: { control: false },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 데모용 자식. Stack 자체에는 장식 API 가 없으므로 시각은 전부 여기에 있다. */
const itemStyle: CSSProperties = {
  padding: 'var(--ds-spacing-sm) var(--ds-spacing-md)',
  borderRadius: 'var(--ds-radius-sm)',
  background: 'var(--ds-background-surface)',
  border: '1px solid var(--ds-stroke-light)',
  color: 'var(--ds-text-default)',
  fontSize: 'var(--ds-body-small-font-size)',
};

const Item = ({ children }: { children: ReactNode }) => <div style={itemStyle}>{children}</div>;

/** 폭을 묶어 줄바꿈·넘침을 눈으로 확인할 수 있게 하는 틀. */
const frameStyle: CSSProperties = {
  maxWidth: '320px',
  padding: 'var(--ds-spacing-md)',
  border: '1px dashed var(--ds-stroke-default)',
  borderRadius: 'var(--ds-radius-md)',
};

const labelStyle: CSSProperties = {
  fontSize: 'var(--ds-body-small-strong-font-size)',
  color: 'var(--ds-text-light)',
};

/** 기본값은 세로 쌓기다. `gap` 을 주지 않으면 간격 선언도 만들지 않는다. */
export const Default: Story = {
  args: {
    gap: 'md',
    children: (
      <>
        <Item>첫째</Item>
        <Item>둘째</Item>
        <Item>셋째</Item>
      </>
    ),
  },
};

/**
 * 축은 두 가지뿐이다.
 *
 * `column` 이 기본값인 것은 계약이 정한 것이다 — CSS 기본값(`row`)이 아니라 RN 기본값과 맞춰
 * 두 렌더러가 같게 동작하게 한다.
 */
export const Direction: Story = {
  args: { children: null },
  render: () => (
    <Stack gap="xl">
      <Stack gap="xs">
        <span style={labelStyle}>direction=&quot;column&quot; (기본값)</span>
        <Stack gap="sm">
          <Item>첫째</Item>
          <Item>둘째</Item>
          <Item>셋째</Item>
        </Stack>
      </Stack>

      <Stack gap="xs">
        <span style={labelStyle}>direction=&quot;row&quot;</span>
        <Stack direction="row" gap="sm">
          <Item>첫째</Item>
          <Item>둘째</Item>
          <Item>셋째</Item>
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * `gap` 은 spacing 토큰 이름 또는 원시 숫자를 받는다 — `Box` 와 같은 값 도메인이다.
 *
 * `0` 은 "미지정" 이 아니라 "간격 없음" 이다.
 */
export const Gap: Story = {
  args: { children: null },
  render: () => (
    <Stack gap="xl">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((token) => (
        <Stack key={token} gap="xs">
          <span style={labelStyle}>gap=&quot;{token}&quot;</span>
          <Stack direction="row" gap={token}>
            <Item>A</Item>
            <Item>B</Item>
            <Item>C</Item>
          </Stack>
        </Stack>
      ))}

      <Stack gap="xs">
        <span style={labelStyle}>gap={'{24}'} (원시 px)</span>
        <Stack direction="row" gap={24}>
          <Item>A</Item>
          <Item>B</Item>
          <Item>C</Item>
        </Stack>
      </Stack>

      <Stack gap="xs">
        <span style={labelStyle}>gap={'{0}'} (간격 없음)</span>
        <Stack direction="row" gap={0}>
          <Item>A</Item>
          <Item>B</Item>
          <Item>C</Item>
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * `align` 은 교차 축, `justify` 는 주축이다.
 *
 * 계약 어휘는 정규화된 이름(`start`·`end`·`between`)이고 CSS 어휘(`flex-start`·`flex-end`·
 * `space-between`)로 푸는 것은 렌더러 몫이다.
 */
export const Alignment: Story = {
  args: { children: null },
  render: () => (
    <Stack gap="xl">
      <Stack gap="xs">
        <span style={labelStyle}>align (교차 축) — 높이가 다른 자식으로 확인한다</span>
        <Stack direction="row" gap="md">
          {(['start', 'center', 'end', 'stretch'] as const).map((align) => (
            <Stack key={align} gap="2xs">
              <span style={labelStyle}>{align}</span>
              <Stack
                direction="row"
                gap="xs"
                align={align}
                style={{ height: '96px', border: '1px dashed var(--ds-stroke-default)' }}
              >
                <Item>짧음</Item>
                <Item>
                  두 줄이
                  <br />
                  되는 항목
                </Item>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Stack gap="xs">
        <span style={labelStyle}>justify (주축) — 남는 공간 분배</span>
        {(['start', 'center', 'end', 'between'] as const).map((justify) => (
          <Stack key={justify} gap="2xs">
            <span style={labelStyle}>{justify}</span>
            <Stack
              direction="row"
              gap="xs"
              justify={justify}
              style={{ border: '1px dashed var(--ds-stroke-default)' }}
            >
              <Item>A</Item>
              <Item>B</Item>
              <Item>C</Item>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Stack>
  ),
};

/**
 * `wrap` 은 boolean 이다. 폭이 묶인 틀 안에서 줄바꿈을 확인한다 — 반응형 prop 대신 제약된
 * 컨테이너로 스트레스를 보여 준다 (브레이크포인트 API 는 만들지 않는다).
 *
 * `wrap={false}` 는 미지정과 다르다. 명시하면 `nowrap` 선언을 만든다.
 */
export const Wrapping: Story = {
  args: { children: null },
  render: () => (
    <Stack gap="xl">
      <Stack gap="xs">
        <span style={labelStyle}>wrap (320px 틀)</span>
        <div style={frameStyle}>
          <Stack direction="row" gap="sm" wrap>
            {['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종'].map((city) => (
              <Item key={city}>{city}</Item>
            ))}
          </Stack>
        </div>
      </Stack>

      <Stack gap="xs">
        <span style={labelStyle}>wrap={'{false}'} — 한 줄에 밀어 넣는다</span>
        <div style={frameStyle}>
          <Stack direction="row" gap="sm" wrap={false}>
            {['서울', '부산', '대구', '인천', '광주', '대전'].map((city) => (
              <Item key={city}>{city}</Item>
            ))}
          </Stack>
        </div>
      </Stack>
    </Stack>
  ),
};

/** Stack 은 중첩해서 축을 바꾼다 — 그것이 1차원 primitive 로 2차원 화면을 짜는 방법이다. */
export const Nested: Story = {
  args: { children: null },
  render: () => (
    <Stack gap="md">
      <Stack direction="row" gap="md" justify="between" align="center">
        <span style={labelStyle}>헤더 행</span>
        <Stack direction="row" gap="xs">
          <Item>취소</Item>
          <Item>저장</Item>
        </Stack>
      </Stack>

      <Stack direction="row" gap="md" align="start">
        <Stack gap="xs">
          <Item>사이드 1</Item>
          <Item>사이드 2</Item>
        </Stack>
        <Stack gap="sm">
          <Item>본문 첫째 줄</Item>
          <Item>본문 둘째 줄</Item>
          <Item>본문 셋째 줄</Item>
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * 긴 내용이 틀을 넘칠 때.
 *
 * Stack 은 `min-width` 를 손대지 않는다 — flex 항목의 기본 `min-width: auto` 가 그대로라
 * 가로 축에서 긴 문자열은 줄지 않고 밀어낸다. 그것을 줄이고 싶으면 **자식이** 정한다
 * (`minWidth: 0` + `overflow`). 컨테이너가 자식의 축소 정책을 대신 정하지 않는다.
 */
export const LongContent: Story = {
  args: { children: null },
  render: () => (
    <Stack gap="xl">
      <Stack gap="xs">
        <span style={labelStyle}>자식이 줄어들지 않는 경우 (기본값)</span>
        <div style={{ ...frameStyle, overflowX: 'auto' }}>
          <Stack direction="row" gap="sm">
            <Item>레이블</Item>
            <Item>아주 긴 값이 들어와서 틀을 넘어가는 경우를 보여 줍니다</Item>
          </Stack>
        </div>
      </Stack>

      <Stack gap="xs">
        <span style={labelStyle}>자식이 축소 정책을 가진 경우</span>
        <div style={frameStyle}>
          <Stack direction="row" gap="sm">
            <Item>레이블</Item>
            <div
              style={{ ...itemStyle, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              아주 긴 값이 들어와서 틀을 넘어가는 경우를 보여 줍니다
            </div>
          </Stack>
        </div>
      </Stack>

      <Stack gap="xs">
        <span style={labelStyle}>세로 축에서는 길이가 문제가 되지 않는다</span>
        <div style={frameStyle}>
          <Stack gap="sm">
            <Item>아주 긴 값이 들어와도 세로 축에서는 자연스럽게 줄바꿈됩니다</Item>
            <Item>둘째</Item>
          </Stack>
        </div>
      </Stack>
    </Stack>
  ),
};

/**
 * 면·여백은 `Box` 가 가진다.
 *
 * Stack 에 `p`·`bg`·`radius` 를 두지 않는 이유다 — 두 primitive 를 겹쳐 쓰면 각자의 책임이
 * 그대로 남는다.
 */
export const WithBox: Story = {
  args: { children: null },
  render: () => (
    <Box p="lg" bg="background.surface" radius="md">
      <Stack gap="sm">
        <Item>Box 가 면과 여백을 가진다</Item>
        <Item>Stack 은 축과 간격만 가진다</Item>
      </Stack>
    </Box>
  ),
};
