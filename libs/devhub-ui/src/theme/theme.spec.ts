import { runInNewContext } from 'node:vm';

import {
  applyTheme,
  createThemeScript,
  currentTheme,
  DEFAULT_THEME_PAIR,
  THEME_KEY,
  type ThemePair,
  themeScript,
} from './theme';

const EDITORIAL: ThemePair = { light: 'ivory', dark: 'charcoal' };

const html = () => document.documentElement;

beforeEach(() => {
  delete html().dataset.theme;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('applyTheme', () => {
  it('writes the default pair as data-theme and stores the mode', () => {
    applyTheme('light');
    expect(html().dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');

    applyTheme('dark');
    expect(html().dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('writes the custom pair as data-theme but stores only the logical mode', () => {
    applyTheme('light', EDITORIAL);
    expect(html().dataset.theme).toBe('ivory');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');

    applyTheme('dark', EDITORIAL);
    expect(html().dataset.theme).toBe('charcoal');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('still applies the theme when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    applyTheme('dark', EDITORIAL);
    expect(html().dataset.theme).toBe('charcoal');
  });
});

describe('currentTheme', () => {
  it('reads the default pair back as the logical mode', () => {
    html().dataset.theme = 'dark';
    expect(currentTheme()).toBe('dark');
    html().dataset.theme = 'light';
    expect(currentTheme()).toBe('light');
  });

  it('reads the custom pair back as the logical mode', () => {
    html().dataset.theme = 'charcoal';
    expect(currentTheme(EDITORIAL)).toBe('dark');
    html().dataset.theme = 'ivory';
    expect(currentTheme(EDITORIAL)).toBe('light');
  });

  it('round-trips every mode through applyTheme', () => {
    for (const pair of [DEFAULT_THEME_PAIR, EDITORIAL]) {
      for (const mode of ['light', 'dark'] as const) {
        applyTheme(mode, pair);
        expect(currentTheme(pair)).toBe(mode);
      }
    }
  });
});

/** 가짜 브라우저에서 첫 paint 스크립트를 돌리고 설정된 `data-theme` 을 돌려준다. */
const runScript = (
  script: string,
  {
    stored,
    osDark,
    storageThrows = false,
  }: { stored?: string; osDark: boolean; storageThrows?: boolean },
) => {
  const documentElement = { dataset: {} as Record<string, string> };
  runInNewContext(script, {
    localStorage: {
      getItem: (key: string) => {
        if (storageThrows) throw new Error('blocked');
        return key === THEME_KEY ? (stored ?? null) : null;
      },
    },
    matchMedia: (query: string) => ({
      matches: osDark && query === '(prefers-color-scheme: dark)',
    }),
    document: { documentElement },
  });
  return documentElement.dataset.theme;
};

describe('first-paint script', () => {
  it('keeps the default script on light / dark', () => {
    expect(themeScript).toBe(createThemeScript(DEFAULT_THEME_PAIR));
    expect(runScript(themeScript, { stored: 'dark', osDark: false })).toBe('dark');
    expect(runScript(themeScript, { stored: 'light', osDark: true })).toBe('light');
    expect(runScript(themeScript, { osDark: true })).toBe('dark');
  });

  it('maps the stored mode through the custom pair', () => {
    const script = createThemeScript(EDITORIAL);
    expect(runScript(script, { stored: 'dark', osDark: false })).toBe('charcoal');
    expect(runScript(script, { stored: 'light', osDark: true })).toBe('ivory');
  });

  it('falls back to the OS preference for a missing or unknown stored value', () => {
    const script = createThemeScript(EDITORIAL);
    expect(runScript(script, { osDark: true })).toBe('charcoal');
    expect(runScript(script, { osDark: false })).toBe('ivory');
    // 테마 이름은 저장값이 아니다 — 모르는 값으로 보고 OS 를 따른다.
    expect(runScript(script, { stored: 'charcoal', osDark: false })).toBe('ivory');
    expect(runScript(script, { stored: 'sepia', osDark: true })).toBe('charcoal');
  });

  it('still applies the OS preference when storage is blocked', () => {
    expect(runScript(createThemeScript(EDITORIAL), { osDark: true, storageThrows: true })).toBe(
      'charcoal',
    );
  });

  it('agrees with applyTheme for every stored mode', () => {
    for (const pair of [DEFAULT_THEME_PAIR, EDITORIAL]) {
      for (const mode of ['light', 'dark'] as const) {
        applyTheme(mode, pair);
        expect(runScript(createThemeScript(pair), { stored: mode, osDark: mode === 'light' })).toBe(
          html().dataset.theme,
        );
      }
    }
  });
});
