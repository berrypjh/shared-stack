import type { Meta, StoryObj } from '@storybook/react-vite';

import { FilledInput } from './FilledInput';

const meta = {
  title: 'Components/Inputs/FilledInput',
  component: FilledInput,
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
} satisfies Meta<typeof FilledInput>;

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

const VisibilityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 12 9 12Z" />
  </svg>
);

const EuroIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M15 18.5C12.49 18.5 10.32 17.08 9.24 15H15V13H8.58C8.53 12.67 8.5 12.34 8.5 12C8.5 11.66 8.53 11.33 8.58 11H15V9H9.24C10.32 6.92 12.5 5.5 15 5.5C16.61 5.5 18.09 6.09 19.23 7.07L21 5.3C19.41 3.87 17.3 3 15 3C11.08 3 7.76 5.51 6.52 9H3V11H6.06C6.02 11.33 6 11.66 6 12C6 12.34 6.02 12.67 6.06 13H3V15H6.52C7.76 18.49 11.08 21 15 21C17.31 21 19.41 20.13 21 18.7L19.22 16.93C18.09 17.91 16.62 18.5 15 18.5Z" />
  </svg>
);

export const Playground: Story = {
  render: (args) => <FilledInput {...args} />,
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
      <FilledInput size="sm" placeholder="Small (sm)" aria-label="Small input" />
      <FilledInput size="md" placeholder="Medium (md)" aria-label="Medium input" />
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <FilledInput color="primary" placeholder="Primary color" aria-label="Primary color input" />
      <FilledInput
        color="secondary"
        placeholder="Secondary color"
        aria-label="Secondary color input"
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
    value: 'Cannot edit this',
    'aria-label': 'Disabled input',
  },
};

export const Error: Story = {
  render: () => (
    <div style={columnStyle}>
      <FilledInput
        error
        placeholder="Invalid email address"
        value="not-an-email"
        aria-label="Email address"
        aria-invalid="true"
      />
      <FilledInput
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
    id: 'required-input',
    'aria-label': 'Required field',
  },
};

export const Multiline: Story = {
  render: () => (
    <div style={columnStyle}>
      <FilledInput
        multiline
        placeholder="Write your message here..."
        rows={3}
        aria-label="Short message"
      />
      <FilledInput multiline placeholder="Larger text area..." rows={6} aria-label="Long message" />
    </div>
  ),
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'grid', gap: '12px', width: '480px' }}>
      <FilledInput fullWidth placeholder="Full width input" aria-label="Full width input" />
      <FilledInput
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
      <FilledInput
        startAdornment={<SearchIcon />}
        placeholder="Search projects..."
        aria-label="Search projects"
      />
      <FilledInput
        endAdornment={<VisibilityIcon />}
        type="password"
        placeholder="Enter password"
        aria-label="Password"
      />
      <FilledInput
        startAdornment={<EuroIcon />}
        endAdornment={
          <span aria-hidden="true" style={{ fontSize: '13px' }}>
            EUR
          </span>
        }
        placeholder="0.00"
        type="number"
        aria-label="Amount in EUR"
      />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <FilledInput
        value="This is a very long input value that demonstrates how the component handles overflow and text truncation in single-line mode"
        aria-label="Long single-line value"
      />
      <FilledInput
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
      <FilledInput
        id="email-input"
        aria-label="Email address"
        type="email"
        placeholder="you@example.com"
        required
      />
      <FilledInput
        id="search-input"
        aria-label="Search"
        startAdornment={<SearchIcon />}
        placeholder="Search..."
        type="search"
      />
      <FilledInput
        id="notes-input"
        aria-label="Additional notes"
        aria-describedby="notes-hint"
        multiline
        rows={3}
        placeholder="Optional notes..."
      />
      <p id="notes-hint" style={{ fontSize: '12px', color: 'var(--ds-text-light)', margin: 0 }}>
        Notes are visible to your team only.
      </p>
      <FilledInput aria-label="Disabled field" disabled value="Not editable" />
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
      <FilledInput aria-label="Focused field" placeholder="Focused" />
      <FilledInput aria-label="Resting field" placeholder="Resting" />
      <FilledInput aria-label="Focused with error" placeholder="Focused + error" error />
    </div>
  ),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLInputElement>('input')?.focus();
  },
};
