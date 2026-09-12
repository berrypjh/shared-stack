import { themes } from '@berrypjh/ui-core';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeProvider } from '../../theme';
import { BoxedInput } from '../boxed-input';
import { FilledInput } from '../filled-input';
import { FormHelperText } from '../form-helper-text';
import { InputLabel } from '../input-label';
import { PlainInput } from '../plain-input';

import { FormControl } from './FormControl';

const meta = {
  title: 'Components/Form/FormControl',
  component: FormControl,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    variant: 'boxed',
    size: 'md',
    color: 'primary',
    margin: 'none',
    disabled: false,
    error: false,
    required: false,
    fullWidth: false,
    hiddenLabel: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['plain', 'filled', 'boxed'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    margin: {
      control: 'select',
      options: ['none', 'dense', 'normal'],
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    required: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    hiddenLabel: { control: 'boolean' },
    focused: { control: 'boolean' },
    children: { control: false },
    component: { control: false },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof FormControl>;

export default meta;

type Story = StoryObj<typeof meta>;

const columnStyle = {
  display: 'grid',
  gap: '24px',
  minWidth: '320px',
};

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '24px',
  alignItems: 'flex-start',
};

export const Playground: Story = {
  render: (args) => (
    <FormControl {...args}>
      <InputLabel htmlFor="playground-input">Label</InputLabel>
      <FilledInput id="playground-input" placeholder="Enter value" />
      <FormHelperText>Helper text</FormHelperText>
    </FormControl>
  ),
};

export const Default: Story = {
  render: () => (
    <FormControl>
      <InputLabel htmlFor="default-input">Email address</InputLabel>
      <FilledInput id="default-input" type="email" placeholder="you@example.com" />
      <FormHelperText>We will never share your email.</FormHelperText>
    </FormControl>
  ),
};

/**
 * `variant` 는 chrome 을 **컴포넌트 정체성**으로 고른다 — FormControl 의 `variant` 가 자식
 * Input 의 외형을 바꾸지 않는다. 그래서 각 열에 실제로 그 variant 의 Input 을 세운다.
 * (`TextField` 는 이 매핑을 대신 해 준다.)
 */
export const AllVariants: Story = {
  render: () => (
    <div style={rowStyle}>
      <FormControl variant="plain">
        <InputLabel htmlFor="plain-input">Plain</InputLabel>
        <PlainInput id="plain-input" placeholder="Placeholder" />
        <FormHelperText>Helper text</FormHelperText>
      </FormControl>
      <FormControl variant="filled">
        <InputLabel htmlFor="filled-input">Filled</InputLabel>
        <FilledInput id="filled-input" placeholder="Placeholder" />
        <FormHelperText>Helper text</FormHelperText>
      </FormControl>
      <FormControl variant="boxed">
        <InputLabel htmlFor="boxed-input">Boxed</InputLabel>
        <BoxedInput id="boxed-input" placeholder="Placeholder" />
        <FormHelperText>Helper text</FormHelperText>
      </FormControl>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormControl size="sm">
        <InputLabel htmlFor="size-sm-input">Small (sm)</InputLabel>
        <FilledInput id="size-sm-input" placeholder="Small input" />
        <FormHelperText>Small helper text</FormHelperText>
      </FormControl>
      <FormControl size="md">
        <InputLabel htmlFor="size-md-input">Medium (md)</InputLabel>
        <FilledInput id="size-md-input" placeholder="Medium input" />
        <FormHelperText>Medium helper text</FormHelperText>
      </FormControl>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormControl color="primary">
        <InputLabel htmlFor="color-primary-input">Primary</InputLabel>
        <FilledInput id="color-primary-input" placeholder="Primary color" />
        <FormHelperText>Primary helper text</FormHelperText>
      </FormControl>
      <FormControl color="secondary">
        <InputLabel htmlFor="color-secondary-input">Secondary</InputLabel>
        <FilledInput id="color-secondary-input" placeholder="Secondary color" />
        <FormHelperText>Secondary helper text</FormHelperText>
      </FormControl>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <FormControl disabled>
      <InputLabel htmlFor="disabled-input">Username</InputLabel>
      <FilledInput id="disabled-input" value="john.doe" />
      <FormHelperText>This field cannot be edited.</FormHelperText>
    </FormControl>
  ),
};

export const Error: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormControl error>
        <InputLabel htmlFor="error-input">Email address</InputLabel>
        <FilledInput id="error-input" value="not-a-valid-email" />
        <FormHelperText>Please enter a valid email address.</FormHelperText>
      </FormControl>
      <FormControl error>
        <InputLabel htmlFor="error-empty-input">Password</InputLabel>
        <FilledInput id="error-empty-input" type="password" placeholder="Required" />
        <FormHelperText>Password is required.</FormHelperText>
      </FormControl>
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormControl required>
        <InputLabel htmlFor="required-input">Full name</InputLabel>
        <FilledInput id="required-input" placeholder="Jane Smith" />
        <FormHelperText>Required field</FormHelperText>
      </FormControl>
      <FormControl required error>
        <InputLabel htmlFor="required-error-input">Email address</InputLabel>
        <FilledInput id="required-error-input" placeholder="you@example.com" />
        <FormHelperText>This field is required.</FormHelperText>
      </FormControl>
    </div>
  ),
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'grid', gap: '16px', width: '480px' }}>
      <FormControl fullWidth>
        <InputLabel htmlFor="fullwidth-input">Full name</InputLabel>
        <FilledInput id="fullwidth-input" placeholder="Jane Smith" />
      </FormControl>
      <FormControl fullWidth>
        <InputLabel htmlFor="fullwidth-email-input">Email address</InputLabel>
        <FilledInput id="fullwidth-email-input" type="email" placeholder="you@example.com" />
        <FormHelperText>We will never share your email.</FormHelperText>
      </FormControl>
    </div>
  ),
};

