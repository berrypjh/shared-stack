import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(PKG_ROOT, 'package.json'));

const readPkg = async () =>
  JSON.parse(await fs.readFile(path.join(PKG_ROOT, 'package.json'), 'utf8'));

const resolve = (subpath: string): string => {
  try {
    return path.relative(PKG_ROOT, require.resolve(subpath));
  } catch (e) {
    return (e as NodeJS.ErrnoException).code ?? 'ERROR';
  }
};

describe('public subpaths', () => {
  it.each([
    ['@berrypjh/design-tokens', 'dist/index.js'],
    ['@berrypjh/design-tokens/web', 'dist/web.js'],
    ['@berrypjh/design-tokens/rn', 'dist/rn.js'],
    ['@berrypjh/design-tokens/tailwind', 'dist/tailwind.js'],
    ['@berrypjh/design-tokens/tokens', 'dist/tokens.json'],
  ])('resolves %s', (subpath, target) => {
    expect(resolve(subpath)).toBe(target);
  });
});

describe('internal modules are not reachable', () => {
  it.each([
    '@berrypjh/design-tokens/dist/lib/sd.js',
    '@berrypjh/design-tokens/dist/lib/genCss.js',
    '@berrypjh/design-tokens/src/lib/sd.ts',
    '@berrypjh/design-tokens/dist/index.js',
  ])('blocks %s', (subpath) => {
    expect(resolve(subpath)).toBe('ERR_PACKAGE_PATH_NOT_EXPORTED');
  });

  it('exposes no wildcard subpath', async () => {
    const { exports } = await readPkg();
    for (const key of Object.keys(exports)) expect(key).not.toContain('*');
  });
});

describe('publish configuration', () => {
  /**
   * 직접 publish하지 않고 react-ui / react-native-ui 빌드 시 d.ts와 CSS로 번들되어
   * 다운스트림에 전달된다.
   */
  it('stays private — downstream gets tokens through react-ui / react-native-ui', async () => {
    expect((await readPkg()).private).toBe(true);
  });

  it('ships only dist', async () => {
    expect((await readPkg()).files).toEqual(['dist']);
  });

  it('ships no runtime dependency — Style Dictionary is build-time only', async () => {
    const pkg = await readPkg();
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.peerDependencies).toBeUndefined();
  });

  it('keeps the css side-effect declaration', async () => {
    expect((await readPkg()).sideEffects).toEqual(['./dist/css/variables.css']);
  });
});

describe('published entries stay free of style dictionary', () => {
  // SD 는 빌드 도구다. dist 로 나가는 진입점 어디에도 남으면 안 된다.
  it.each(['dist/index.js', 'dist/web.js', 'dist/rn.js', 'dist/tailwind.js'])(
    '%s does not reference style-dictionary',
    async (rel) => {
      expect(await fs.readFile(path.join(PKG_ROOT, rel), 'utf8')).not.toContain('style-dictionary');
    },
  );
});

describe('downstream propagation', () => {
  const WORKSPACE = path.resolve(PKG_ROOT, '../..');
  const json = async (rel: string) =>
    JSON.parse(await fs.readFile(path.join(WORKSPACE, rel), 'utf8'));

  /** 프로젝트의 모든 target에 걸친 run-commands 목록. */
  const allCommands = async (rel: string): Promise<string[]> => {
    const project = await json(rel);
    return Object.values(
      project.targets as Record<string, { options?: { commands?: string[] } }>,
    ).flatMap((t) => t.options?.commands ?? []);
  };

  it('copies the token catalog from design-tokens into ui-core', async () => {
    expect(await allCommands('libs/ui-core/project.json')).toContain(
      'cp libs/design-tokens/dist/tokens.json libs/ui-core/dist/tokens.json',
    );
  });

  it.each([
    ['libs/react-ui/project.json', 'react-ui'],
    ['libs/react-native-ui/project.json', 'react-native-ui'],
  ])('copies the token catalog from ui-core into %s', async (project, pkg) => {
    expect(await allCommands(project)).toContain(
      `cp libs/ui-core/dist/tokens.json libs/${pkg}/dist/tokens.json`,
    );
  });

  it('keeps the existing ./tokens subpath untouched', async () => {
    for (const pkg of ['libs/react-ui/package.json', 'libs/react-native-ui/package.json']) {
      expect((await json(pkg)).exports['./tokens']).toBe('./dist/tokens.json');
    }
  });

  it('copies rather than regenerating, so there is one source of truth', async () => {
    const commands = [
      ...(await allCommands('libs/ui-core/project.json')),
      ...(await allCommands('libs/react-ui/project.json')),
      ...(await allCommands('libs/react-native-ui/project.json')),
    ];
    // tokens.json을 만드는 곳은 design-tokens 빌드 하나뿐이다.
    expect(
      commands.filter((c) => c.includes('tokens.json')).every((c) => c.startsWith('cp ')),
    ).toBe(true);
  });
});
