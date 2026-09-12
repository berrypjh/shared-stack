import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';

import { Button } from './Button';

const meta = {
  title: 'Components/Buttons/Button',
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
      <p id="delete-warning" style={{ fontSize: '12px', color: 'var(--ds-text-light)', margin: 0 }}>
        Deleted items cannot be recovered.
      </p>
      {/* loading 의 고지 수단은 라벨로 이름 붙은 progressbar 다. aria-busy 를 덧붙이면
          같은 상태가 두 번 읽힌다. 라벨을 aria-label 로 덮으면 progressbar 와 이름이 갈린다. */}
      <Button loading>Submit</Button>
      <Button disabled>Unavailable Action</Button>
    </div>
  ),
};

/**
 * 등록된 모든 테마 × 대표 상태를 한 화면에 담는다.
 *
 * 테마 이름을 손으로 적지 않고 **레지스트리를 순회**한다 — design-tokens 에 테마가 늘면
 * 이 갤러리도 자동으로 따라간다. 목록을 박아 두면 새 테마가 조용히 커버리지에서 빠진다.
 *
 * variant × state 의 전체 곱을 만들지 않는다. 토큰이 갈라지는 자리(면·라벨·테두리·비활성)를
 * 대표하는 조합만 둔다 — 스크린샷 하나가 회귀를 잡으면 되지, 개수가 목적이 아니다.
 */
export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => (
    <ThemeGallery>
      {() => (
        <>
          <div style={rowStyle}>
            <Button variant="contained">Contained</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text</Button>
            <Button variant="contained" color="secondary">
              Secondary
            </Button>
            <Button variant="outlined" color="secondary">
              Secondary
            </Button>
          </div>

          <div style={rowStyle}>
            <Button variant="contained" disabled>
              Disabled
            </Button>
            <Button variant="outlined" disabled>
              Disabled
            </Button>
            <Button variant="contained" loading>
              Loading
            </Button>
            <Button variant="contained" size="sm">
              Small
            </Button>
            <Button variant="contained" size="lg">
              Large
            </Button>
          </div>
        </>
      )}
    </ThemeGallery>
  ),
};

/**
 * loading 의 세 위치를 한 자리에서 본다.
 *
 * 위치마다 indicator 가 라벨 앞뒤로 옮겨 다니고 center 는 라벨을 `opacity: 0` 으로 가린다.
 * 어느 배치에서도 **접근 가능한 이름이 사라지지 않는다**는 것을 play 가 확인한다 —
 * 시각만 보는 스크린샷으로는 증명되지 않는 부분이다.
 */
export const LoadingPositions: Story = {
  render: () => (
    <div style={rowStyle}>
      <Button loading loadingPosition="start">
        Start
      </Button>
      <Button loading loadingPosition="center">
        Center
      </Button>
      <Button loading loadingPosition="end">
        End
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const name of ['Start', 'Center', 'End']) {
      const button = canvas.getByRole('button', { name });

      await expect(button).toBeDisabled();
      // 라벨로 이름 붙은 progressbar 가 loading 의 고지 수단이다.
      await expect(within(button).getByRole('progressbar', { name })).toBeInTheDocument();
    }
  },
};

/**
 * 키보드 포커스.
 *
 * `.focus()` 를 부르면 `:focus` 는 켜지지만 **`:focus-visible` 은 켜지지 않는다** — 그것은
 * 포인터로 눌렀는지 키보드로 왔는지에 대한 브라우저 휴리스틱이라서, 실제로 Tab 을 눌러야
 * 재현된다. Chromatic 이 포커스 링을 찍으려면 이 story 가 필요하다.
 */
export const KeyboardFocus: Story = {
  render: () => (
    <div style={rowStyle}>
      <Button variant="contained">First</Button>
      <Button variant="outlined">Second</Button>
      <Button disabled>Skipped</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'First' })).toHaveFocus();

    await userEvent.tab();
    const second = canvas.getByRole('button', { name: 'Second' });
    await expect(second).toHaveFocus();

    // disabled 는 탭 순서에서 빠진다 — 그 사실을 눈이 아니라 단언으로 고정한다.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Skipped' })).not.toHaveFocus();
  },
};