export const HiddenLabel: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormControl hiddenLabel>
        <InputLabel htmlFor="hidden-label-input">Visually hidden label</InputLabel>
        <FilledInput id="hidden-label-input" placeholder="Search..." />
      </FormControl>
    </div>
  ),
};

export const WithMargin: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        minWidth: '320px',
        border: '1px dashed var(--ds-stroke-light)',
        padding: '8px',
      }}
    >
      <FormControl margin="none">
        <InputLabel htmlFor="margin-none-input">No margin</InputLabel>
        <FilledInput id="margin-none-input" placeholder="margin: none" />
      </FormControl>
      <FormControl margin="dense">
        <InputLabel htmlFor="margin-dense-input">Dense margin</InputLabel>
        <FilledInput id="margin-dense-input" placeholder="margin: dense" />
      </FormControl>
      <FormControl margin="normal">
        <InputLabel htmlFor="margin-normal-input">Normal margin</InputLabel>
        <FilledInput id="margin-normal-input" placeholder="margin: normal" />
      </FormControl>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormControl>
        <InputLabel htmlFor="long-label-input">
          Billing address line 1 (street, building number)
        </InputLabel>
        <FilledInput
          id="long-label-input"
          value="123 Long Street Name, Apartment 4B, Building Complex Name"
        />
        <FormHelperText>
          Enter the full street address including apartment or suite number if applicable.
        </FormHelperText>
      </FormControl>
    </div>
  ),
};

/**
 * 라벨·설명·오류가 각각 **누구 소유인지** 보여준다.
 *
 * - 이름: `InputLabel htmlFor` ↔ Input `id`
 * - 설명: `FormHelperText id` ↔ Input `aria-describedby`
 * - 오류 고지: `FormControl error` → InputBase 가 native 요소에 `aria-invalid` 를 단다.
 *   스토리에서 손으로 다시 달지 않는다 — 소유자가 둘로 보이면 계약이 흐려진다.
 * - 필수: `FormControl required` → native `required`(암묵 `aria-required`).
 *   라벨의 `*` 는 `aria-hidden` 이라 이름을 오염시키지 않는 **시각 표시**다.
 *
 * 오류는 색만으로 전달되지 않는다 — 읽을 수 있는 문구가 설명으로 붙는다 (WCAG 1.4.1).
 */
export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormControl required>
        <InputLabel htmlFor="a11y-name">Full name</InputLabel>
        <FilledInput id="a11y-name" aria-describedby="a11y-name-helper" placeholder="Jane Smith" />
        <FormHelperText id="a11y-name-helper">Enter your legal full name.</FormHelperText>
      </FormControl>

      <FormControl error>
        <InputLabel htmlFor="a11y-email">Email address</InputLabel>
        <FilledInput
          id="a11y-email"
          type="email"
          value="bad-input"
          aria-describedby="a11y-email-error"
        />
        <FormHelperText id="a11y-email-error">Please enter a valid email address.</FormHelperText>
      </FormControl>

      <FormControl disabled>
        <InputLabel htmlFor="a11y-disabled">Account ID</InputLabel>
        <FilledInput id="a11y-disabled" value="USR-00142" aria-describedby="a11y-disabled-helper" />
        {/* disabled 는 read-only 가 아니다 — 편집 불가 **이면서** 비활성 고지까지 한다. */}
        <FormHelperText id="a11y-disabled-helper">
          This field is disabled while your account is under review.
        </FormHelperText>
      </FormControl>
    </div>
  ),
};

/**
 * 소비자가 `aria-invalid` 를 직접 정하는 경우.
 *
 * 명시값이 `error` 에서 파생된 값을 이긴다 — 서버 검증이 끝나기 전처럼, 시각적으로는 오류를
 * 보여주되 아직 고지하고 싶지 않을 때 쓴다. 기본값을 바꾸는 것이 아니라 **덮는** 예시다.
 */
export const ExplicitAriaInvalidOverride: Story = {
  render: () => (
    <FormControl error>
      <InputLabel htmlFor="a11y-override">Coupon code</InputLabel>
      <FilledInput id="a11y-override" value="EXPIRED" aria-invalid={false} />
      <FormHelperText>Checking this code…</FormHelperText>
    </FormControl>
  ),
};

