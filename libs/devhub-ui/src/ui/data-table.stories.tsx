import type { Meta, StoryObj } from '@storybook/react-vite';

import { DataTable } from './data-table';

const ROWS = [
  { path: 'libs/design-tokens', kind: 'foundation' },
  { path: 'libs/ui-core', kind: 'foundation' },
  { path: 'libs/react-ui', kind: 'ui' },
  { path: 'libs/react-native-ui', kind: 'ui' },
];

const meta = {
  title: 'Data Display/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    caption: '패키지',
    headers: ['경로', '종류'],
    children: ROWS.map((row) => (
      <tr key={row.path}>
        <th scope="row" className="font-mono">
          {row.path}
        </th>
        <td>{row.kind}</td>
      </tr>
    )),
  },
  argTypes: {
    children: { control: false },
  },
} satisfies Meta<typeof DataTable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 캡션이 표의 이름, `TableScroll` 의 label 이 스크롤 영역의 이름이다. 행 머리는 호출자가 준다. */
export const Playground: Story = {};

/** 칸이 좁으면 `TableScroll` 이 가로 스크롤 영역이 된다. */
export const NarrowContainer: Story = {
  parameters: { layout: 'centered' },
  render: (args) => (
    <div style={{ width: '280px' }}>
      <DataTable {...args} />
    </div>
  ),
};
