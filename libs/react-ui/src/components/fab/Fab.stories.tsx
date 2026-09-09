import type { Meta, StoryObj } from '@storybook/react-vite';

import { Fab } from './Fab';

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
  </svg>
);

const EditIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" />
  </svg>
);

const meta = {
  title: 'Components/Fab',
  component: Fab,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    // circular Fab 은 아이콘과 접근 가능한 이름을 타입에서 요구한다. meta 에 두면 모든
    // 스토리가 물려받고 Playground 의 인자로도 쓰인다.
    icon: <PlusIcon />,
    'aria-label': 'Action',
    color: 'primary',
    size: 'lg',
    shape: 'circular',
    disabled: false,
  },
  argTypes: {
    shape: {
      control: 'select',
      options: ['circular', 'extended'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
    icon: { control: false },
    children: { control: false },
    className: { control: false },
    style: { control: false },
    component: { control: false },
  },
} satisfies Meta<typeof Fab>;

export default meta;

/**
 * `StoryObj<typeof meta>` 가 아니라 컴포넌트 기준이다. Fab prop 은 shape 판별 union 이라
 * extended 분기의 필수 `children` 을 meta.args 로는 채울 수 없고, 그러면 모든 스토리가
 * 쓰지도 않는 `args` 를 요구받는다. 런타임 meta.args 기본값은 그대로 적용된다.
 */
type Story = StoryObj<typeof Fab>;

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '16px',
  alignItems: 'center',
};

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '320px',
};

export const Playground: Story = {
  render: (args) => <Fab {...args} />,
};

export const Default: Story = {
  render: () => <Fab icon={<PlusIcon />} aria-label="Add new item" />,
};

export const AllShapes: Story = {
  render: () => (
    <div style={rowStyle}>
      <Fab shape="circular" icon={<PlusIcon />} aria-label="Add" />
      <Fab shape="extended" icon={<EditIcon />}>
        New Post
      </Fab>
      <Fab shape="extended">Compose</Fab>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={rowStyle}>
      <Fab size="sm" icon={<PlusIcon />} aria-label="Add (small)" />
      <Fab size="md" icon={<PlusIcon />} aria-label="Add (medium)" />
      <Fab size="lg" icon={<PlusIcon />} aria-label="Add (large)" />
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <div style={rowStyle}>
        <Fab color="primary" icon={<PlusIcon />} aria-label="Primary" />
        <Fab color="secondary" icon={<PlusIcon />} aria-label="Secondary" />
      </div>
      <div style={rowStyle}>
        <Fab color="primary" shape="extended" icon={<EditIcon />}>
          Primary
        </Fab>
        <Fab color="secondary" shape="extended" icon={<ShareIcon />}>
          Secondary
        </Fab>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={rowStyle}>
      <Fab disabled icon={<PlusIcon />} aria-label="Add (disabled)" />
      <Fab disabled shape="extended" icon={<EditIcon />}>
        Edit
      </Fab>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={rowStyle}>
      <Fab shape="extended" icon={<PlusIcon />}>
        Create New Project
      </Fab>
      <Fab shape="extended" icon={<ShareIcon />}>
        Share with Team
      </Fab>
    </div>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      {/* circular FAB에는 반드시 aria-label 필요 (visible label 없음) */}
      <div style={rowStyle}>
        <Fab icon={<PlusIcon />} aria-label="Add new item" />
        <Fab icon={<EditIcon />} aria-label="Edit current document" />
        <Fab icon={<ShareIcon />} aria-label="Share this content" />
      </div>
      {/* extended FAB는 children이 visible label 역할 */}
      <div style={rowStyle}>
        <Fab shape="extended" icon={<PlusIcon />}>
          Add Item
        </Fab>
        <Fab shape="extended" icon={<EditIcon />} aria-describedby="fab-hint">
          Edit
        </Fab>
      </div>
      <div style={rowStyle}>
        {/* 네이티브 button 은 `disabled` 만으로 충분하다 — aria-disabled 는 링크 host 전용이다. */}
        <Fab disabled icon={<PlusIcon />} aria-label="Add (unavailable)" />
      </div>
    </div>
  ),
  parameters: {
    a11y: { disable: false },
  },
};
