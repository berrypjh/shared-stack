import type { Meta, StoryObj } from '@storybook/react-vite';

import { Empty, InspectorSection } from './inspector-section';

const meta = {
  title: 'Entity/InspectorSection',
  component: InspectorSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    id: 'sources',
    title: '소스',
    count: 3,
    children: <p className="typo-body-small">근거 목록이 여기 온다.</p>,
  },
  argTypes: {
    children: { control: false },
  },
} satisfies Meta<typeof InspectorSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** `id` 는 목차 링크의 대상이라 포커스를 받는다 — `#sources` 로 오면 이 섹션이 포커스된다. */
export const Playground: Story = {};

export const WithoutCount: Story = {
  args: { count: undefined },
};

/** 근거가 없을 때. 이유를 늘 말한다 — 빈 목록을 그냥 두지 않는다. */
export const EmptySection: Story = {
  args: {
    id: 'tests',
    title: '테스트',
    children: <Empty reason="이 패키지는 설정 파일이라 실행 가능한 테스트가 없다" />,
  },
};

/** 여러 섹션이 이어질 때 — 상세 정보 칸(Inspector)에서 실제로 쓰이는 모양. */
export const Stacked: Story = {
  render: () => (
    <div>
      <InspectorSection id="sources-2" title="소스" count={2}>
        <p className="typo-body-small">libs/devhub-ui/src/entity/inspector-section.tsx</p>
      </InspectorSection>
      <InspectorSection id="tests-2" title="테스트">
        <Empty reason="아직 실행되지 않았다" />
      </InspectorSection>
    </div>
  ),
};
