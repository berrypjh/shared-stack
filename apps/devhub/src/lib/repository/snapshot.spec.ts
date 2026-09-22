// @vitest-environment node
import { join } from 'node:path';

import { type Git, gitAt, resolveSnapshot } from './snapshot';

const SHA = 'a'.repeat(40);

/** 인자 첫 두 개로 답을 고르는 가짜 git. 없는 답은 실패(`null`)다. */
const fakeGit =
  (answers: Record<string, string | null>): Git =>
  (args) =>
    answers[args.join(' ')] ?? null;

describe('resolveSnapshot', () => {
  it('reads commit, branch, and a clean tree', () => {
    const git = fakeGit({
      'rev-parse HEAD': `${SHA}\n`,
      'rev-parse --abbrev-ref HEAD': 'main\n',
      'status --porcelain -z': '',
    });
    expect(resolveSnapshot(git)).toEqual({
      source: 'git',
      commit: SHA,
      branch: 'main',
      dirty: false,
      uncommitted: [],
    });
  });

  it('says the tree is dirty when git status lists changes', () => {
    const git = fakeGit({
      'rev-parse HEAD': SHA,
      'rev-parse --abbrev-ref HEAD': 'feature/x',
      'status --porcelain -z': ' M README.md\0?? apps/devhub/\0A  docs/new.md\0R  b.ts\0a.ts\0',
    });
    expect(resolveSnapshot(git)).toMatchObject({
      branch: 'feature/x',
      dirty: true,
      uncommitted: ['apps/devhub/', 'docs/new.md', 'b.ts'],
    });
  });

  it('leaves the branch unknown on a detached HEAD', () => {
    const git = fakeGit({
      'rev-parse HEAD': SHA,
      'rev-parse --abbrev-ref HEAD': 'HEAD',
      'status --porcelain -z': '',
    });
    expect(resolveSnapshot(git).branch).toBeNull();
  });

  it('leaves dirty and uncommitted paths unknown when git status fails', () => {
    const git = fakeGit({ 'rev-parse HEAD': SHA, 'rev-parse --abbrev-ref HEAD': 'main' });
    expect(resolveSnapshot(git)).toMatchObject({ dirty: null, uncommitted: null });
  });

  it('is unavailable, with every value null, when the commit cannot be read', () => {
    const unavailable = {
      source: 'unavailable',
      commit: null,
      branch: null,
      dirty: null,
      uncommitted: null,
    };
    expect(resolveSnapshot(fakeGit({}))).toEqual(unavailable);
    expect(resolveSnapshot(fakeGit({ 'rev-parse HEAD': 'not-a-sha' }))).toEqual(unavailable);
  });
});

describe('gitAt', () => {
  it('returns null instead of throwing when git cannot run there', () => {
    expect(gitAt(join(import.meta.dirname, 'no-such-directory'))(['rev-parse', 'HEAD'])).toBeNull();
  });
});
