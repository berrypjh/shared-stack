import type { Meta, StoryObj } from '@storybook/react-vite';

import { Explorer, type ExplorerSection, type ExplorerView } from './explorer';
import { ExplorerDrawerProvider } from './explorer-drawer';

const VIEWS: ExplorerView[] = [
  { id: 'overview', label: '개요', href: '/', icon: 'home' },
  { id: 'architecture', label: '아키텍처', href: '/architecture', icon: 'architecture' },
];

const SECTIONS: ExplorerSection[] = [
  {
    id: 'journeys',
    title: '소비 흐름',
    href: '/journeys',
    icon: 'flow',
    groups: [
      {
        items: [
          { id: 'web-consumer', label: '웹 소비자', href: '/journeys/web-consumer' },
          { id: 'consumer-eval', label: '소비자 평가', href: '/journeys/consumer-eval' },
        ],
      },
    ],
  },
  {
    id: 'packages',
    title: '패키지',
    href: '/packages',
    icon: 'package',
    groups: [
      {
        title: 'foundation',
        items: [
          {
            id: 'design-tokens',
            label: 'design-tokens',
            href: '/packages/design-tokens',
            code: true,
          },
          { id: 'ui-core', label: 'ui-core', href: '/packages/ui-core', code: true },
        ],
      },
      {
        title: 'ui',
        collapsed: true,
        items: [{ id: 'react-ui', label: 'react-ui', href: '/packages/react-ui', code: true }],
      },
    ],
  },
  {
    id: 'documents',
    title: '문서',
    href: '/documents',
    icon: 'document',
    groups: [
      {
        title: '프로젝트 지침',
        items: [{ id: 'agents', label: 'AGENTS.md', href: '/documents/agents' }],
      },
    ],
  },
];

const meta = {
  title: 'Shell/Explorer',
  component: Explorer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    router: { pathname: '/packages/react-ui' },
  },
  args: {
    views: VIEWS,
    sections: SECTIONS,
  },
  argTypes: {
    views: { control: false },
    sections: { control: false },
  },
  decorators: [
    (Story) => (
      <ExplorerDrawerProvider>
        <div style={{ height: '600px', width: '320px' }}>
          <Story />
        </div>
      </ExplorerDrawerProvider>
    ),
  ],
} satisfies Meta<typeof Explorer>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 왼쪽 칸: 섹션 없는 보기, 그 아래 카탈로그 섹션과 항목. 현재 주소(`/packages/react-ui`)가
 * `react-ui` 항목과 그 섹션을 `aria-current` 로 표시한다. 여러 묶음이 있는 섹션(패키지)에는
 * 모두 열기 · 닫기 토글이 붙는다.
 */
export const Playground: Story = {};

/** 문서처럼 항목이 많은 섹션은 묶음이 접힌 채로 시작한다(`collapsed`). */
export const CollapsedGroup: Story = {
  parameters: { router: { pathname: '/' } },
};
