import type { Meta, StoryObj } from '@storybook/react-vite';

import { BoxedInput } from '../boxed-input';
import { FormHelperText } from '../form-helper-text';

import { InputLabel } from './InputLabel';

const meta = {
  title: 'Components/InputLabel',
  component: InputLabel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Email address',
    size: 'md',
    color: 'primary',
    disabled: false,
    error: false,
    focused: false,
    required: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    focused: { control: 'boolean' },
    required: { control: 'boolean' },
    children: { control: 'text' },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof InputLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

const columnStyle = {
  display: 'grid',
  gap: '12px',
  minWidth: '280px',
};

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '24px',
  alignItems: 'center',
};

export const Playground: Story = {
  render: (args) => <InputLabel {...args} />,
};

export const Default: Story = {
  args: {
    children: 'Email address',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputLabel size="sm">Small label</InputLabel>
      <InputLabel size="md">Medium label</InputLabel>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={rowStyle}>
      <InputLabel color="primary">Primary</InputLabel>
      <InputLabel color="secondary">Secondary</InputLabel>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    children: 'Username',
    disabled: true,
  },
};

export const Error: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputLabel error>Email address</InputLabel>
      <InputLabel error size="sm">
        Password
      </InputLabel>
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputLabel required>Full name</InputLabel>
      <InputLabel required size="sm">
        Email address
      </InputLabel>
      <InputLabel required color="secondary">
        Phone number
      </InputLabel>
    </div>
  ),
};

export const Focused: Story = {
  render: () => (
    <div style={rowStyle}>
      <InputLabel focused color="primary">
        Primary focused
      </InputLabel>
      <InputLabel focused color="secondary">
        Secondary focused
      </InputLabel>
    </div>
  ),
};

export const DisabledWithError: Story = {
  args: {
    children: 'Account ID',
    disabled: true,
    error: true,
  },
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputLabel>Billing address line 1 (street and building number)</InputLabel>
      <InputLabel required>
        Emergency contact full name and relationship to account holder
      </InputLabel>
      <InputLabel error>
        Primary email address for account notifications and security alerts
      </InputLabel>
    </div>
  ),
};

/**
 * `InputLabel` 이 혼자 책임지는 것은 **`htmlFor` 연결과 시각 표시** 뿐이다.
 *
 * 나머지는 각자의 소유자가 있다 — native `required` 와 `aria-invalid` 는 Input 이,
 * 설명은 `FormHelperText` 의 `id` ↔ Input `aria-describedby` 가 만든다. 그래서 이 스토리는
 * raw `<input>`/`<p>` 대신 라이브러리 컴포넌트로 세운다: 소유자가 드러나야 계약이 읽힌다.
 *
 * 여기서는 `FormControl` 없이 상태를 직접 준다 — 상속 경로는 FormControl 스토리의 몫이다.
 */
export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      {/* 이름: htmlFor ↔ id */}
      <div>
        <InputLabel htmlFor="a11y-email">Email address</InputLabel>
        <BoxedInput id="a11y-email" type="email" placeholder="you@example.com" />
      </div>

      {/* 필수: 라벨의 `*` 는 aria-hidden 시각 표시이고, 고지는 Input 의 native required 가 한다 */}
      <div>
        <InputLabel htmlFor="a11y-name" required>
          Full name
        </InputLabel>
        <BoxedInput id="a11y-name" required placeholder="Jane Smith" />
      </div>

      {/* 오류: 색이 아니라 문구가 이유를 말한다. aria-invalid 는 Input 의 `error` 가 만든다 */}
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
        <FormHelperText id="a11y-password-error" error>
          Password must be at least 8 characters.
        </FormHelperText>
      </div>
    </div>
  ),
};
