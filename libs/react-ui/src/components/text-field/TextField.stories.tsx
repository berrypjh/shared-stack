import { themes } from '@berrypjh/ui-core';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeProvider } from '../../theme';
import { MenuItem } from '../menu-item';

import { TextField } from './TextField';

const meta = {
  title: 'Components/Inputs/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    label: 'Label',
    placeholder: 'Enter value',
    variant: 'boxed',
    size: 'md',
    color: 'primary',
    margin: 'none',
    disabled: false,
    error: false,
    required: false,
    fullWidth: false,
    multiline: false,
    select: false,
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
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'tel', 'url'],
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    required: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    multiline: { control: 'boolean' },
    select: { control: 'boolean' },
    onChange: { action: 'changed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
    label: { control: 'text' },
    helperText: { control: 'text' },
    children: { control: false },
    inputRef: { control: false },
    component: { control: false },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '320px',
};

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '24px',
  alignItems: 'flex-start',
};

export const Playground: Story = {
  render: (args) => <TextField {...args} />,
};

export const Default: Story = {
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={rowStyle}>
      <TextField variant="plain" label="Plain" placeholder="Enter value" />
      <TextField variant="filled" label="Filled" placeholder="Enter value" />
      <TextField variant="boxed" label="Boxed" placeholder="Enter value" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={columnStyle}>
      <TextField size="sm" label="Small (sm)" placeholder="Small input" />
      <TextField size="md" label="Medium (md)" placeholder="Medium input" />
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <TextField color="primary" label="Primary" placeholder="Primary color" />
      <TextField color="secondary" label="Secondary" placeholder="Secondary color" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={columnStyle}>
      <TextField
        label="Username"
        value="john.doe"
        disabled
        helperText="This field cannot be edited."
      />
      <TextField variant="filled" label="Email" value="john@example.com" disabled />
    </div>
  ),
};

/**
 * `readOnly` 와 `disabled` 를 나란히 둔다 — 둘은 다른 상태다.
 *
 * readOnly 는 편집만 막고 포커스·탐색·값 제출은 살린다. disabled 는 셋 다 막고 비활성으로
 * 고지된다. 시각이 거의 같아서 회귀가 눈에 띄지 않으므로 한 화면에서 비교한다.
 */
export const ReadOnly: Story = {
  render: () => (
    <div style={columnStyle}>
      <TextField
        label="Account ID"
        value="ACC-1024"
        readOnly
        helperText="Read-only: focusable, submitted with the form."
      />
      <TextField
        label="Account ID"
        value="ACC-1024"
        disabled
        helperText="Disabled: not focusable, not submitted."
      />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div style={columnStyle}>
      <TextField
        label="Email address"
        value="not-an-email"
        error
        helperText="Please enter a valid email address."
      />
      <TextField
        label="Password"
        type="password"
        error
        helperText="Password must be at least 8 characters."
      />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div style={columnStyle}>
      <TextField label="Full name" required placeholder="Jane Smith" />
      <TextField
        label="Email address"
        required
        error
        helperText="This field is required."
        type="email"
      />
    </div>
  ),
};

export const Multiline: Story = {
  render: () => (
    <div style={columnStyle}>
      <TextField label="Bio" multiline rows={3} placeholder="Tell us about yourself..." />
      <TextField
        label="Message"
        multiline
        rows={5}
        placeholder="Write your message here..."
        helperText="Maximum 500 characters."
      />
    </div>
  ),
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'grid', gap: '16px', width: '480px' }}>
      <TextField fullWidth label="Full name" placeholder="Jane Smith" />
      <TextField
        fullWidth
        label="Email address"
        type="email"
        placeholder="you@example.com"
        helperText="We will never share your email."
      />
      <TextField fullWidth size="sm" label="Company" placeholder="Acme Corp" />
    </div>
  ),
};

export const WithSelect: Story = {
  render: () => (
    <div style={columnStyle}>
      <TextField label="Notification frequency" select defaultValue="weekly">
        <MenuItem value="daily">Daily</MenuItem>
        <MenuItem value="weekly">Weekly</MenuItem>
        <MenuItem value="monthly">Monthly</MenuItem>
      </TextField>
      <TextField
        label="User role"
        select
        required
        helperText="Admins have full access to all settings."
        defaultValue="viewer"
      >
        <MenuItem value="admin">Admin</MenuItem>
        <MenuItem value="editor">Editor</MenuItem>
        <MenuItem value="viewer">Viewer</MenuItem>
      </TextField>
    </div>
  ),
  // select 모드의 목록도 라벨로 이름을 갖고, Escape 는 포커스를 trigger 에 둔다.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Notification frequency' });

    await userEvent.click(trigger);
    await expect(canvas.getByRole('listbox')).toHaveAccessibleName('Notification frequency');

    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
  },
};

