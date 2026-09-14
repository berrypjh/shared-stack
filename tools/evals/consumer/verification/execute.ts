import { execFile } from 'node:child_process';

import { REPO_ROOT } from '../runner/paths';
import type { VerificationRun } from '../runner/schema';

import { failureFingerprint } from './fingerprint';
import type { VerificationPlan } from './policy';

/**
 * verification 한 건을 실제로 실행하고 결과를 그대로 기록한다.
 * 실행하지 않았으면 `passed`로 만들지 않는다.
 * stdout/stderr 전체를 trace에 싣지 않고 capped excerpt만 남긴다.
 */

export const DEFAULT_TIMEOUT_MS = 120_000;
export const EXCERPT_LIMIT = 2_000;

export type InProcessCheck = () => { passed: boolean; excerpt: string | null };

export type ExecuteOptions = {
  attempt: number;
  timeoutMs?: number;
  /** `public-import`처럼 프로세스를 띄우지 않는 검사. */
  inProcess?: Partial<Record<string, InProcessCheck>>;
};

/** 공유되는 아티팩트에 실행 환경의 절대 경로를 남기지 않는다. */
const scrub = (text: string): string => text.split(REPO_ROOT).join('<repo>');

const cap = (text: string): string | null => {
  const trimmed = scrub(text).trim();
  if (!trimmed) return null;
  return trimmed.length <= EXCERPT_LIMIT
    ? trimmed
    : `${trimmed.slice(0, EXCERPT_LIMIT)}\n[truncated ${trimmed.length - EXCERPT_LIMIT} chars]`;
};

const spawn = (
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<{ code: number | null; output: string; timedOut: boolean }> =>
  new Promise((resolve) => {
    execFile(
      command,
      args,
      { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' },
      (error, stdout, stderr) => {
        const output = `${stdout}\n${stderr}`;
        const timedOut = Boolean(error && 'killed' in error && error.killed);
        const code =
          error && typeof (error as { code?: unknown }).code === 'number'
            ? (error as { code: number }).code
            : error
              ? null
              : 0;
        resolve({ code, output, timedOut });
      },
    );
  });

export const executePlan = async (
  plan: VerificationPlan,
  { attempt, timeoutMs = DEFAULT_TIMEOUT_MS, inProcess }: ExecuteOptions,
): Promise<VerificationRun> => {
  const shared = { kind: plan.kind, required: plan.required, attempt };

  if (!plan.supported) {
    return {
      ...shared,
      status: 'unsupported',
      command: null,
      exitCode: null,
      durationMs: null,
      attempt: 0,
      failureFingerprint: null,
      excerpt: plan.unsupportedReason,
    };
  }

  if (plan.targetSource === 'in-process') {
    const check = inProcess?.[plan.kind];
    if (!check) {
      return {
        ...shared,
        status: 'not-run',
        command: null,
        exitCode: null,
        durationMs: null,
        attempt: 0,
        failureFingerprint: null,
        excerpt: `no in-process handler registered for ${plan.kind}`,
      };
    }
    const started = Date.now();
    const { passed, excerpt } = check();
    return {
      ...shared,
      status: passed ? 'passed' : 'failed',
      command: null,
      exitCode: passed ? 0 : 1,
      durationMs: Date.now() - started,
      failureFingerprint: passed ? null : failureFingerprint(plan.kind, null, excerpt ?? '', 1),
      excerpt: excerpt ? cap(excerpt) : null,
    };
  }

  const rawCommand = [plan.command, ...plan.args].join(' ');
  const commandLine = scrub(rawCommand);
  const started = Date.now();
  const { code, output, timedOut } = await spawn(
    plan.command as string,
    plan.args,
    plan.cwd as string,
    timeoutMs,
  );
  const durationMs = Date.now() - started;

  if (timedOut) {
    return {
      ...shared,
      status: 'timeout',
      command: commandLine,
      exitCode: null,
      durationMs,
      failureFingerprint: failureFingerprint(plan.kind, commandLine, 'timeout', null),
      excerpt: cap(output),
    };
  }

  const passed = code === 0;
  return {
    ...shared,
    status: passed ? 'passed' : 'failed',
    command: commandLine,
    exitCode: code,
    durationMs,
    failureFingerprint: passed ? null : failureFingerprint(plan.kind, commandLine, output, code),
    excerpt: cap(output),
  };
};
