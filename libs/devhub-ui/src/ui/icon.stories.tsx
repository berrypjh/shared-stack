import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon, type IconName } from './icon';

/** `IconName` 전체. 새 이름을 더하면 `Record<IconName, 0>` 검사가 여기도 고치라고 막는다. */
const NAMES: IconName[] = Object.keys({
  menu: 0,
  close: 0,
  home: 0,
  search: 0,
  flow: 0,
  scenario: 0,
  architecture: 0,
  application: 0,
  library: 0,
  package: 0,
  plugin: 0,
  engineering: 0,
  document: 0,
  record: 0,
  overview: 0,
  source: 0,
  test: 0,
  api: 0,
  related: 0,
  runtime: 0,
  owner: 0,
  contract: 0,
  outgoing: 0,
  incoming: 0,
  globe: 0,
  help: 0,
  hash: 0,
  warning: 0,
  check: 0,
  copy: 0,
  link: 0,
  external: 0,
  editor: 0,
  calendar: 0,
  commit: 0,
  branch: 0,
  'chevron-left': 0,
  'chevron-right': 0,
  unfold: 0,
  fold: 0,
  minus: 0,
  plus: 0,
  fit: 0,
  expand: 0,
  sun: 0,
  moon: 0,
  brand: 0,
} satisfies Record<IconName, 0>) as IconName[];

const meta = {
  title: 'Icon/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    name: 'home',
  },
  argTypes: {
    name: { control: 'select', options: NAMES },
    className: { control: false },
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * 세트 전체를 한 번에. 새 이름을 더했는데 여기 없으면 `NAMES` 목록을 함께 고친다 —
 * `IconName` 의 타입 검사가 목록이 실제 세트와 같은지는 보장하지 않는다(초과분만 컴파일 오류가 된다).
 */
export const AllIcons: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
        gap: '16px',
      }}
    >
      {NAMES.map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            border: '1px solid var(--ds-stroke-light)',
            borderRadius: 'var(--ds-radius-md)',
          }}
        >
          <Icon name={name} />
          <span style={{ fontSize: '11px', color: 'var(--ds-text-light)', wordBreak: 'break-all' }}>
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
};

/** 장식이라 `aria-hidden` 이다 — 뜻은 옆 글자나 접근 이름이 전한다는 계약을 보여준다. */
export const DecorativeOnly: Story = {
  render: () => (
    <button
      type="button"
      aria-label="탐색기"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
    >
      <Icon name="menu" />
      <span>버튼의 접근 이름은 `aria-label`이 준다</span>
    </button>
  ),
};
