import { useState } from 'react';

import { themes } from '@berrypjh/ui-core';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { ThemeProvider } from '../../theme';

import { Popover } from './Popover';
import { PopoverPanel } from './PopoverPanel';
import { PopoverTrigger } from './PopoverTrigger';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    defaultOpen: false,
    semantics: 'disclosure',
    children: null,
  },
  argTypes: {
    defaultOpen: { control: 'boolean' },
    semantics: { control: 'inline-radio', options: ['disclosure', 'dialog'] },
    open: { control: false },
    onOpenChange: { action: 'open-changed' },
    children: { control: false },
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 위치는 컨슈머 소유다 — Popover 는 positioning 을 하지 않는다.
 * 스토리는 relative 래퍼 + absolute 패널이라는 가장 단순한 배치를 쓴다.
 */
const wrapperStyle = {
  position: 'relative' as const,
  display: 'inline-block',
};

const panelStyle = {
  position: 'absolute' as const,
  insetBlockStart: '100%',
  insetInlineStart: 0,
  marginBlockStart: '4px',
  minInlineSize: '240px',
};

/** 기본 시맨틱. 패널에 role 이 없고 트리거는 `aria-expanded` 만 갖는다. */
export const Default: Story = {
  render: () => (
    <div style={wrapperStyle}>
      <Popover>
        <PopoverTrigger>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverPanel style={panelStyle}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <strong>Popover</strong>
            <span>설명을 노출하는 비모달 surface입니다.</span>
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <div style={wrapperStyle}>
      <Popover {...args}>
        <PopoverTrigger>
          <button type="button">Open Popover</button>
        </PopoverTrigger>
        <PopoverPanel style={panelStyle}>
          Escape 또는 바깥 클릭으로 닫힙니다. Tab 은 가두지 않습니다.
        </PopoverPanel>
      </Popover>
    </div>
  ),
};

/**
 * `semantics="dialog"` 는 트리거의 `aria-haspopup` 과 패널의 `role` 을 함께 올리고
 * 열릴 때 포커스를 패널 안으로 옮긴다. **접근 가능한 이름이 필수다.**
 */
export const DialogSemantics: Story = {
  parameters: {
    /*
     * `aria-valid-attr-value` 를 이 스토리에서만 끈다.
     *
     * axe 는 `aria-haspopup` 이 있으면 `aria-controls` 가 가리키는 id 를 **아예 검사하지
     * 않고** incomplete("수동 확인 필요")로 넘긴다 — 팝업이 나중에 DOM 에 붙는 구현이 흔해서
     * 참조가 유효한지 판단할 수 없다는 이유다. 조건은 두 속성이 함께 있는 것뿐이고 id 가
     * 실제로 존재하는지는 보지 않으므로, 마크업을 고쳐서 없앨 수 있는 결과가 아니다.
     * (axe-core 4.11 `ariaValidAttrValueEvaluate` 의 `aria-controls` preCheck.)
     *
     * 그 참조가 실제로 맞는지는 여기 말고 결정적인 검사가 이미 본다:
     * - `aria-controls` → panel id 일치: `Popover.test.tsx` 의 'aria-controls 가 같은
     *   인스턴스의 panel id 를 가리켜야 한다'
     * - `aria-labelledby` → 존재하는 id: `components/stories.aria.test.ts` 가 스토리 소스를
     *   정적으로 훑는다
     * - `aria-haspopup` 값: `Popover.test.tsx` 의 semantics 검사
     *
     * CI 게이트에는 영향이 없었다 — `checkA11y` 는 violations 만 보고 incomplete 는 읽지
     * 않는다. 이 설정은 Storybook a11y 패널의 잡음을 줄이는 것이 목적이다.
     */
    a11y: { options: { rules: { 'aria-valid-attr-value': { enabled: false } } } },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover semantics="dialog">
        <PopoverTrigger>
          <button type="button">Edit name</button>
        </PopoverTrigger>
        <PopoverPanel aria-labelledby="popover-dialog-title" style={panelStyle}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <strong id="popover-dialog-title">Edit name</strong>
            <label htmlFor="popover-dialog-input">Display name</label>
            <input id="popover-dialog-input" type="text" defaultValue="Berry" />
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Edit name' });

    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

    await userEvent.click(trigger);

    // dialog 는 패널 안 첫 포커스 가능 요소로 진입한다. 진입은 passive effect 에서 일어나고
    // 실제 브라우저는 그것을 paint 뒤로 미룬다 — jsdom 은 동기 flush 라 이 차이가 안 보인다.
    await waitFor(() => expect(canvas.getByLabelText('Display name')).toHaveFocus());
    await expect(canvas.getByRole('dialog', { name: 'Edit name' })).toBeInTheDocument();
  },
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={wrapperStyle}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
              <button type="button">{open ? 'Close' : 'Open'}</button>
            </PopoverTrigger>
            <PopoverPanel style={panelStyle}>controlled mode (open={String(open)})</PopoverPanel>
          </Popover>
        </div>
        <button type="button" onClick={() => setOpen((prev) => !prev)}>
          외부 토글
        </button>
      </div>
    );
  },
};

/** 패널 안의 상호작용은 닫지 않는다. Tab 은 자연스러운 DOM 순서로 흐른다. */
export const InteractiveContent: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={wrapperStyle}>
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Filters</button>
          </PopoverTrigger>
          <PopoverPanel style={panelStyle}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="popover-filter-query">Query</label>
              <input id="popover-filter-query" type="text" />
              <button type="button">Apply</button>
            </div>
          </PopoverPanel>
        </Popover>
      </div>
      <button type="button">패널 밖 컨트롤</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));

    // 내부 클릭으로는 닫히지 않는다.
    await expect(canvas.getByLabelText('Query')).toBeInTheDocument();
  },
};

