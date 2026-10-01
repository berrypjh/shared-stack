import { execFileSync } from 'node:child_process';

import type { RepositorySnapshot } from '../../domain/model';

/**
 * Node 전용 — `vite.config.mts` 가 build · serve 시점에 한 번 부른다. 브라우저 코드는 import 하지 않는다.
 * git 은 셸 없이 인자 배열로 부르고, 실패하거나 형식이 맞지 않는 값은 버린다.
 */

/** git 을 부르는 함수. 실패하면 `null`. */
export type Git = (args: string[]) => string | null;

const COMMIT = /^[0-9a-f]{40}$/;
const BRANCH = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

const UNAVAILABLE: RepositorySnapshot = {
  source: 'unavailable',
  commit: null,
  branch: null,
  dirty: null,
  uncommitted: null,
};

/**
 * `git status --porcelain -z` 에서 스냅샷 커밋에 없는 경로: 추적되지 않음(`??`), 새로 추가(`A`),
 * 이름 바뀜 · 복사의 새 경로(`R` · `C`, 다음 필드가 원래 경로라 건너뛴다). 디렉터리는 `/` 로 끝난다.
 */
export const uncommittedPaths = (status: string): string[] => {
  const fields = status.split('\0');
  const paths: string[] = [];
  for (let i = 0; i < fields.length; i += 1) {
    const code = fields[i].slice(0, 2);
    const path = fields[i].slice(3);
    if (!path) continue;
    if (code === '??' || code[0] === 'A') paths.push(path);
    if (code[0] === 'R' || code[0] === 'C') {
      paths.push(path);
      i += 1;
    }
  }
  return paths;
};

/** git 출력에서 스냅샷을 만든다. 커밋을 못 읽으면 나머지도 믿지 않는다. */
export const resolveSnapshot = (git: Git): RepositorySnapshot => {
  const commit = git(['rev-parse', 'HEAD'])?.trim();
  if (!commit || !COMMIT.test(commit)) return UNAVAILABLE;
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])?.trim();
  const status = git(['status', '--porcelain', '-z']);
  return {
    source: 'git',
    commit,
    branch: branch && branch !== 'HEAD' && BRANCH.test(branch) ? branch : null,
    dirty: status === null ? null : status.length > 0,
    uncommitted: status === null ? null : uncommittedPaths(status),
  };
};

/** `cwd` 에서 git 을 셸 없이 부른다. git 이 없거나 저장소가 아니면 `null`. */
export const gitAt =
  (cwd: string): Git =>
  (args) => {
    try {
      return execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 5000,
      });
    } catch {
      return null;
    }
  };

export const readSnapshot = (cwd: string) => resolveSnapshot(gitAt(cwd));
