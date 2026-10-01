import type { Meta, StoryObj } from '@storybook/react-vite';

import { InspectorSection } from '../entity/inspector-section';

import { Inspector } from './inspector';

const meta = {
  title: 'Shell/Inspector',
  component: Inspector,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Inspector>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 오른쪽 칸. 내용은 page 가 채운다. */
export const WithContent: Story = {
  render: () => (
    <div style={{ maxWidth: '360px' }}>
      <Inspector>
        <InspectorSection id="sources" title="소스" count={1}>
          <p className="typo-body-small devhub-code">libs/devhub-ui/src/shell/inspector.tsx</p>
        </InspectorSection>
      </Inspector>
    </div>
  ),
};

/** 고른 것이 없을 때 — 무엇이 올지 한 줄로 말한다. */
export const Empty: Story = {
  render: () => (
    <div style={{ maxWidth: '360px' }}>
      <Inspector />
    </div>
  ),
};
