import type { Meta, StoryObj } from '@storybook/react-vite';

import { DocumentColumn, DocumentSection } from './document-layout';

const meta = {
  title: 'Doc/DocumentSection',
  component: DocumentSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    id: 'example-section',
    title: '절 제목',
    children: <p className="typo-paragraph-default">절 본문은 문서 본문과 같은 크기로 읽힌다.</p>,
  },
  argTypes: {
    children: { control: false },
  },
} satisfies Meta<typeof DocumentSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 절이 이어지면 선과 여백만으로 나뉜다 — markdown 문서의 `##` 와 같은 리듬이다. */
export const InColumn: Story = {
  render: (args) => (
    <DocumentColumn>
      <DocumentSection {...args} id="first" title="첫 절" />
      <DocumentSection {...args} id="second" title="둘째 절" />
    </DocumentColumn>
  ),
};
