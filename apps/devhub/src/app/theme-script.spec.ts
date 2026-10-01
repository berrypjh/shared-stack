// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { THEME_KEY, themeScript } from '@berrypjh/devhub-ui';

/** `index.html` 의 첫 paint 전 스크립트(모듈이 아닌 인라인 `<script>`). */
const headScript = () => {
  const html = readFileSync(join(import.meta.dirname, '../../index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('index.html 에 인라인 테마 스크립트가 없다');
  return script;
};

type Env = { stored?: string; osDark: boolean; storageThrows?: boolean };

/** 가짜 브라우저에서 스크립트를 돌리고 설정된 `data-theme` 을 돌려준다. */
const run = ({ stored, osDark, storageThrows = false }: Env, script = headScript()) => {
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

describe('first-paint theme script', () => {
  it('uses the stored mode over the OS preference', () => {
    expect(run({ stored: 'dark', osDark: false })).toBe('dark');
    expect(run({ stored: 'light', osDark: true })).toBe('light');
  });

  it('follows the OS preference without a valid stored mode', () => {
    expect(run({ osDark: true })).toBe('dark');
    expect(run({ osDark: false })).toBe('light');
    expect(run({ stored: 'sepia', osDark: true })).toBe('dark');
    expect(run({ stored: 'sepia', osDark: false })).toBe('light');
  });

  it('still applies the OS preference when storage is blocked', () => {
    expect(run({ osDark: true, storageThrows: true })).toBe('dark');
    expect(run({ osDark: false, storageThrows: true })).toBe('light');
  });

  /** 인라인 사본이 devhub-ui 의 `themeScript`(런타임 `ThemeSwitch` 와 같은 기본 짝)와 갈라지지 않게, 모든 입력에서 대조한다. */
  it('matches the devhub-ui themeScript for every input', () => {
    const runtime = themeScript;
    for (const stored of [undefined, 'light', 'dark', 'sepia', 'charcoal']) {
      for (const osDark of [false, true]) {
        for (const storageThrows of [false, true]) {
          const env = { stored, osDark, storageThrows };
          expect(run(env)).toBe(run(env, runtime));
        }
      }
    }
  });
});
