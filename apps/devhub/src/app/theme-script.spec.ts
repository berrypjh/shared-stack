// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { THEME_KEY } from '@berrypjh/devhub-ui';

/** `index.html` 의 첫 paint 전 스크립트(모듈이 아닌 인라인 `<script>`). */
const headScript = () => {
  const html = readFileSync(join(import.meta.dirname, '../../index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('index.html 에 인라인 테마 스크립트가 없다');
  return script;
};

/** 가짜 브라우저에서 스크립트를 돌리고 설정된 `data-theme` 을 돌려준다. */
const run = ({
  stored,
  osDark,
  storageThrows = false,
}: {
  stored?: string;
  osDark: boolean;
  storageThrows?: boolean;
}) => {
  const documentElement = { dataset: {} as Record<string, string> };
  runInNewContext(headScript(), {
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
  it('uses the stored choice over the OS preference, with the app key', () => {
    expect(run({ stored: 'dark', osDark: false })).toBe('dark');
    expect(run({ stored: 'light', osDark: true })).toBe('light');
  });

  it('follows the OS preference without a valid stored choice', () => {
    expect(run({ osDark: true })).toBe('dark');
    expect(run({ osDark: false })).toBe('light');
    expect(run({ stored: 'sepia', osDark: true })).toBe('dark');
  });

  it('still applies the OS preference when storage is blocked', () => {
    expect(run({ osDark: true, storageThrows: true })).toBe('dark');
  });
});
