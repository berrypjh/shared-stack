import { describe, expect, it } from 'vitest';

import { cacheOriginOf, executionOf, runArgv } from './exec';

const NODE = process.execPath;

describe('runArgv — 등록된 argv 를 shell 없이 실행한다', () => {
  it('exit code 와 stdout·stderr 를 따로 돌려준다', async () => {
    const result = await runArgv(
      [NODE, '-e', 'process.stdout.write("out"); process.stderr.write("err"); process.exit(3)'],
      {
        cwd: process.cwd(),
        timeoutMs: 10000,
      },
    );
    expect(result).toMatchObject({
      exitCode: 3,
      signal: null,
      timedOut: false,
      stdout: 'out',
      stderr: 'err',
    });
    expect(result.wallMs).toBeGreaterThanOrEqual(0);
  });

  it('shell 문법을 해석하지 않는다', async () => {
    const result = await runArgv(
      [NODE, '-e', 'console.log(process.argv.slice(1).join("|"))', 'a; echo injected', '$(whoami)'],
      {
        cwd: process.cwd(),
        timeoutMs: 10000,
      },
    );
    expect(result.stdout.trim()).toBe('a; echo injected|$(whoami)');
  });

  it('제한 시간을 넘기면 중단하고 timeout 으로 표시한다', async () => {
    const result = await runArgv([NODE, '-e', 'setTimeout(() => {}, 60000)'], {
      cwd: process.cwd(),
      timeoutMs: 200,
    });
    expect(result).toMatchObject({ timedOut: true, exitCode: null });
  });
});

describe('executionOf', () => {
  const base = { signal: null, timedOut: false, wallMs: 1200, stdout: '', stderr: '' };

  it('exit 0 은 completed, 그 밖은 failed 이고 발췌를 정제한다', () => {
    expect(executionOf({ ...base, exitCode: 0 }, 60000)).toMatchObject({
      status: 'completed',
      exitCode: 0,
      wallMs: 1200,
      reason: null,
    });
    const failed = executionOf(
      { ...base, exitCode: 2, stderr: 'error at /Users/park/x.ts' },
      60000,
    );
    expect(failed).toMatchObject({ status: 'failed', exitCode: 2 });
    expect(failed.excerpt).toContain('~/x.ts');
  });

  it('timeout 과 signal 중단은 이유를 가진다', () => {
    expect(executionOf({ ...base, exitCode: null, timedOut: true }, 60000)).toMatchObject({
      status: 'timeout',
      exitCode: null,
      reason: '60000ms 제한 시간을 넘겨 중단했다',
    });
    expect(executionOf({ ...base, exitCode: null, signal: 'SIGINT' }, 60000)).toMatchObject({
      status: 'cancelled',
      reason: 'signal SIGINT 로 끝났다',
    });
  });
});

describe('cacheOriginOf — 대상 task 줄만 본다', () => {
  const argv = ['pnpm', 'nx', 'test', '@berrypjh/demo-web'];

  it('Nx 를 거치지 않으면 not-applicable', () => {
    expect(cacheOriginOf(['pnpm', 'exec', 'vitest', 'run'], '')).toBe('not-applicable');
  });

  it.each([
    '> nx run @berrypjh/demo-web:test --reporter=json  [local cache]',
    '> nx run @berrypjh/demo-web:test  [remote cache]',
    '> nx run @berrypjh/demo-web:test  [existing outputs match the cache, left as is]',
  ])('대상 task 줄에 cache 표시가 있으면 restored: %s', (output) => {
    expect(cacheOriginOf(argv, output)).toBe('restored');
  });

  it('의존 task 만 cache 에서 왔으면 대상은 fresh 다', () => {
    const output =
      '> nx run @berrypjh/react-ui:build  [local cache]\n\n> nx run @berrypjh/demo-web:test --reporter=json\n';
    expect(cacheOriginOf(argv, output)).toBe('fresh');
  });

  it('`nx run project:target` 형태도 읽는다', () => {
    expect(
      cacheOriginOf(
        ['pnpm', 'nx', 'run', '@berrypjh/demo-web:test'],
        '> nx run @berrypjh/demo-web:test  [local cache]',
      ),
    ).toBe('restored');
  });

  it('대상 task 줄을 찾지 못하면 추측하지 않고 unknown 이다', () => {
    expect(cacheOriginOf(argv, 'Successfully ran target test for project x')).toBe('unknown');
  });
});
