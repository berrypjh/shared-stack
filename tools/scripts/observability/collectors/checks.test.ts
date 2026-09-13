import { verificationObservationSchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { COMMANDS } from '../registry';

import { CHECKS, collectCheck } from './checks';
import type { Exec, ExecResult } from './exec';

const result = (overrides: Partial<ExecResult>): ExecResult => ({
  exitCode: 0,
  signal: null,
  timedOut: false,
  wallMs: 900,
  stdout: '',
  stderr: '',
  ...overrides,
});

const fakeExec =
  (outcome: Partial<ExecResult> | Error): Exec =>
  async () => {
    if (outcome instanceof Error) throw outcome;
    return result(outcome);
  };

const TYPECHECK_SPEC = CHECKS.find((check) => check.commandId === 'typecheck.react-ui.spec');
if (!TYPECHECK_SPEC) throw new Error('typecheck.react-ui.spec check is not registered');

const collect = (outcome: Partial<ExecResult> | Error, spec = TYPECHECK_SPEC) =>
  collectCheck({ spec, exec: fakeExec(outcome), workspaceRoot: process.cwd(), timeoutMs: 60000 });

describe('CHECKS', () => {
  it('등록된 verification 명령에서만 만든다', () => {
    const verificationIds = COMMANDS.filter((command) => command.domain === 'verification').map(
      (command) => command.id,
    );
    expect(CHECKS.map((check) => check.commandId)).toEqual(verificationIds);
  });

  it('typecheck 는 lib·storybook·spec 범위를 따로 둔다', () => {
    const react = CHECKS.filter((check) => check.commandId.startsWith('typecheck.react-ui.'));
    expect(react.map((check) => [check.commandId, check.kind])).toEqual([
      ['typecheck.react-ui.lib', 'typecheck'],
      ['typecheck.react-ui.storybook', 'typecheck'],
      ['typecheck.react-ui.spec', 'typecheck'],
    ]);
    expect(react.map((check) => check.argv.find((arg) => arg.endsWith('.json')))).toEqual([
      'libs/react-ui/tsconfig.lib.json',
      'libs/react-ui/tsconfig.storybook.json',
      'libs/react-ui/tsconfig.spec.json',
    ]);
  });
});

describe('collectCheck', () => {
  it('exit 0 은 passed 다', async () => {
    const observation = await collect({ exitCode: 0 });
    expect(verificationObservationSchema.parse(observation)).toEqual(observation);
    expect(observation).toMatchObject({
      id: 'typecheck.react-ui.spec',
      kind: 'typecheck',
      status: 'passed',
      availability: 'available',
      outcome: 'pass',
      exitCode: 0,
      durationMs: 900,
    });
  });

  it('실패하면 failed 이고 발췌에서 홈 경로와 credential 을 지운다', async () => {
    const observation = await collect({
      exitCode: 2,
      stderr: `src/a.ts(1,1): error TS2322 at /Users/park/x.ts npm_${'a'.repeat(36)}`,
    });
    expect(observation).toMatchObject({ status: 'failed', outcome: 'fail', exitCode: 2 });
    const [evidence] = observation.evidence;
    expect(evidence).toMatchObject({
      source: 'command',
      commandId: 'typecheck.react-ui.spec',
      exitCode: 2,
    });
    const excerpt = 'excerpt' in evidence ? evidence.excerpt : null;
    expect(excerpt).toContain('error TS2322');
    expect(excerpt).not.toContain('/Users/park');
    expect(excerpt).not.toContain('npm_aaaa');
  });

  it('제한 시간을 넘기면 timeout 이고 pass 가 아니다', async () => {
    expect(await collect({ exitCode: null, timedOut: true })).toMatchObject({
      status: 'timeout',
      outcome: 'fail',
      exitCode: null,
    });
  });

  it('실행 자체를 못 하면 pass 로 두지 않고 이유와 함께 not-run 이다', async () => {
    const observation = await collect(
      Object.assign(new Error('spawn tsc ENOENT'), { code: 'ENOENT' }),
    );
    expect(observation).toMatchObject({
      status: 'not-run',
      availability: 'not-run',
      outcome: null,
      exitCode: null,
    });
    expect(observation.reason).toContain('ENOENT');
  });

  it('build 성공은 build 결과일 뿐 typecheck observation 을 만들지 않는다', async () => {
    const build = CHECKS.find((check) => check.kind === 'build');
    if (!build) throw new Error('a build check is registered');
    const observation = await collectCheck({
      spec: build,
      exec: fakeExec({ exitCode: 0 }),
      workspaceRoot: process.cwd(),
      timeoutMs: 60000,
    });
    expect(observation).toMatchObject({ kind: 'build', status: 'passed' });
    expect(observation.id.startsWith('typecheck.')).toBe(false);
  });
});
