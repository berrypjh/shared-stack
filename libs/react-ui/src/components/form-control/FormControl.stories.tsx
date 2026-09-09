import type { Meta, StoryObj } from '@storybook/react-vite';

import { FilledInput } from '../filled-input';
import { FormHelperText } from '../form-helper-text';
import { InputLabel } from '../input-label';

import { FormControl } from './FormControl';

const meta = {
  title: 'Components/FormControl',
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

export const AllVariants: Story = {
  render: () => (
    <div style={rowStyle}>
      <FormControl variant="plain">
        <InputLabel htmlFor="plain-input">Plain</InputLabel>
        <FilledInput id="plain-input" placeholder="Placeholder" />
        <FormHelperText>Helper text</FormHelperText>
      </FormControl>
      <FormControl variant="filled">
        <InputLabel htmlFor="filled-input">Filled</InputLabel>
        <FilledInput id="filled-input" placeholder="Placeholder" />
        <FormHelperText>Helper text</FormHelperText>
      </FormControl>
      <FormControl variant="boxed">
        <InputLabel htmlFor="boxed-input">Boxed</InputLabel>
        <FilledInput id="boxed-input" placeholder="Placeholder" />
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
    <div style={{ display: 'grid', minWidth: '320px', border: '1px dashed #ccc', padding: '8px' }}>
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

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      <FormControl required>
        <InputLabel htmlFor="a11y-name">Full name</InputLabel>
        <FilledInput id="a11y-name" placeholder="Jane Smith" />
        <FormHelperText id="a11y-name-helper">Enter your legal full name.</FormHelperText>
      </FormControl>
      <FormControl error>
        <InputLabel htmlFor="a11y-email">Email address</InputLabel>
        <FilledInput
          id="a11y-email"
          type="email"
          value="bad-input"
          aria-invalid="true"
          aria-describedby="a11y-email-error"
        />
        <FormHelperText id="a11y-email-error" error>
          Please enter a valid email address.
        </FormHelperText>
      </FormControl>
      <FormControl disabled>
        <InputLabel htmlFor="a11y-disabled">Read-only account ID</InputLabel>
        <FilledInput id="a11y-disabled" value="USR-00142" />
        <FormHelperText>This value cannot be changed.</FormHelperText>
      </FormControl>
    </div>
  ),
};
