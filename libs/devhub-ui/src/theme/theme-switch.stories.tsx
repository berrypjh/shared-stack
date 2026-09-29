import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { THEME_KEY } from './theme';
import { ThemeSwitch } from './theme-switch';

const meta = {
  title: 'Theme/ThemeSwitch',
  component: ThemeSwitch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ThemeSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 라이트 / 다크. 고른 값은 `<html data-theme>` 로 즉시 반영된다 — Storybook 툴바의 Theme 과는 별개다. */
export const Playground: Story = {};

/** 누르면 `<html data-theme>` 가 바뀌고, 다시 그리면(`useSyncExternalStore`) 눌린 쪽이 바뀐다. */
export const TogglesDocumentTheme: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dark = canvas.getByRole('button', { name: '다크' });
    await userEvent.click(dark);
    await expect(document.documentElement.dataset.theme).toBe('dark');
    await expect(dark).toHaveAttribute('aria-pressed', 'true');

    const light = canvas.getByRole('button', { name: '라이트' });
    await userEvent.click(light);
    await expect(document.documentElement.dataset.theme).toBe('light');
  },
};

/**
 * 앱이 `themePair` 를 넘기면 같은 두 선택지가 다른 토큰 테마를 켠다. 저장되는 것은 여전히 모드(`dark`)다.
 * 툴바 Theme 은 기본 짝(`light` · `dark`)을 그대로 쓴다.
 */
export const CustomThemePair: Story = {
  args: { themePair: { light: 'ivory', dark: 'charcoal' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dark = canvas.getByRole('button', { name: '다크' });
    await userEvent.click(dark);
    await expect(document.documentElement.dataset.theme).toBe('charcoal');
    await expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    await expect(dark).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(canvas.getByRole('button', { name: '라이트' }));
    await expect(document.documentElement.dataset.theme).toBe('ivory');
    await expect(localStorage.getItem(THEME_KEY)).toBe('light');
  },
};
