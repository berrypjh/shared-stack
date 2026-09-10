import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';

import { IconButton } from './IconButton';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    // 아이콘 전용 컨트롤은 접근 가능한 이름이 타입 요구사항이다. meta 에 두면 모든 스토리가
    // 물려받고 Playground 의 control 로도 노출된다.
    'aria-label': 'Search',
    size: 'md',
    color: 'primary',
    edge: false,
    disabled: false,
    loading: null,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    edge: {
      control: 'select',
      options: [false, 'start', 'end'],
    },
    loading: {
      control: 'select',
      options: [null, false, true],
    },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
    children: { control: false },
    loadingIndicator: { control: false },
    className: { control: false },
    style: { control: false },
    component: { control: false },
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '8px',
  alignItems: 'center',
};

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '320px',
};

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" />
  </svg>
);

const MoreVertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" />
  </svg>
);

const BookmarkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" />
  </svg>
);

export const Playground: Story = {
  render: (args) => (
    <IconButton {...args}>
      <SearchIcon />
    </IconButton>
  ),
};

export const Default: Story = {
  render: () => (
    <IconButton aria-label="Close dialog">
      <CloseIcon />
    </IconButton>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={rowStyle}>
      <IconButton size="sm" aria-label="Search (small)">
        <SearchIcon />
      </IconButton>
      <IconButton size="md" aria-label="Search (medium)">
        <SearchIcon />
      </IconButton>
      <IconButton size="lg" aria-label="Search (large)">
        <SearchIcon />
      </IconButton>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={rowStyle}>
      <IconButton color="primary" aria-label="Bookmark (primary)">
        <BookmarkIcon />
      </IconButton>
      <IconButton color="secondary" aria-label="Bookmark (secondary)">
        <BookmarkIcon />
      </IconButton>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={rowStyle}>
      <IconButton disabled aria-label="Share (disabled)">
        <ShareIcon />
      </IconButton>
      <IconButton disabled color="secondary" aria-label="Bookmark (disabled)">
        <BookmarkIcon />
      </IconButton>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={columnStyle}>
      <div style={rowStyle}>
        <span style={{ fontSize: '12px', color: 'var(--ds-text-light)', minWidth: '120px' }}>
          loading: null
        </span>
        <IconButton loading={null} aria-label="Search">
          <SearchIcon />
        </IconButton>
      </div>
      <div style={rowStyle}>
        <span style={{ fontSize: '12px', color: 'var(--ds-text-light)', minWidth: '120px' }}>
          loading: false
        </span>
        <IconButton loading={false} aria-label="Search">
          <SearchIcon />
        </IconButton>
      </div>
      <div style={rowStyle}>
        <span style={{ fontSize: '12px', color: 'var(--ds-text-light)', minWidth: '120px' }}>
          loading: true
        </span>
        <IconButton loading={true} aria-label="Saving...">
          <BookmarkIcon />
        </IconButton>
      </div>
    </div>
  ),
};

export const WithEdge: Story = {
  render: () => (
    <div style={columnStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          border: '1px dashed var(--ds-stroke-default)',
          borderRadius: '4px',
          minWidth: '320px',
        }}
      >
        <IconButton edge="start" aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" />
          </svg>
        </IconButton>
        <span style={{ fontSize: '14px' }}>Page title</span>
        <IconButton edge="end" aria-label="More options">
          <MoreVertIcon />
        </IconButton>
      </div>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={rowStyle}>
      <IconButton aria-label="Close notification">
        <CloseIcon />
      </IconButton>
      <IconButton aria-label="Search across all projects and workspaces">
        <SearchIcon />
      </IconButton>
      <IconButton aria-label="Share with team members">
        <ShareIcon />
      </IconButton>
      <IconButton aria-label="Save to bookmarks">
        <BookmarkIcon />
      </IconButton>
      <IconButton aria-label="More options">
        <MoreVertIcon />
      </IconButton>
    </div>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      {/* 아이콘만 있으므로 반드시 aria-label 필요 */}
      <div style={rowStyle}>
        <IconButton aria-label="Close dialog">
          <CloseIcon />
        </IconButton>
        <IconButton aria-label="Search">
          <SearchIcon />
        </IconButton>
        <IconButton aria-label="More options" aria-haspopup="true">
          <MoreVertIcon />
        </IconButton>
      </div>
      {/* 비활성화 상태 */}
      <div style={rowStyle}>
        <IconButton disabled aria-label="Share (unavailable)">
          <ShareIcon />
        </IconButton>
      </div>
      {/* 로딩 상태 — 고지는 컴포넌트가 그리는 progressbar 가 맡는다. aria-busy 를 덧붙이면
          같은 상태를 두 번 읽는다. */}
      <div style={rowStyle}>
        <IconButton loading={true} aria-label="Saving bookmark">
          <BookmarkIcon />
        </IconButton>
      </div>
    </div>
  ),
  parameters: {
    a11y: { disable: false },
  },
};

/**
 * 등록된 모든 테마 × 대표 상태. 테마 목록은 레지스트리에서 순회한다 — 손으로 적으면
 * design-tokens 에 테마가 늘어도 여기만 조용히 낡는다.
 *
 * 아이콘 전용 컨트롤이라 **모든 예시가 `aria-label` 을 갖는다** — 갤러리라고 이름을 빼면
 * axe 가 잡을 뿐 아니라 스크린샷도 실제 사용례가 아니게 된다.
 */
export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => (
    <ThemeGallery>
      {() => (
        <div style={rowStyle}>
          <IconButton aria-label="Close">
            <CloseIcon />
          </IconButton>
          <IconButton aria-label="Search" color="secondary">
            <SearchIcon />
          </IconButton>
          <IconButton aria-label="More options" size="sm">
            <MoreVertIcon />
          </IconButton>
          <IconButton aria-label="Close (large)" size="lg">
            <CloseIcon />
          </IconButton>
          <IconButton aria-label="Close (disabled)" disabled>
            <CloseIcon />
          </IconButton>
          <IconButton aria-label="Search (loading)" loading>
            <SearchIcon />
          </IconButton>
        </div>
      )}
    </ThemeGallery>
  ),
};

/**
 * 키보드로 도달하고 활성화된다.
 *
 * 아이콘만 있는 컨트롤이라 "무엇에 포커스가 갔는지"를 눈으로 확인할 수 없다 — 이름으로
 * 단언해야 의미가 있다. `.focus()` 가 아니라 Tab 을 쓰는 이유는 `:focus-visible` 이
 * 키보드 경로에서만 켜지기 때문이다.
 */
export const KeyboardFocus: Story = {
  render: () => (
    <div style={rowStyle}>
      <IconButton aria-label="Search">
        <SearchIcon />
      </IconButton>
      <IconButton aria-label="Close (unavailable)" disabled>
        <CloseIcon />
      </IconButton>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();

    await expect(canvas.getByRole('button', { name: 'Search' })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'Close (unavailable)' })).toBeDisabled();
  },
};
