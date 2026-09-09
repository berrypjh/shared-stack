import type { Meta, StoryObj } from '@storybook/react-vite';

import { BoxedInput } from './BoxedInput';

const meta = {
  title: 'Components/BoxedInput',
  component: BoxedInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Placeholder',
    size: 'md',
    color: 'primary',
    disabled: false,
    error: false,
    fullWidth: false,
    readOnly: false,
    multiline: false,
    'aria-label': 'Input',
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
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'tel', 'url'],
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    multiline: { control: 'boolean' },
    required: { control: 'boolean' },
    rows: { control: 'number' },
    placeholder: { control: 'text' },
    startAdornment: { control: false },
    endAdornment: { control: false },
    inputProps: { control: false },
    textareaProps: { control: false },
    inputRef: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof BoxedInput>;

export default meta;

type Story = StoryObj<typeof meta>;

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '320px',
};

export const Playground: Story = {
  render: (args) => <BoxedInput {...args} />,
};

export const Default: Story = {
  args: {
    placeholder: 'Enter text',
    'aria-label': 'Text',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={columnStyle}>
      <BoxedInput size="sm" placeholder="Small" aria-label="Small input" />
      <BoxedInput size="md" placeholder="Medium" aria-label="Medium input" />
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <BoxedInput color="primary" placeholder="Primary" aria-label="Primary color input" />
      <BoxedInput color="secondary" placeholder="Secondary" aria-label="Secondary color input" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'Disabled value',
    placeholder: 'Disabled',
    'aria-label': 'Disabled input',
  },
};

export const Error: Story = {
  args: {
    error: true,
    value: 'invalid',
    placeholder: 'Email address',
    'aria-label': 'Email address',
    'aria-invalid': 'true',
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: 'Read-only content',
    'aria-label': 'Read-only input',
  },
};

export const Required: Story = {
  render: () => (
    <div style={columnStyle}>
      <BoxedInput
        required
        placeholder="Required field"
        id="required-field"
        aria-label="Required field"
      />
    </div>
  ),
};

export const Multiline: Story = {
  render: () => (
    <div style={columnStyle}>
      <BoxedInput
        multiline
        rows={3}
        placeholder="Write a short description"
        aria-label="Short description"
      />
      <BoxedInput
        multiline
        rows={5}
        placeholder="Write a longer message"
        aria-label="Long message"
      />
    </div>
  ),
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={columnStyle}>
      <BoxedInput fullWidth placeholder="Full width input" aria-label="Full width input" />
      <BoxedInput
        fullWidth
        placeholder="Full width with error"
        error
        aria-label="Full width input with error"
        aria-invalid="true"
      />
    </div>
  ),
};

export const WithAdornments: Story = {
  render: () => (
    <div style={columnStyle}>
      <BoxedInput
        startAdornment={<span aria-hidden="true">$</span>}
        placeholder="Amount"
        aria-label="Amount in USD"
      />
      <BoxedInput
        endAdornment={<span aria-hidden="true">kg</span>}
        placeholder="Weight"
        aria-label="Weight in kilograms"
      />
      <BoxedInput
        startAdornment={<span aria-hidden="true">@</span>}
        endAdornment={<span aria-hidden="true">.com</span>}
        placeholder="username"
        aria-label="Username"
      />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <BoxedInput
        defaultValue="This is a very long input value that might overflow or truncate depending on the container width"
        style={{ width: '240px' }}
        aria-label="Long single-line value"
      />
      <BoxedInput
        multiline
        rows={3}
        defaultValue="This is a long multiline text that spans multiple lines to demonstrate how the component handles extended content gracefully."
        style={{ width: '320px' }}
        aria-label="Long multiline value"
      />
    </div>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="a11y-email">Email address</label>
        <BoxedInput
          id="a11y-email"
          type="email"
          placeholder="you@example.com"
          aria-describedby="a11y-email-hint"
          required
        />
        <span id="a11y-email-hint" style={{ fontSize: '12px', color: '#666' }}>
          We will never share your email.
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="a11y-error-input">Username</label>
        <BoxedInput
          id="a11y-error-input"
          error
          defaultValue="invalid user!"
          aria-describedby="a11y-error-msg"
          aria-invalid="true"
        />
        <span id="a11y-error-msg" style={{ fontSize: '12px', color: '#d32f2f' }}>
          Username can only contain letters, numbers, and underscores.
        </span>
      </div>
    </div>
  ),
};

/**
 * 포커스 chrome 은 CSS `:focus` 가 아니라 `InputBase` 가 관리하는 상태 클래스가 그린다.
 * 그래서 `play` 에서 실제로 포커스를 옮겨야 보인다 — 클래스를 손으로 붙이면 상태 기계를
 * 건너뛰고 시각만 흉내 내는 것이 된다.
 *
 * 평상시 필드를 옆에 둬서 대비를 함께 본다. Chromatic 은 `play` 이후를 찍으므로
 * 포커스 표시 자체가 시각 회귀 대상이 된다.
 */
export const Focused: Story = {
  render: () => (
    <div style={columnStyle}>
      <BoxedInput aria-label="Focused field" placeholder="Focused" />
      <BoxedInput aria-label="Resting field" placeholder="Resting" />
      <BoxedInput aria-label="Focused with error" placeholder="Focused + error" error />
    </div>
  ),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLInputElement>('input')?.focus();
  },
};
