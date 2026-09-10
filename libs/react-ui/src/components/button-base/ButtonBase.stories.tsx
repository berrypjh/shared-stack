import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ButtonBase } from './ButtonBase';
import type { ButtonBaseNativeButtonProps } from './ButtonBase.types';

const meta = {
  title: 'Components/ButtonBase',
  component: ButtonBase,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Button',
    variant: 'contained',
    size: 'md',
    color: 'primary',
    disabled: false,
    fullWidth: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['contained', 'outlined', 'text'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    onClick: { action: 'clicked' },
    onKeyDown: { action: 'keyDown' },
    onKeyUp: { action: 'keyUp' },
    className: { control: false },
    style: { control: false },
    component: { control: false },
    children: { control: 'text' },
  },
} satisfies Meta<ButtonBaseNativeButtonProps>;

export default meta;

type Story = StoryObj<ButtonBaseNativeButtonProps>;

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '12px',
  alignItems: 'center',
};

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '320px',
};

export const Playground: Story = {
  render: (args) => <ButtonBase {...args} />,
};

export const Default: Story = {
  args: {
    children: 'Save Changes',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={rowStyle}>
      <ButtonBase variant="contained">Contained</ButtonBase>
      <ButtonBase variant="outlined">Outlined</ButtonBase>
      <ButtonBase variant="text">Text</ButtonBase>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={rowStyle}>
      <ButtonBase size="sm">Small</ButtonBase>
      <ButtonBase size="md">Medium</ButtonBase>
      <ButtonBase size="lg">Large</ButtonBase>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <div style={rowStyle}>
        <ButtonBase variant="contained" color="primary">
          Primary
        </ButtonBase>
        <ButtonBase variant="contained" color="secondary">
          Secondary
        </ButtonBase>
      </div>
      <div style={rowStyle}>
        <ButtonBase variant="outlined" color="primary">
          Primary
        </ButtonBase>
        <ButtonBase variant="outlined" color="secondary">
          Secondary
        </ButtonBase>
      </div>
      <div style={rowStyle}>
        <ButtonBase variant="text" color="primary">
          Primary
        </ButtonBase>
        <ButtonBase variant="text" color="secondary">
          Secondary
        </ButtonBase>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={rowStyle}>
      <ButtonBase variant="contained" disabled>
        Contained
      </ButtonBase>
      <ButtonBase variant="outlined" disabled>
        Outlined
      </ButtonBase>
      <ButtonBase variant="text" disabled>
        Text
      </ButtonBase>
    </div>
  ),
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'grid', gap: '12px', width: '400px' }}>
      <ButtonBase fullWidth variant="contained">
        Create Account
      </ButtonBase>
      <ButtonBase fullWidth variant="outlined">
        Sign In
      </ButtonBase>
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <div style={rowStyle}>
      <ButtonBase href="https://example.com" variant="contained">
        Visit Site
      </ButtonBase>
      <ButtonBase href="https://example.com" variant="outlined">
        Documentation
      </ButtonBase>
      <ButtonBase href="https://example.com" variant="text">
        Learn More
      </ButtonBase>
    </div>
  ),
};

export const AsCustomComponent: Story = {
  render: () => (
    <div style={rowStyle}>
      <ButtonBase component="div" variant="contained">
        div element
      </ButtonBase>
      <ButtonBase component="span" variant="outlined">
        span element
      </ButtonBase>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <ButtonBase variant="contained">Subscribe to the weekly newsletter</ButtonBase>
      <ButtonBase variant="outlined">Download the complete annual report</ButtonBase>
      <ButtonBase variant="text">View all available integrations and plugins</ButtonBase>
    </div>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      <ButtonBase aria-label="Save all pending changes">Save</ButtonBase>
      <ButtonBase
        variant="outlined"
        aria-label="Delete selected item"
        aria-describedby="delete-warning"
      >
        Delete
      </ButtonBase>
      <p id="delete-warning" style={{ fontSize: '12px', color: 'var(--ds-text-light)', margin: 0 }}>
        Deleted items cannot be recovered.
      </p>
      {/* 비네이티브 host 는 ButtonBase 가 role="button"·tabIndex·키보드 활성화를 스스로 붙인다. */}
      <ButtonBase component="div" variant="text" aria-label="Custom interactive element">
        Custom Element
      </ButtonBase>
      {/* 네이티브 button 은 `disabled` 만으로 충분하다 — ButtonBase 는 button host 에
          aria-disabled 를 의도적으로 붙이지 않는다. 링크 host 에서만 붙인다. */}
      <ButtonBase disabled>Unavailable</ButtonBase>
    </div>
  ),
  parameters: {
    a11y: { disable: false },
  },
};

/**
 * 호스트마다 키보드 활성화 경로가 다르다는 것을 실제로 눌러서 보인다.
 *
 * - native `<button>` 은 브라우저가 Enter/Space 를 click 으로 바꾼다. ButtonBase 는 **끼어들지
 *   않는다** — 끼어들면 한 번 누른 것이 두 번 활성화된다.
 * - `component="div"` 같은 비네이티브 host 에는 그런 기본 동작이 없어서 ButtonBase 가
 *   Enter(keydown)/Space(keyup) 를 직접 click 으로 바꾼다.
 *
 * 두 경로 모두 "정확히 한 번"이어야 한다. 스크린샷으로는 증명되지 않아 단언으로 고정한다.
 */
export const KeyboardActivation: Story = {
  render: function Render() {
    const onNative = fn();
    const onCustom = fn();

    return (
      <div style={columnStyle}>
        <ButtonBase data-testid="native" onClick={onNative}>
          Native button
        </ButtonBase>
        <ButtonBase component="div" data-testid="custom" onClick={onCustom}>
          Custom host
        </ButtonBase>
        <ButtonBase component="div" disabled data-testid="custom-disabled">
          Custom host (disabled)
        </ButtonBase>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // native: Tab 으로 도달하고 Enter 로 활성화된다.
    await userEvent.tab();
    await expect(canvas.getByTestId('native')).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    // 비네이티브 host 도 같은 탭 순서에 있고 role=button 으로 노출된다.
    await userEvent.tab();
    const custom = canvas.getByTestId('custom');
    await expect(custom).toHaveFocus();
    await expect(custom).toHaveAttribute('role', 'button');
    await userEvent.keyboard(' ');

    // disabled 비네이티브 host 는 aria-disabled 로 알리고 탭 순서에서 빠진다.
    const disabled = canvas.getByTestId('custom-disabled');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('tabindex', '-1');
  },
};

/**
 * 포커스 링은 키보드 경로에서만 켜진다 (`:focus-visible`).
 * `.focus()` 로는 재현되지 않아 Chromatic 이 찍으려면 실제 Tab 이 필요하다.
 */
export const FocusVisible: Story = {
  render: () => (
    <div style={rowStyle}>
      <ButtonBase>Focus me</ButtonBase>
      <ButtonBase variant="outlined">Then me</ButtonBase>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Focus me' })).toHaveFocus();
  },
};