/**
 * **진짜 포커스**로 본 합성 상태.
 *
 * 다른 스토리는 `focused` prop 으로 시각만 흉내 낸다. 그 경로로는 소비자가 실제로 밟는 길 —
 * DOM 포커스가 루트로 버블링되어 FormControl 이 받고, 라벨·입력·헬퍼가 함께 상태를 바꾸는
 * 과정 — 이 한 번도 그려지지 않는다. 입력 variant 스토리에 `play` 포커스가 있지만 그쪽은
 * 입력 단독이라 라벨·헬퍼 협응이 빠진다.
 *
 * `play` 는 저장소의 기존 관용구를 따른다 (`BoxedInput`·`FilledInput`·`PlainInput` 스토리).
 * 비활성 필드를 나란히 둬서 `disabled > focused` 우선순위를 눈으로도 확인한다 —
 * `inputVariantStates.test.ts` 가 CSS 규칙 수준에서 지키는 것과 같은 계약이다.
 */
export const FocusedByInteraction: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormControl>
        <InputLabel htmlFor="focus-active">Focused field</InputLabel>
        <BoxedInput
          id="focus-active"
          aria-describedby="focus-active-helper"
          placeholder="Type here"
        />
        <FormHelperText id="focus-active-helper">This field has real DOM focus.</FormHelperText>
      </FormControl>

      <FormControl>
        <InputLabel htmlFor="focus-resting">Resting field</InputLabel>
        <BoxedInput
          id="focus-resting"
          aria-describedby="focus-resting-helper"
          placeholder="Type here"
        />
        <FormHelperText id="focus-resting-helper">Same tokens, no focus.</FormHelperText>
      </FormControl>

      <FormControl disabled>
        <InputLabel htmlFor="focus-disabled">Disabled field</InputLabel>
        <BoxedInput id="focus-disabled" aria-describedby="focus-disabled-helper" value="Locked" />
        <FormHelperText id="focus-disabled-helper">Cannot take focus.</FormHelperText>
      </FormControl>
    </div>
  ),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLInputElement>('#focus-active')?.focus();
  },
};

/**
 * 등록된 모든 테마에서 대표 상태를 한눈에 본다.
 *
 * 목록은 `themes` 레지스트리에서 만든다 — 테마가 늘면 이 스토리도 저절로 늘어난다.
 * variant 축은 곱하지 않는다: chrome 은 `AllVariants` 가 이미 보여주고, 여기서 보려는 것은
 * **상태별 토큰 색이 테마마다 성립하는가** 다. `contrast.test.ts` 의 "page" 표면과 같은 조건이라
 * 그 테스트가 수치로 지키는 것을 여기서 눈으로 확인할 수 있다.
 */
export const ThemeMatrix: Story = {
  parameters: {
    layout: 'padded',
    // 각 블록이 자기 테마를 켠다. 바깥 데코레이터가 한 테마로 덮으면 비교가 되지 않는다.
    disableThemeDecorator: true,
  },
  render: () => (
    <div style={{ display: 'grid', gap: '32px' }}>
      {themes.map(({ name }) => (
        <ThemeProvider
          key={name}
          mode={name}
          style={{
            display: 'grid',
            gap: '16px',
            padding: '16px',
            borderRadius: 'var(--ds-radius-md)',
            background: 'var(--ds-background-default)',
            color: 'var(--ds-text-default)',
          }}
        >
          <strong style={{ font: 'var(--ds-body-small-strong-font-size) sans-serif' }}>
            {name}
          </strong>

          <div style={rowStyle}>
            <FormControl>
              <InputLabel htmlFor={`tm-${name}-default`}>Default</InputLabel>
              <BoxedInput id={`tm-${name}-default`} placeholder="Placeholder" />
              <FormHelperText>Helper text</FormHelperText>
            </FormControl>

            <FormControl focused>
              <InputLabel htmlFor={`tm-${name}-focused`}>Focused</InputLabel>
              <BoxedInput id={`tm-${name}-focused`} placeholder="Placeholder" />
              <FormHelperText>Helper text</FormHelperText>
            </FormControl>

            <FormControl error>
              <InputLabel htmlFor={`tm-${name}-error`}>Error</InputLabel>
              <BoxedInput
                id={`tm-${name}-error`}
                aria-describedby={`tm-${name}-error-helper`}
                value="bad-input"
              />
              <FormHelperText id={`tm-${name}-error-helper`}>Enter a valid value.</FormHelperText>
            </FormControl>

            <FormControl disabled>
              <InputLabel htmlFor={`tm-${name}-disabled`}>Disabled</InputLabel>
              <BoxedInput id={`tm-${name}-disabled`} value="Locked" />
              <FormHelperText>Cannot be edited.</FormHelperText>
            </FormControl>

            <FormControl required>
              <InputLabel htmlFor={`tm-${name}-required`}>Required</InputLabel>
              <BoxedInput id={`tm-${name}-required`} placeholder="Placeholder" />
              <FormHelperText>Helper text</FormHelperText>
            </FormControl>
          </div>
        </ThemeProvider>
      ))}
    </div>
  ),
};
