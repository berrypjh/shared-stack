import { List, ListItem } from '@berrypjh/react-ui';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { ExplorerDrawerProvider, ExplorerPane, ExplorerToggle } from './explorer-drawer';

/**
 * `lg` 미만 탐색기 서랍. `ExplorerToggle` 은 `lg:hidden` 이라 이 이야기는 좁은 뷰포트에서 봐야 뜻이 있다
 * — Storybook 뷰포트 도구를 `Mobile` 로 두고 연다. `lg` 부터는 버튼이 사라지고 칸이 늘 보인다(펼침 상태).
 */
const meta = {
  title: 'Shell/ExplorerDrawer',
  component: ExplorerToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { value: 'mobile' },
  },
} satisfies Meta<typeof ExplorerToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

const Demo = () => (
  <ExplorerDrawerProvider>
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px',
        borderBottom: '1px solid var(--ds-stroke-light)',
      }}
    >
      <ExplorerToggle />
      <strong className="typo-body-medium-strong">DevHub</strong>
    </header>
    <ExplorerPane>
      <nav aria-label="저장소 항목" style={{ padding: '16px' }}>
        <List className="flex flex-col gap-2xs">
          {['개요', '아키텍처', '패키지'].map((label) => (
            <ListItem key={label}>
              <a href={`/${label}`} className="typo-body-small">
                {label}
              </a>
            </ListItem>
          ))}
        </List>
      </nav>
    </ExplorerPane>
    <main style={{ padding: '16px' }}>본문 자리.</main>
  </ExplorerDrawerProvider>
);

export const Closed: Story = {
  render: () => <Demo />,
};

/** 메뉴 버튼을 누르면 왼쪽에서 들어온다. 모달이 아니라 펼침(disclosure)이다 — 포커스를 가두지 않는다. */
export const Opened: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '탐색기' }));
    await waitFor(() =>
      expect(canvas.getByRole('navigation', { name: '저장소 항목' })).toBeVisible(),
    );
  },
};

/** Escape 로 닫히고 포커스가 메뉴 버튼으로 돌아온다. */
export const ClosesOnEscape: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: '탐색기' });
    await userEvent.click(toggle);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(toggle).toHaveFocus());
  },
};
