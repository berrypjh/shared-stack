import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Button',
    variant: 'contained',
    size: 'md',
    color: 'primary',
    disabled: false,
    fullWidth: false,
    loading: false,
    loadingPosition: 'center',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['contained', 'outlined', 'text'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    loadingPosition: {
      control: 'select',
      options: ['start', 'center', 'end'],
    },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    loading: { control: 'boolean' },
    onClick: { action: 'clicked' },
    startIcon: { control: false },
    endIcon: { control: false },
    loadingIndicator: { control: false },
    className: { control: false },
    style: { control: false },
    component: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '12px',
  alignItems: 'center',
};

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '320px',
};

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 20H19V18H5M19 9H15V3H9V9H5L12 16L19 9Z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
  </svg>
);

export const Playground: Story = {
  render: (args) => <Button {...args} />,
};

export const Default: Story = {
  args: {
    children: 'Save Changes',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={rowStyle}>
      <Button variant="contained">Contained</Button>
      <Button variant="outlined">Outlined</Button>
      <Button variant="text">Text</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={rowStyle}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <div style={rowStyle}>
        <Button variant="contained" color="primary">
          Primary
        </Button>
        <Button variant="contained" color="secondary">
          Secondary
        </Button>
      </div>
      <div style={rowStyle}>
        <Button variant="outlined" color="primary">
          Primary
        </Button>
        <Button variant="outlined" color="secondary">
          Secondary
        </Button>
      </div>
      <div style={rowStyle}>
        <Button variant="text" color="primary">
          Primary
        </Button>
        <Button variant="text" color="secondary">
          Secondary
        </Button>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={rowStyle}>
      <Button variant="contained" disabled>
        Contained
      </Button>
      <Button variant="outlined" disabled>
        Outlined
      </Button>
      <Button variant="text" disabled>
        Text
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={columnStyle}>
      <div style={rowStyle}>
        <Button loading loadingPosition="start">
          Loading Start
        </Button>
        <Button loading loadingPosition="center">
          Loading Center
        </Button>
        <Button loading loadingPosition="end">
          Loading End
        </Button>
      </div>
      <div style={rowStyle}>
        <Button variant="outlined" loading>
          Outlined
        </Button>
        <Button variant="text" loading>
          Text
        </Button>
      </div>
    </div>
  ),
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'grid', gap: '12px', width: '400px' }}>
      <Button fullWidth variant="contained">
        Create Account
      </Button>
      <Button fullWidth variant="outlined">
        Sign In
      </Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={columnStyle}>
      <div style={rowStyle}>
        <Button startIcon={<PlusIcon />}>New Project</Button>
        <Button endIcon={<ChevronRightIcon />}>Continue</Button>
        <Button startIcon={<DownloadIcon />} endIcon={<ChevronRightIcon />}>
          Download
        </Button>
      </div>
      <div style={rowStyle}>
        <Button variant="outlined" startIcon={<PlusIcon />}>
          Add Item
        </Button>
        <Button variant="text" endIcon={<ChevronRightIcon />}>
          Learn More
        </Button>
      </div>
      <div style={rowStyle}>
        <Button startIcon={<DownloadIcon />} loading loadingPosition="start">
          Downloading
        </Button>
        <Button endIcon={<ChevronRightIcon />} loading loadingPosition="end">
          Processing
        </Button>
      </div>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <Button>Subscribe to the weekly newsletter</Button>
      <Button variant="outlined" startIcon={<DownloadIcon />}>
        Download the complete annual report
      </Button>
      <Button variant="text">View all available integrations and plugins</Button>
    </div>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      <Button aria-label="Save all pending changes">Save</Button>
      <Button
        variant="outlined"
        aria-label="Delete selected item"
        aria-describedby="delete-warning"
      >
        Delete
      </Button>
      {/* loading 의 고지 수단은 라벨로 이름 붙은 progressbar 다. aria-busy 를 덧붙이면
          같은 상태가 두 번 읽힌다. 라벨을 aria-label 로 덮으면 progressbar 와 이름이 갈린다. */}
      <Button loading>Submit</Button>
      <Button disabled>Unavailable Action</Button>
    </div>
  ),
  parameters: {
    a11y: { disable: false },
  },
};
