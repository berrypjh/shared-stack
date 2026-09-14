import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import { REPO_ROOT, TARGETS } from '../scripts/generate-consumer-catalog/config';

/**
 * 패키지에 동봉되는 CLI를 실제 번들로 실행한다.
 * `pnpm build:libs`로 만들어진 `dist/cli.mjs`가 대상이라, 배포되는 것과 같은 파일이다.
 */

const run = promisify(execFile);

const PACKAGES = [
  ['react-ui', '@berrypjh/react-ui', 'Button'],
  ['react-native-ui', '@berrypjh/react-native-ui', 'Box'],
] as const;

const cliPath = (target: string) =>
  path.join(REPO_ROOT, TARGETS[target].packageRoot, 'dist/cli.mjs');

const cli = async (target: string, args: string[]) => {
  const { stdout } = await run('node', [cliPath(target), ...args], { cwd: REPO_ROOT });
  return JSON.parse(stdout);
};

const manifest = async (target: string) =>
  JSON.parse(
    await fs.readFile(path.join(REPO_ROOT, TARGETS[target].packageRoot, 'package.json'), 'utf8'),
  ) as { bin: Record<string, string>; exports: Record<string, unknown>; files: string[] };

describe.each(PACKAGES)('%s shipped CLI', (target, pkg, component) => {
  it('is bundled into dist and declared as a bin', async () => {
    const pkgJson = await manifest(target);
    // bin이 정확히 하나면 npm은 이름과 무관하게 그것을 실행한다 (libnpmexec).
    // 그래서 `react-ui` 같은 일반적인 이름 대신 충돌 없는 이름을 쓴다.
    expect(Object.values(pkgJson.bin)).toEqual(['./dist/cli.mjs']);
    expect(Object.keys(pkgJson.bin)).toHaveLength(1);
    expect(Object.keys(pkgJson.bin)[0]).toMatch(/^berry-/);
    // files: ["dist"]이므로 bin이 tarball에 포함된다.
    expect(pkgJson.files).toContain('dist');
    await expect(fs.access(cliPath(target))).resolves.toBeUndefined();
  });

  it('carries no repository absolute path', async () => {
    const bundle = await fs.readFile(cliPath(target), 'utf8');
    expect(bundle).not.toContain(REPO_ROOT);
    expect(bundle.startsWith('#!/usr/bin/env node')).toBe(true);
  });

  it('describes the package offline', async () => {
    const summary = await cli(target, ['summary']);
    expect(summary.package).toBe(pkg);
    expect(summary.components).toContain(component);
  });

  it('returns an exact prop contract', async () => {
    const api = await cli(target, ['api', component]);
    expect(api).toMatchObject({ status: 'ok', package: pkg, kind: 'component' });
    expect(Object.keys(api.props).length).toBeGreaterThan(0);
  });

  it('returns only prop names at signature detail', async () => {
    const api = await cli(target, ['api', component, '--signature']);
    expect(api.props).toBeUndefined();
    expect(api.propNames.length).toBeGreaterThan(0);
  });

  it('finds symbols and honours a limit', async () => {
    const found = await cli(target, ['find', component, '--limit=2']);
    expect(found.hits[0].symbol).toBe(component);
    expect(found.hits.length).toBeLessThanOrEqual(2);
  });

  it('looks up an exact token', async () => {
    const result = await cli(target, ['token', 'color.primary.pr500']);
    expect(result.mode).toBe('exact');
    expect(result.matches[0].cssVar).toBe('--ds-primary-pr500');
  });

  it('reports not-found instead of inventing a symbol', async () => {
    const api = await cli(target, ['api', 'DataGrid']);
    expect(api).toMatchObject({ status: 'not-found', suggestions: [] });
  });

  it('exits non-zero with usage on an unknown command', async () => {
    await expect(run('node', [cliPath(target), 'nope'], { cwd: REPO_ROOT })).rejects.toMatchObject({
      code: 1,
    });
  });

  it('exposes the agent-facing files as resolvable export subpaths', async () => {
    const { exports: map } = await manifest(target);
    for (const [subpath, file] of [
      ['./agents', 'dist/AGENTS.md'],
      ['./catalog', 'dist/llm-catalog.json'],
      ['./tokens', 'dist/tokens.json'],
    ]) {
      expect(map[subpath]).toBe(`./${file}`);
      await expect(
        fs.access(path.join(REPO_ROOT, TARGETS[target].packageRoot, file)),
      ).resolves.toBeUndefined();
    }
  });
});

describe('README advertises the agent surface', () => {
  it.each(PACKAGES)('%s', async (target, pkg) => {
    const readme = await fs.readFile(
      path.join(REPO_ROOT, TARGETS[target].packageRoot, 'README.md'),
      'utf8',
    );
    expect(readme).toContain('AI 에이전트용');
    expect(readme).toContain('llm-catalog.json');
    expect(readme).toContain(`npx ${pkg} api`);
  });
});
