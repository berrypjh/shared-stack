import type { Meta, StoryObj } from '@storybook/react-vite';

import { Box } from './Box';

const meta = {
  title: 'Components/Box',
  component: Box,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: '박스 내용',
  },
  argTypes: {
    p: { control: 'text', description: 'padding (SpacingToken | number)' },
    px: { control: 'text', description: 'padding x축' },
    py: { control: 'text', description: 'padding y축' },
    pt: { control: 'text', description: 'padding-top' },
    pr: { control: 'text', description: 'padding-right' },
    pb: { control: 'text', description: 'padding-bottom' },
    pl: { control: 'text', description: 'padding-left' },
    m: { control: 'text', description: 'margin (SpacingToken | number)' },
    mx: { control: 'text', description: 'margin x축' },
    my: { control: 'text', description: 'margin y축' },
    mt: { control: 'text', description: 'margin-top' },
    mr: { control: 'text', description: 'margin-right' },
    mb: { control: 'text', description: 'margin-bottom' },
    ml: { control: 'text', description: 'margin-left' },
    bg: { control: 'text', description: 'background-color (ColorToken)' },
    radius: { control: 'text', description: 'border-radius (RadiusToken | number)' },
    children: { control: false },
    className: { control: false },
    style: { control: false },
  },
} satisfies Meta<typeof Box>;

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
  gap: '16px',
  alignItems: 'flex-start',
};

const boxBaseStyle = {
  border: '1px dashed var(--ds-stroke-default)',
  minWidth: '80px',
  minHeight: '40px',
};

export const Playground: Story = {
  render: (args) => <Box {...args} />,
};

export const Default: Story = {
  args: {
    children: '기본 Box',
  },
  render: (args) => <Box {...args} style={boxBaseStyle} />,
};

export const WithSpacing: Story = {
  render: () => (
    <div style={columnStyle}>
      <div>
        <p style={{ fontSize: '12px', color: 'var(--ds-text-light)', marginBottom: '4px' }}>
          p="md" (0.75rem)
        </p>
        <Box p="md" style={{ ...boxBaseStyle, backgroundColor: 'var(--ds-background-surface)' }}>
          padding md
        </Box>
      </div>
      <div>
        <p style={{ fontSize: '12px', color: 'var(--ds-text-light)', marginBottom: '4px' }}>
          px="lg" py="sm"
        </p>
        <Box
          px="lg"
          py="sm"
          style={{ ...boxBaseStyle, backgroundColor: 'var(--ds-background-surface)' }}
        >
          padding x/y 분리
        </Box>
      </div>
      <div>
        <p style={{ fontSize: '12px', color: 'var(--ds-text-light)', marginBottom: '4px' }}>
          p={24} (숫자 px)
        </p>
        <Box p={24} style={{ ...boxBaseStyle, backgroundColor: 'var(--ds-background-surface)' }}>
          padding 24px
        </Box>
      </div>
      <div>
        <p style={{ fontSize: '12px', color: 'var(--ds-text-light)', marginBottom: '4px' }}>
          p="xl" m="sm"
        </p>
        <Box
          p="xl"
          m="sm"
          style={{ ...boxBaseStyle, backgroundColor: 'var(--ds-background-surface)' }}
        >
          padding + margin
        </Box>
      </div>
    </div>
  ),
};

export const WithBackground: Story = {
  render: () => (
    <div style={rowStyle}>
      {(
        [
          { token: 'background.primary', fg: 'var(--ds-text-contrast-text)' },
          { token: 'background.secondary', fg: 'var(--ds-text-contrast-text)' },
          { token: 'background.success', fg: 'var(--ds-text-contrast-text)' },
          { token: 'background.error', fg: 'var(--ds-text-contrast-text)' },
          { token: 'background.warning', fg: 'var(--ds-text-contrast-text)' },
          { token: 'background.grey', fg: 'var(--ds-text-default)' },
        ] as const
      ).map(({ token, fg }) => (
        <Box
          key={token}
          bg={token}
          p="md"
          style={{ borderRadius: '6px', color: fg, fontSize: '12px', whiteSpace: 'nowrap' }}
        >
          {token}
        </Box>
      ))}
    </div>
  ),
};

export const WithRadius: Story = {
  render: () => (
    <div style={rowStyle}>
      {(['xs', 'sm', 'md', 'lg', 'xl', 'rounded'] as const).map((r) => (
        <Box
          key={r}
          radius={r}
          p="md"
          bg="background.primary"
          style={{
            color: 'var(--ds-text-contrast-text)',
            fontSize: '12px',
            minWidth: '60px',
            textAlign: 'center',
          }}
        >
          {r}
        </Box>
      ))}
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <Box
      p="lg"
      radius="md"
      style={{
        maxWidth: '400px',
        backgroundColor: 'var(--ds-background-surface)',
        border: '1px solid var(--ds-stroke-light)',
      }}
    >
      공지사항: 다음 주 화요일 오전 10시부터 정기 시스템 점검이 진행됩니다. 점검 시간은 약 2시간으로
      예상되며, 해당 시간 동안 서비스 이용이 일시 중단될 수 있습니다. 이용에 불편을 드려 죄송합니다.
    </Box>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      <Box
        role="region"
        aria-label="사용자 프로필 섹션"
        p="lg"
        radius="md"
        style={{ border: '1px solid var(--ds-stroke-default)' }}
      >
        role="region" + aria-label
      </Box>
      <Box
        role="article"
        aria-labelledby="article-title"
        p="md"
        style={{ border: '1px solid var(--ds-stroke-default)' }}
      >
        <h3 id="article-title" style={{ margin: 0, marginBottom: '8px' }}>
          공지사항
        </h3>
        <p style={{ margin: 0 }}>role="article" + aria-labelledby</p>
      </Box>
      <Box
        role="complementary"
        aria-describedby="section-desc"
        p="md"
        style={{ border: '1px solid var(--ds-stroke-default)' }}
      >
        <p id="section-desc" style={{ margin: 0 }}>
          aria-describedby 예시
        </p>
      </Box>
    </div>
  ),
  parameters: {
    a11y: { disable: false },
  },
};
