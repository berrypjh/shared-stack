import type { ThemeName } from '@berrypjh/react-ui';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CONTRAST_CHECKS } from '../verification/contrast';
import type { ProbeValues } from '../verification/useProbes';

import { VerifyPage } from './VerifyPage';

/**
 * 접근성 표가 **현재 테마의** probe 값으로 재는지.
 * jsdom 은 토큰 CSS 를 계산하지 못하므로 probe 값을 테마 이름 키로 주입한다 — 실제 `useProbeValues` 와 같은 모양이다.
 * 한때 표가 없는 키(`default`)를 읽어 브라우저에서 모든 줄이 값 없이 미달이었다.
 */
const probe = vi.hoisted(() => ({ theme: 'light' as string, values: {} as ProbeValues }));

vi.mock('../verification/useProbes', async (importActual) => ({
  ...(await importActual<typeof import('../verification/useProbes')>()),
  useProbeValues: () => probe.values,
}));
vi.mock('../verification/useCurrentTheme', () => ({
  useCurrentTheme: () => probe.theme as ThemeName,
}));

/** 모든 조합의 전경을 `fg`, 배경을 흰색으로 둔 한 테마의 값. */
const themeValues = (fg: string) =>
  Object.fromEntries(
    CONTRAST_CHECKS.flatMap((c) => [
      [c.fg, fg],
      [c.bg, '#ffffff'],
    ]),
  );

const bodyRow = () => screen.getByTestId('contrast-본문 텍스트').textContent ?? '';

const renderAt = (theme: string) => {
  probe.theme = theme;
  render(
    <MemoryRouter>
      <VerifyPage />
    </MemoryRouter>,
  );
};

describe('Runtime 접근성 표의 측정 대상', () => {
  beforeEach(() => {
    probe.values = { light: themeValues('#000000'), dark: themeValues('#999999') };
  });

  it('현재 테마의 값으로 대비를 잰다', () => {
    renderAt('light');
    expect(bodyRow()).toContain('21.00:1');
    expect(bodyRow()).toContain('통과');
  });

  it('테마가 바뀌면 그 테마의 값으로 다시 잰다', () => {
    renderAt('dark');
    expect(bodyRow()).toContain('2.85:1');
    expect(bodyRow()).toContain('미달');
  });
});