/** Escape 로 닫으면 포커스가 트리거로 돌아온다. */
export const EscapeRestoresFocus: Story = {
  render: () => (
    <div style={wrapperStyle}>
      <Popover semantics="dialog">
        <PopoverTrigger>
          <button type="button">Open dialog</button>
        </PopoverTrigger>
        <PopoverPanel aria-label="Escape demo" style={panelStyle}>
          <button type="button">패널 안 버튼</button>
        </PopoverPanel>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Open dialog' });

    await userEvent.click(trigger);
    await waitFor(() => expect(canvas.getByRole('button', { name: '패널 안 버튼' })).toHaveFocus());

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
  },
};

/** 바깥 컨트롤을 클릭해 닫으면 포커스를 빼앗지 않는다 — 사용자가 고른 곳에 남는다. */
export const OutsideDismissKeepsFocus: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={wrapperStyle}>
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel style={panelStyle}>바깥 버튼을 눌러 보세요.</PopoverPanel>
        </Popover>
      </div>
      <button type="button">바깥 버튼</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const outside = canvas.getByRole('button', { name: '바깥 버튼' });

    await userEvent.click(outside);

    await expect(outside).toHaveFocus();
  },
};

export const LongContent: Story = {
  render: () => (
    <div style={wrapperStyle}>
      <Popover>
        <PopoverTrigger>
          <button type="button">Open long panel</button>
        </PopoverTrigger>
        <PopoverPanel style={{ ...panelStyle, maxInlineSize: '320px' }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse pretium tempor sapien
          eget volutpat. Phasellus tincidunt eros eu erat fermentum, sed scelerisque purus
          sollicitudin.
        </PopoverPanel>
      </Popover>
    </div>
  ),
};

/**
 * 중첩. 한 번의 Escape 는 **안쪽만** 닫는다 — 바깥은 그대로 남는다.
 */
export const Nested: Story = {
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger>
          <button type="button">Outer</button>
        </PopoverTrigger>
        <PopoverPanel style={panelStyle}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <span>바깥 패널</span>
            <div style={wrapperStyle}>
              <Popover defaultOpen>
                <PopoverTrigger>
                  <button type="button">Inner</button>
                </PopoverTrigger>
                <PopoverPanel style={panelStyle}>안쪽 패널</PopoverPanel>
              </Popover>
            </div>
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 포커스를 명시적으로 세운다. 주변 포커스 상태에 기대면 브라우저와 jsdom 에서 결과가
    // 갈린다. 중첩에서 가장 흔한 위치는 방금 누른 안쪽 트리거다.
    const inner = canvas.getByRole('button', { name: 'Inner' });
    inner.focus();
    await expect(inner).toHaveFocus();

    /**
     * Escape 가 실제로 어디로 갔는지 기록한다.
     *
     * 이 스토리는 jsdom 에서는 통과하면서 Chromium 에서만 실패한 이력이 있다. 그때 실패
     * 메시지는 "패널이 남아 있다" 뿐이라 원인을 좁힐 수 없었다. capture/bubble 양쪽을 찍어
     * 두면 **어느 단계에서 끊겼는지**가 메시지에 그대로 나온다:
     * capture 만 있으면 우리 핸들러가 전파를 끊은 것이고(정상), 둘 다 있으면 핸들러가 아예
     * 불리지 않은 것이며, 둘 다 없으면 키 이벤트가 이 문서로 오지도 않은 것이다.
     */
    const path: string[] = [];
    const probe = (event: Event) => {
      const target = event.target as HTMLElement | null;
      path.push(`${event.eventPhase === 1 ? 'capture' : 'bubble'}:${target?.tagName}`);
    };
    document.addEventListener('keydown', probe, true);
    document.addEventListener('keydown', probe);

    await userEvent.keyboard('{Escape}');

    document.removeEventListener('keydown', probe, true);
    document.removeEventListener('keydown', probe);

    // 닫힘은 React 재렌더 뒤에 보인다. 브라우저에서는 그 재렌더가 await 뒤로 밀릴 수 있다.
    try {
      await waitFor(() => expect(canvas.queryByText('안쪽 패널')).not.toBeInTheDocument());
    } catch {
      const active = document.activeElement as HTMLElement | null;
      throw new Error(
        [
          '안쪽 패널이 Escape 로 닫히지 않았다.',
          `keydown 경로=${JSON.stringify(path)}`,
          `activeElement=${active?.tagName}:${active?.textContent?.slice(0, 12) ?? ''}`,
          `열린 패널=${canvasElement.querySelectorAll('.ui-popover-panel').length}`,
        ].join(' '),
      );
    }

    await expect(canvas.getByText('바깥 패널')).toBeInTheDocument();
  },
};

const themeLabel = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

export const ThemeGallery: Story = {
  parameters: {
    layout: 'fullscreen',
    disableThemeDecorator: true,
  },
  render: () => (
    <div style={{ display: 'grid', gap: '20px', padding: '24px' }}>
      {themes.map(({ name }) => (
        <ThemeProvider key={name} mode={name}>
          <div
            style={{
              display: 'grid',
              gap: '12px',
              padding: '16px',
              borderRadius: 'var(--ds-radius-md)',
              background: 'var(--ds-background-default)',
              color: 'var(--ds-text-default)',
            }}
          >
            <strong>{themeLabel(name)}</strong>
            <Popover defaultOpen>
              <PopoverTrigger>
                <button type="button">{themeLabel(name)} trigger</button>
              </PopoverTrigger>
              <PopoverPanel>surface · stroke · shadow 토큰이 테마를 따라갑니다.</PopoverPanel>
            </Popover>
          </div>
        </ThemeProvider>
      ))}
    </div>
  ),
};
