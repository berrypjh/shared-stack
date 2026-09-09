import type { Meta, StoryObj } from '@storybook/react-vite';

import { PlainInput } from './PlainInput';

const meta = {
  title: 'Components/PlainInput',
  component: PlainInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Enter value',
    size: 'md',
    color: 'primary',
    disabled: false,
    error: false,
    readOnly: false,
    required: false,
    multiline: false,
    fullWidth: false,
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
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    multiline: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    onChange: { action: 'changed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
    startAdornment: { control: false },
    endAdornment: { control: false },
    inputProps: { control: false },
    textareaProps: { control: false },
    inputRef: { control: false },
    children: { control: false },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof PlainInput>;

export default meta;

type Story = StoryObj<typeof meta>;

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '320px',
};

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" />
  </svg>
);

const AtIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C13.1 22 14.16 21.83 15.16 21.52L13.67 20.03C13.13 20.17 12.58 20.25 12 20.25C7.45 20.25 3.75 16.55 3.75 12C3.75 7.45 7.45 3.75 12 3.75C16.55 3.75 20.25 7.45 20.25 12V13C20.25 13.69 19.69 14.25 19 14.25C18.31 14.25 17.75 13.69 17.75 13V12C17.75 9.38 15.62 7.25 13 7.25C10.38 7.25 8.25 9.38 8.25 12C8.25 14.62 10.38 16.75 13 16.75C14.31 16.75 15.5 16.22 16.37 15.35C16.91 16.2 17.89 16.75 19 16.75C20.61 16.75 21.95 15.46 22 13.86V12C22 6.48 17.52 2 12 2ZM13 15C11.34 15 10 13.66 10 12C10 10.34 11.34 9 13 9C14.66 9 16 10.34 16 12C16 13.66 14.66 15 13 15Z" />
  </svg>
);

export const Playground: Story = {
  render: (args) => <PlainInput {...args} />,
};

export const Default: Story = {
  args: {
    placeholder: 'Enter your name',
    'aria-label': 'Name',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={columnStyle}>
      <PlainInput size="sm" placeholder="Small (sm)" aria-label="Small input" />
      <PlainInput size="md" placeholder="Medium (md)" aria-label="Medium input" />
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <PlainInput color="primary" placeholder="Primary color" aria-label="Primary color input" />
      <PlainInput
        color="secondary"
        placeholder="Secondary color"
        aria-label="Secondary color input"
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'Cannot edit this value',
    'aria-label': 'Disabled input',
  },
};

export const Error: Story = {
  render: () => (
    <div style={columnStyle}>
      <PlainInput
        error
        placeholder="Invalid email address"
        value="not-an-email"
        aria-label="Email address"
        aria-invalid="true"
      />
      <PlainInput
        error
        placeholder="Required field is empty"
        aria-label="Required field"
        aria-invalid="true"
      />
    </div>
  ),
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: 'Read-only content',
    'aria-label': 'Read-only input',
  },
};

export const Required: Story = {
  args: {
    required: true,
    placeholder: 'Required field',
    id: 'required-plain-input',
    'aria-label': 'Required field',
  },
};

export const Multiline: Story = {
  render: () => (
    <div style={columnStyle}>
      <PlainInput
        multiline
        placeholder="Write your message here..."
        rows={3}
        aria-label="Short message"
      />
      <PlainInput multiline placeholder="Larger text area..." rows={6} aria-label="Long message" />
    </div>
  ),
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'grid', gap: '12px', width: '480px' }}>
      <PlainInput fullWidth placeholder="Full width input" aria-label="Full width input" />
      <PlainInput
        fullWidth
        size="sm"
        placeholder="Full width small"
        aria-label="Full width small input"
      />
    </div>
  ),
};

export const WithAdornments: Story = {
  render: () => (
    <div style={columnStyle}>
      <PlainInput
        startAdornment={<SearchIcon />}
        placeholder="Search projects..."
        aria-label="Search projects"
      />
      <PlainInput
        startAdornment={<AtIcon />}
        placeholder="username"
        endAdornment={
          <span aria-hidden="true" style={{ fontSize: '13px', color: 'var(--ds-text-light)' }}>
            @company.com
          </span>
        }
        aria-label="Username"
      />
      <PlainInput
        startAdornment={
          <span aria-hidden="true" style={{ fontSize: '13px', color: 'var(--ds-text-light)' }}>
            $
          </span>
        }
        endAdornment={
          <span aria-hidden="true" style={{ fontSize: '13px', color: 'var(--ds-text-light)' }}>
            USD
          </span>
        }
        placeholder="0.00"
        type="number"
        aria-label="Amount in USD"
      />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <PlainInput
        value="This is a very long input value that demonstrates how the component handles overflow and text truncation in single-line mode"
        aria-label="Long single-line value"
      />
      <PlainInput
        multiline
        rows={4}
        value="This is a multiline input with a longer block of text. It can wrap across multiple lines and the component should handle the layout gracefully without breaking the design."
        aria-label="Long multiline value"
      />
    </div>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      <PlainInput
        id="a11y-plain-email"
        aria-label="Email address"
        type="email"
        placeholder="you@example.com"
        required
      />
      <PlainInput
        id="a11y-plain-search"
        aria-label="Search"
        startAdornment={<SearchIcon />}
        placeholder="Search..."
        type="search"
      />
      <PlainInput
        id="a11y-plain-notes"
        aria-label="Additional notes"
        aria-describedby="a11y-plain-notes-hint"
        multiline
        rows={3}
        placeholder="Optional notes..."
      />
      <PlainInput aria-label="Disabled field" disabled value="Not editable" />
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
      <PlainInput aria-label="Focused field" placeholder="Focused" />
      <PlainInput aria-label="Resting field" placeholder="Resting" />
      <PlainInput aria-label="Focused with error" placeholder="Focused + error" error />
    </div>
  ),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLInputElement>('input')?.focus();
  },
};
