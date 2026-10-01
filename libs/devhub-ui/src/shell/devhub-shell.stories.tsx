import type { Meta, StoryObj } from '@storybook/react-vite';

import { InspectorSection } from '../entity/inspector-section';

import { DevHubShell } from './devhub-shell';
import type { ExplorerSection, ExplorerView } from './explorer';
import { Explorer } from './explorer';
import { Inspector } from './inspector';
import { TopBar } from './top-bar';
import { WorkspaceFrame, WorkspaceHeader, WorkspaceSection } from './workspace';

const VIEWS: ExplorerView[] = [{ id: 'overview', label: '개요', href: '/', icon: 'home' }];

const SECTIONS: ExplorerSection[] = [
  {
    id: 'packages',
    title: '패키지',
    href: '/packages',
    icon: 'package',
    groups: [
      {
        items: [
          { id: 'react-ui', label: 'react-ui', href: '/packages/react-ui', code: true },
          { id: 'devhub-ui', label: 'devhub-ui', href: '/packages/devhub-ui', code: true },
        ],
      },
    ],
  },
];

/**
 * 상단 바 + 탐색기 · 작업 영역 · 상세 정보 세 칸. 이 이야기는 앱이 하는 조립
 * (`apps/devhub/src/components/shell/devhub-shell.tsx`)을 축약해 셸 자체의 반응형 틀을 보인다.
 */
const meta = {
  title: 'Shell/DevHubShell',
  component: DevHubShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    topBar: null,
    explorer: null,
    children: null,
  },
  argTypes: {
    topBar: { control: false },
    explorer: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof DevHubShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <DevHubShell
      topBar={
        <TopBar
          summary={<span className="devhub-code">berrypjh/shared-stack</span>}
          search={<input aria-label="저장소 검색" placeholder="검색 (⌘K)" />}
        />
      }
      explorer={<Explorer views={VIEWS} sections={SECTIONS} />}
    >
      <WorkspaceFrame>
        <WorkspaceHeader eyebrow="패키지" icon="package" title="react-ui" />
        <WorkspaceSection id="overview" title="개요">
          <p className="typo-body-small">웹 UI 컴포넌트.</p>
        </WorkspaceSection>
      </WorkspaceFrame>
      <Inspector>
        <InspectorSection id="sources" title="소스" count={1}>
          <p className="typo-body-small devhub-code">libs/react-ui/package.json</p>
        </InspectorSection>
      </Inspector>
    </DevHubShell>
  ),
};

/** `lg` 미만은 한 열이다 — 탐색기는 서랍, 작업 영역 다음에 상세 정보가 온다. */
export const NarrowViewport: Story = {
  ...Playground,
  parameters: { viewport: { value: 'mobile' } },
};