export const WithHelperText: Story = {
  render: () => (
    <div style={columnStyle}>
      <TextField
        label="Username"
        placeholder="john_doe"
        helperText="Must be 3–20 characters. Letters, numbers, and underscores only."
      />
      <TextField
        label="Password"
        type="password"
        helperText="Use a mix of uppercase, lowercase, numbers, and symbols."
      />
      <TextField
        label="Email address"
        type="email"
        error
        helperText="This email is already in use."
      />
      <TextField
        label="Disabled field"
        disabled
        value="cannot-edit"
        helperText="Contact your admin to change this value."
      />
    </div>
  ),
};

export const WithMargin: Story = {
  render: () => (
    <div style={{ display: 'grid', minWidth: '320px', border: '1px dashed #ccc', padding: '8px' }}>
      <TextField margin="none" label="No margin" placeholder="margin: none" />
      <TextField margin="dense" label="Dense margin" placeholder="margin: dense" />
      <TextField margin="normal" label="Normal margin" placeholder="margin: normal" />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <TextField
        label="Billing address line 1 (street and building number)"
        value="123 Long Street Name, Apartment 4B, Building Complex Name"
        helperText="Enter the full street address including apartment or suite number if applicable."
      />
      <TextField
        label="Project description"
        multiline
        rows={3}
        value="This is a multiline text field with a longer block of text that wraps across multiple lines and tests the layout behavior of the component."
      />
    </div>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      {/* label과 input 자동 연결 (htmlFor → id) */}
      <TextField
        id="a11y-email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        required
        helperText="Enter the email you used to sign up."
      />
      {/* error + helperText aria-describedby 자동 연결 */}
      <TextField
        id="a11y-password"
        label="Password"
        type="password"
        error
        helperText="Password must be at least 8 characters."
      />
      {/* disabled */}
      <TextField
        id="a11y-account-id"
        label="Account ID"
        value="USR-00142"
        disabled
        helperText="This value cannot be changed."
      />
      {/* select */}
      <TextField
        id="a11y-role"
        label="User role"
        select
        required
        defaultValue="viewer"
        helperText="Select the appropriate access level."
      >
        <MenuItem value="admin">Admin</MenuItem>
        <MenuItem value="editor">Editor</MenuItem>
        <MenuItem value="viewer">Viewer</MenuItem>
      </TextField>
    </div>
  ),
};

/** `deepSea` 같은 합성어도 읽히도록 띄어 쓴다. preview 툴바와 같은 규칙. */
const themeLabel = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (character) => character.toUpperCase());

/**
 * 등록된 모든 테마를 한 화면에 나란히 세운다.
 *
 * 테마마다 스토리를 복사하면 design-tokens 에 테마가 늘어도 Storybook 만 조용히 낡는다 —
 * 툴바가 이미 겪은 문제다. 여기서는 `themes` 레지스트리를 순회하므로 새 테마가 자동으로 들어온다.
 *
 * 툴바 데코레이터를 끄는 것은 **정확성 때문**이다. light 는 CSS 선택자가 `:root` 하나뿐이라
 * `data-theme="light"` 에 대응하는 규칙이 없다 — 바깥이 dark 로 감싸여 있으면 light 칸이
 * dark 를 물려받아 매트릭스가 거짓말을 한다. 데코레이터를 끄면 `:root` 가 light 를 맡고
 * 나머지 여섯은 각자의 `data-theme` 로 스코프된다.
 */
export const ThemeMatrix: Story = {
  parameters: {
    layout: 'fullscreen',
    disableThemeDecorator: true,
  },
  render: () => (
    <div style={{ display: 'grid', gap: '20px', padding: '24px' }}>
      {themes.map(({ name }) => (
        <ThemeProvider key={name} mode={name}>
          <div
            style={{
              display: 'grid',
              gap: '12px',
              padding: '16px',
              borderRadius: 'var(--ds-radius-md)',
              background: 'var(--ds-background-default)',
              color: 'var(--ds-text-default)',
              border: '1px solid var(--ds-field-border)',
            }}
          >
            <strong style={{ font: 'var(--ds-body-small-font-size) / 1 inherit' }}>
              {themeLabel(name)}
            </strong>

            <div style={rowStyle}>
              <TextField variant="plain" label="Plain" placeholder="Enter value" />
              <TextField variant="filled" label="Filled" defaultValue="Filled value" />
              <TextField
                variant="boxed"
                label="Boxed"
                error
                defaultValue="bad@"
                helperText="Enter a valid email address."
              />
              <TextField variant="boxed" label="Disabled" disabled defaultValue="Not editable" />
              <TextField variant="boxed" label="Required" required placeholder="Enter value" />
            </div>
          </div>
        </ThemeProvider>
      ))}
    </div>
  ),
};
