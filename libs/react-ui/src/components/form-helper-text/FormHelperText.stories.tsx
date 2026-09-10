import type { Meta, StoryObj } from '@storybook/react-vite';

import { BoxedInput } from '../boxed-input';
import { InputLabel } from '../input-label';

import { FormHelperText } from './FormHelperText';

const meta = {
  title: 'Components/FormHelperText',
  component: FormHelperText,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Helper text',
    size: 'md',
    disabled: false,
    error: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    children: { control: 'text' },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof FormHelperText>;

export default meta;

type Story = StoryObj<typeof meta>;

const columnStyle = {
  display: 'grid',
  gap: '8px',
  minWidth: '320px',
};

export const Playground: Story = {
  render: (args) => <FormHelperText {...args} />,
};

export const Default: Story = {
  args: {
    children: 'We will never share your email with anyone.',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormHelperText size="sm">Small helper text</FormHelperText>
      <FormHelperText size="md">Medium helper text</FormHelperText>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    children: 'This field is currently disabled.',
    disabled: true,
  },
};

export const Error: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormHelperText error>Please enter a valid email address.</FormHelperText>
      <FormHelperText error>Password must be at least 8 characters.</FormHelperText>
      <FormHelperText error size="sm">
        This field is required.
      </FormHelperText>
    </div>
  ),
};

export const DisabledWithError: Story = {
  args: {
    children: 'Field is disabled and has an error.',
    disabled: true,
    error: true,
  },
};

export const Empty: Story = {
  render: () => (
    <div style={columnStyle}>
      <p style={{ fontSize: '12px', color: 'var(--ds-text-light)', margin: 0 }}>
        Space character renders a zero-width space (preserves layout height):
      </p>
      <FormHelperText> </FormHelperText>
      <p style={{ fontSize: '12px', color: 'var(--ds-text-light)', margin: 0 }}>
        Normal helper text for comparison:
      </p>
      <FormHelperText>Normal helper text</FormHelperText>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormHelperText>
        Your password must be at least 8 characters long and include one uppercase letter, one
        number, and one special character.
      </FormHelperText>
      <FormHelperText error>
        The email address you entered is already associated with an existing account. Please sign in
        or use a different email address.
      </FormHelperText>
    </div>
  ),
};

/**
 * 헬퍼가 입력의 **설명**이 되는 방법은 하나다: 자기 `id` 를 Input 의 `aria-describedby` 가
 * 가리키게 하는 것. `FormHelperText` 는 그 연결을 스스로 만들지 않는다 — id 는 소비자 것이고,
 * `TextField` 를 쓰면 합성 계층이 대신 만들어 준다.
 *
 * 오류 고지(`aria-invalid`)는 Input 의 `error` 가 소유한다. 여기서 손으로 달지 않는다.
 *
 * 마지막 예시의 `role="alert"` 는 **소비자가 직접 고른 것**이다. 라이브러리는 error 헬퍼를
 * 자동으로 live region 으로 만들지 않는다 — 화면에 오류가 여럿이면 서로를 덮어쓰기 때문이다.
 * 제출 직후처럼 즉시 읽혀야 하는 자리에서만 소비자가 켠다.
 */
export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      <div>
        <InputLabel htmlFor="a11y-email">Email address</InputLabel>
        <BoxedInput
          id="a11y-email"
          type="email"
          placeholder="you@example.com"
          aria-describedby="a11y-email-helper"
        />
        <FormHelperText id="a11y-email-helper">
          Enter the email address you used to register.
        </FormHelperText>
      </div>

      <div>
        <InputLabel htmlFor="a11y-password" error>
          Password
        </InputLabel>
        <BoxedInput
          id="a11y-password"
          type="password"
          error
          aria-describedby="a11y-password-error"
        />
        <FormHelperText id="a11y-password-error" error role="alert">
          Password must be at least 8 characters.
        </FormHelperText>
      </div>
    </div>
  ),
};
