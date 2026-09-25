import { spawnSync } from 'node:child_process';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * shared-stack 에 커밋된 `.claude/rules/_generated` 가 source(`plugins/berry-dev/standards`)와
 * `.claude/standards.json` 에서 다시 만든 결과와 같은지 CLI check 로 본다. 읽기만 한다.
 *
 * source 나 config 를 바꾸고 `pnpm harness:sync` 를 잊으면 여기서 실패한다. `tools:check` 가 이 파일을
 * 수집하므로 PR 의 consumer-eval job 에서 돈다. 이것은 content check 다 — source pin(어느 커밋의
 * shared-stack 인가)은 소비 저장소의 setup · CI 가 따로 확인한다.
 */

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const CLI = path.join(REPO_ROOT, 'plugins/berry-dev/scripts/standards.mjs');
const RULES = path.join(REPO_ROOT, '.claude/rules');

/** 경로 → 크기 · mtime · 내용. */
const snapshot = (dir: string): Record<string, string> =>
  Object.fromEntries(
    readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .sort()
      .map((entry) => {
        const file = path.join(dir, entry);
        const stat = lstatSync(file);
        const content = stat.isFile() ? readFileSync(file, 'utf8') : '';
        return [entry, `${stat.size}:${stat.mtimeMs}:${content}`];
      }),
  );

describe('커밋된 생성 rule', () => {
  it('source · config 로 다시 만든 결과와 같다 — check 가 0 이고 아무것도 바꾸지 않는다', () => {
    const before = snapshot(RULES);
    const result = spawnSync(process.execPath, [CLI, 'check', '--project', REPO_ROOT], {
      encoding: 'utf8',
    });
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('check: up to date\n');
    expect(result.status).toBe(0);
    expect(snapshot(RULES)).toEqual(before);
  });

  it('git 이 무시하지 않고 formatter 가 건드리지 않는다', () => {
    const ignored = spawnSync('git', ['check-ignore', '-q', '.claude/rules/_generated/core.md'], {
      cwd: REPO_ROOT,
    });
    expect(ignored.status).toBe(1);
    const prettierIgnore = readFileSync(path.join(REPO_ROOT, '.prettierignore'), 'utf8');
    expect(prettierIgnore.split('\n')).toContain('.claude/rules/_generated');
  });
});
