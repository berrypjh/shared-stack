import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

import { sanitizeExcerpt } from '@berrypjh/observability-contracts';

export type ExecResult = {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  wallMs: number;
  stdout: string;
  stderr: string;
};

/** 프로세스 한 번의 실행 상태. `completed` 는 exit 0, `failed` 는 그 밖의 exit code 다. */
export type Execution = {
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  exitCode: number | null;
  timeoutMs: number;
  wallMs: number;
  excerpt: string | null;
  reason: string | null;
};

export type ExecOptions = { cwd: string; timeoutMs: number; env?: NodeJS.ProcessEnv };

/** 수집기가 명령을 실행하는 유일한 경계. 테스트는 이 함수를 바꿔 끼운다. */
export type Exec = (argv: readonly string[], options: ExecOptions) => Promise<ExecResult>;

const OUTPUT_LIMIT = 8 * 1024 * 1024;
const EXCERPT_LENGTH = 480;

/**
 * 등록된 argv 를 shell 없이 실행한다. 제한 시간을 넘기면 SIGTERM 으로 끊고 `timedOut` 을 표시한다.
 * stdout 은 report 를 싣는 runner(size-limit·treeshake `--json`)가 있어 stderr 와 따로 모은다.
 */
export const runArgv: Exec = (argv, { cwd, timeoutMs, env }) =>
  new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(argv[0], argv.slice(1), { cwd, env: env ?? process.env, shell: false });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      if (stdout.length < OUTPUT_LIMIT) stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      if (stderr.length < OUTPUT_LIMIT) stderr += chunk;
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolve({
        exitCode,
        signal,
        timedOut,
        wallMs: Math.round(performance.now() - started),
        stdout,
        stderr,
      });
    });
  });

/** 출력의 끝부분 발췌. 자르기 전에 정제해서 credential 이 잘린 조각으로 남지 않게 한다. */
export const excerptOf = (result: Pick<ExecResult, 'stdout' | 'stderr'>): string | null => {
  const text = `${result.stderr}\n${result.stdout}`.trim();
  if (!text) return null;
  const clean = sanitizeExcerpt(text, Number.MAX_SAFE_INTEGER);
  return clean.length <= EXCERPT_LENGTH ? clean : `…${clean.slice(-(EXCERPT_LENGTH - 1))}`;
};

/** 프로세스 결과를 실행 상태로. timeout·signal 중단은 이유를 남긴다. */
export const executionOf = (result: ExecResult, timeoutMs: number): Execution => {
  const excerpt = excerptOf(result);
  const common = { timeoutMs, wallMs: result.wallMs, excerpt };
  if (result.timedOut) {
    return {
      ...common,
      status: 'timeout',
      exitCode: null,
      reason: `${timeoutMs}ms 제한 시간을 넘겨 중단했다`,
    };
  }
  if (result.exitCode === null) {
    return {
      ...common,
      status: 'cancelled',
      exitCode: null,
      reason: `signal ${result.signal ?? 'unknown'} 로 끝났다`,
    };
  }
  return {
    ...common,
    status: result.exitCode === 0 ? 'completed' : 'failed',
    exitCode: result.exitCode,
    reason: null,
  };
};
