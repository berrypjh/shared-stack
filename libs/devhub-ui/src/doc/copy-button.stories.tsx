import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { CopyButton } from './copy-button';

const meta = {
  title: 'Doc/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    text: 'libs/devhub-ui/src/doc/copy-button.tsx',
    label: '경로 복사',
  },
} satisfies Meta<typeof CopyButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 코드 블록 옆의 실제 쓰임처럼 — `label` 이 무엇을 복사하는지 말한다. */
export const InContext: Story = {
  render: (args) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '8px 12px',
        border: '1px solid var(--ds-stroke-light)',
        borderRadius: 'var(--ds-radius-md)',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
      }}
    >
      <span>{args.text}</span>
      <CopyButton {...args} />
    </div>
  ),
};

/**
 * 결과는 `role="status"` 로 보조 기술에도 알린다. `navigator.clipboard` 는 보안 문맥에서만
 * 되므로 브라우저 권한에 따라 `copied` 대신 `failed` 로 끝날 수 있다 — 둘 다 조용히 지나가지 않는다는 계약만 본다.
 */
export const AnnouncesResult: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '경로 복사' }));
    await waitFor(() => expect(canvas.getByRole('status').textContent).not.toBe(''));
  },
};
