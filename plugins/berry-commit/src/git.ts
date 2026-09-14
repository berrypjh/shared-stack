import { execSync, spawnSync } from 'node:child_process';

import { buildConventionalCommitTitlePattern } from './format.js';
import type {
  CommitExecutionResult,
  CommitMessage,
  FileStatus,
  GitCommandResult,
} from './types.js';

// git diff는 커밋된 번들처럼 큰 파일에서 기본 1MB 버퍼를 넘긴다.
const MAX_BUFFER = 64 * 1024 * 1024;

const runGit = (args: string[], input?: string): GitCommandResult => {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
    ...(input === undefined ? {} : { input }),
  });

  return {
    status: result.status ?? 1,
    stdout: (result.stdout as string) ?? '',
    stderr: (result.stderr as string) ?? '',
  };
};

export const getStagedFilesWithStatus = (): FileStatus[] => {
  let output = '';

  try {
    output = execSync('git diff --cached --name-status --find-renames --find-copies', {
      encoding: 'utf8',
      maxBuffer: MAX_BUFFER,
    });
  } catch {
    throw new Error(
      'git diff --cached --name-status --find-renames --find-copies 실행에 실패했습니다.',
    );
  }

  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error('스테이징된 변경 파일을 찾을 수 없습니다. 먼저 git add 를 실행해주세요.');
  }

  const files: FileStatus[] = [];

  for (const line of lines) {
    const parts = line.split('\t');

    if (parts.length < 2) {
      continue;
    }

    const statusCode = parts[0].trim();
    const status = statusCode.replace(/\d+$/, '');

    if ((status === 'R' || status === 'C') && parts.length >= 3) {
      files.push({
        status,
        oldFile: parts[1].trim(),
        file: parts[2].trim(),
      });
      continue;
    }

    files.push({
      status,
      file: parts[1].trim(),
    });
  }

  if (files.length === 0) {
    throw new Error('유효한 스테이징 파일을 찾지 못했습니다.');
  }

  return files;
};

export const getScopedDiff = (files: FileStatus[]): string => {
  const filePaths = files.map((fileStatus) => fileStatus.file);
  const oldFilePaths = files
    .filter(
      (fileStatus): fileStatus is FileStatus & { oldFile: string } => fileStatus.oldFile != null,
    )
    .map((fileStatus) => fileStatus.oldFile);

  const allPaths = [...new Set([...filePaths, ...oldFilePaths])];

  const result = runGit(['diff', '--cached', '--find-renames', '--find-copies', '--', ...allPaths]);

  if (result.status !== 0) {
    throw new Error('git diff --cached -- <files> 실행에 실패했습니다.');
  }

  if (!result.stdout.trim()) {
    throw new Error('해당 scope에 대한 staged diff가 없습니다.');
  }

  return result.stdout;
};

export const assertCommitTitleMatchesScope = (title: string, scope: string): void => {
  const pattern = buildConventionalCommitTitlePattern(scope);

  if (!pattern.test(title)) {
    throw new Error(
      `title은 반드시 "type(${scope}): 설명" 형식을 따라야 합니다. 전달된 title: "${title}"`,
    );
  }
};

const getCommitPathspec = (files: FileStatus[]): string[] => {
  const filePaths = files.map((fileStatus) => fileStatus.file);
  const oldFilePaths = files
    .filter(
      (fileStatus): fileStatus is FileStatus & { oldFile: string } => fileStatus.oldFile != null,
    )
    .map((fileStatus) => fileStatus.oldFile);

  return [...new Set([...filePaths, ...oldFilePaths])];
};

export const commitScope = (
  scope: string,
  message: CommitMessage,
  files: FileStatus[],
): CommitExecutionResult => {
  assertCommitTitleMatchesScope(message.title, scope);

  const targetPaths = new Set(getCommitPathspec(files));
  const allStaged = getStagedFilesWithStatus();
  const otherPaths = [
    ...new Set(
      allStaged
        .flatMap((f) => (f.oldFile ? [f.oldFile, f.file] : [f.file]))
        .filter((path) => !targetPaths.has(path)),
    ),
  ];

  const args = ['commit', '-m', message.title];

  if (message.body && message.body.trim()) {
    args.push('-m', message.body.trim());
  }

  const command = ['git', ...args].join(' ');
  const buildResult = (
    ok: boolean,
    extra: { stdout: string; stderr: string },
  ): CommitExecutionResult => ({
    ok,
    scope,
    title: message.title,
    body: message.body?.trim() ?? '',
    command,
    stdout: extra.stdout,
    stderr: extra.stderr,
  });

  let stagedPatch = '';

  if (otherPaths.length > 0) {
    const patch = runGit(['diff', '--cached', '--binary', '--', ...otherPaths]);
    if (patch.status !== 0) {
      return buildResult(false, {
        stdout: patch.stdout,
        stderr: `다른 scope 파일의 staged 상태를 저장하는데 실패했습니다.\n${patch.stderr}`,
      });
    }
    stagedPatch = patch.stdout;

    const reset = runGit(['reset', 'HEAD', '--', ...otherPaths]);
    if (reset.status !== 0) {
      return buildResult(false, {
        stdout: reset.stdout,
        stderr: `다른 scope 파일을 임시 unstage하는데 실패했습니다.\n${reset.stderr}`,
      });
    }
  }

  const commitResult = runGit(args);

  let restoreError = '';
  if (stagedPatch.trim()) {
    const restore = runGit(['apply', '--cached', '-'], stagedPatch);
    if (restore.status !== 0) {
      restoreError = `\n[경고] 다른 scope 파일의 staged 상태 복원 실패. 수동 확인 필요.\n${restore.stderr}`;
    }
  }

  return buildResult(commitResult.status === 0, {
    stdout: commitResult.stdout,
    stderr: commitResult.stderr + restoreError,
  });
};
