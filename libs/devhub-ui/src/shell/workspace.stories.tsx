import type { Meta, StoryObj } from '@storybook/react-vite';

import { WorkspaceFrame, WorkspaceHeader, WorkspaceSection } from './workspace';

/**
 * 세 컴포넌트가 함께 짜는 가운데 칸이라 한 파일에 묶는다. `WorkspaceFrame` 이 `<main>`,
 * 첫 자식은 늘 `WorkspaceHeader`, 그 아래 하나 이상의 `WorkspaceSection`.
 */
const meta = {
  title: 'Shell/Workspace',
  component: WorkspaceFrame,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    children: null,
  },
  argTypes: {
    children: { control: false },
  },
} satisfies Meta<typeof WorkspaceFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <WorkspaceFrame>
      <WorkspaceHeader eyebrow="패키지" icon="package" title="react-ui" />
      <WorkspaceSection id="overview" title="개요">
        <p className="typo-body-small">웹 UI 컴포넌트. React 19 · Tailwind v4 위에 선다.</p>
      </WorkspaceSection>
      <WorkspaceSection id="entries" title="진입점">
        <p className="typo-body-small devhub-code">@berrypjh/react-ui</p>
      </WorkspaceSection>
    </WorkspaceFrame>
  ),
};

/** `lg` 미만에서는 상세 정보가 본문 뒤에 오므로, 머리에 그리로 가는 건너뛰기 링크가 있다. */
export const HeaderOnly: Story = {
  render: () => (
    <WorkspaceFrame>
      <WorkspaceHeader eyebrow="개요" icon="home" title="berrypjh/shared-stack" />
    </WorkspaceFrame>
  ),
};

/** 아이콘 없는 머리. */
export const HeaderWithoutIcon: Story = {
  render: () => (
    <WorkspaceFrame>
      <WorkspaceHeader eyebrow="문서" title="README.md" />
    </WorkspaceFrame>
  ),
};
