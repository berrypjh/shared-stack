import fs from 'node:fs/promises';
import path from 'node:path';

import type { PlatformInput } from '../../../consumer-retrieval/platform';

import { fromRepoRoot } from './paths';

/**
 * fixture consumer project에서 관측 가능한 근거만 모은다.
 * platform resolver는 이 입력만 보고 결정한다 — task의 gold는 보지 않는다.
 */

export const FIXTURE_DIR = fromRepoRoot('tools/evals/consumer/fixtures');

export type FixtureContext = {
  fixture: string;
  /** package.json에 dependencies가 없으면 빈 객체 — "UI package 미설치"를 뜻한다. */
  dependencies: Record<string, string>;
  projectFiles: string[];
};

const walk = async (dir: string, base: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(path.relative(base, full));
  }
  return out;
};

export const loadFixtureContext = async (fixture: string): Promise<FixtureContext> => {
  const root = path.join(FIXTURE_DIR, fixture);
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
  };
  return {
    fixture,
    dependencies: pkg.dependencies ?? {},
    projectFiles: await walk(root, root),
  };
};

export const toPlatformInput = (prompt: string, context: FixtureContext): PlatformInput => ({
  prompt,
  dependencies: context.dependencies,
  projectFiles: context.projectFiles,
});
