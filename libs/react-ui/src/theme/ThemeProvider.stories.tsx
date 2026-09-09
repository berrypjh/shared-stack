import { themes } from '@berrypjh/ui-core';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../components/button/Button';

import { ThemeProvider } from './ThemeProvider';

/** 등록된 테마 이름. 하드코딩하면 design-tokens 에 테마가 늘어도 스토리만 낡는다. */
const themeNames = themes.map(({ name }) => name);

const meta = {
  title: 'Theme/ThemeProvider',
  component: ThemeProvider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    disableThemeDecorator: true,
  },
  args: {
    mode: 'light',
    children: null,
  },
  argTypes: {
    mode: {
      control: 'select',
      options: themeNames,
    },
    children: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof ThemeProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 표면은 시맨틱 토큰으로만 칠한다. `data-theme` 캐스케이드가 테마마다 올바른 짝을 이미
 * 갖고 있어서, light/dark 를 분기하면 나머지 5개 테마가 그 분기에서 빠진다.
 */
const surfaceStyle = {
  display: 'grid',
  gap: '16px',
  padding: '24px',
  borderRadius: '16px',
  border: '1px solid var(--ds-stroke-default)',
  background: 'var(--ds-background-surface)',
  color: 'var(--ds-text-default)',
  minWidth: '320px',
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 700,
  lineHeight: 1.4,
  // 레지스트리 이름을 그대로 쓰고 표시만 다듬는다 — 라벨 헬퍼를 중복하지 않기 위해서다.
  textTransform: 'capitalize' as const,
};

const bodyStyle = {
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.6,
  color: 'var(--ds-text-light)',
};

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '12px',
  alignItems: 'center',
};

export const Playground: Story = {
  args: {
    children: null,
  },
  render: (args) => (
    <ThemeProvider {...args}>
      <div style={surfaceStyle}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <h2 style={{ ...sectionTitleStyle, textTransform: 'none' }}>ThemeProvider</h2>
          <p style={bodyStyle}>
            <code>data-theme</code> 변경에 따라 내부 컴포넌트가 어떻게 반응하는지 확인하기 위한 예시
          </p>
        </div>
        <div style={rowStyle}>
          <Button variant="contained" color="primary">
            Button
          </Button>
          <Button variant="outlined" color="secondary">
            Secondary
          </Button>
          <Button loading loadingPosition="start" startIcon={<>*</>}>
            Loading
          </Button>
        </div>
      </div>
    </ThemeProvider>
  ),
};

export const Default: Story = {
  args: {
    mode: 'light',
    children: null,
  },
  render: (args) => (
    <ThemeProvider {...args}>
      <div style={surfaceStyle}>
        <h3 style={sectionTitleStyle}>{args.mode}</h3>
        <div style={rowStyle}>
          <Button>Button</Button>
          <Button variant="outlined">Button</Button>
        </div>
      </div>
    </ThemeProvider>
  ),
};

/** 등록된 테마를 전부 훑는다. 목록을 박아 두면 테마가 늘어도 여기서 조용히 빠진다. */
export const AllModes: Story = {
  args: {
    children: null,
  },
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'grid', gap: '24px' }}>
      {themeNames.map((name) => (
        <ThemeProvider key={name} mode={name}>
          <div style={surfaceStyle}>
            <h3 style={sectionTitleStyle}>{name}</h3>
            <div style={rowStyle}>
              <Button variant="contained">Button</Button>
              <Button variant="outlined">Button</Button>
            </div>
          </div>
        </ThemeProvider>
      ))}
    </div>
  ),
};

/**
 * 보여주려는 것은 **중첩 자체**다 — 안쪽 scope 가 자기 `data-theme` 을 열고 캐스케이드가
 * 그 안에서 이긴다. 어떤 두 테마인지는 본질이 아니라서 레지스트리의 앞 두 개를 쓴다.
 */
export const NestedThemeExample: Story = {
  args: {
    children: null,
  },
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <ThemeProvider mode={themeNames[0]}>
      <div style={{ ...surfaceStyle, gap: '24px' }}>
        <h3 style={sectionTitleStyle}>{themeNames[0]} (Outer)</h3>
        <div style={rowStyle}>
          <Button>Button</Button>
          <Button variant="outlined">Button</Button>
        </div>

        <ThemeProvider mode={themeNames[1]}>
          <div style={surfaceStyle}>
            <h3 style={sectionTitleStyle}>{themeNames[1]} (Inner)</h3>
            <div style={rowStyle}>
              <Button>Button</Button>
              <Button variant="outlined">Button</Button>
            </div>
          </div>
        </ThemeProvider>
      </div>
    </ThemeProvider>
  ),
};
