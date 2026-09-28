import type { Meta, StoryObj } from '@storybook/react-vite';

import { ViewSwitch } from './view-switch';

const Placeholder = ({ label }: { label: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '160px',
      border: '1px dashed var(--ds-stroke-light)',
      borderRadius: 'var(--ds-radius-md)',
      color: 'var(--ds-text-light)',
    }}
  >
    {label}
  </div>
);

const meta = {
  title: 'Canvas/ViewSwitch',
  component: ViewSwitch,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    label: '아키텍처',
    canvas: <Placeholder label="그림 (CanvasViewport 가 온다)" />,
    list: <Placeholder label="목록 (DataTable 이 온다)" />,
  },
  argTypes: {
    canvas: { control: false },
    list: { control: false },
    tools: { control: false },
  },
} satisfies Meta<typeof ViewSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 그림과 목록은 같은 정보를 담는다. 고른 쪽만 그리고, 선택은 이 화면의 상태로 남는다. */
export const Playground: Story = {};

/** `tools`(필터)는 같은 줄 왼쪽에 선다. */
export const WithTools: Story = {
  args: {
    tools: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" className="typo-caption-small">
          플랫폼: 전체
        </button>
      </div>
    ),
  },
};
