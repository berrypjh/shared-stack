import { describe, expect, it } from 'vitest';

import { CliUsageError, parseArgs } from './cli';

describe('parseArgs — 등록된 형태만 받는다', () => {
  it('collect 는 profile 과 run id 를 받는다', () => {
    expect(parseArgs(['collect', '--profile=static', '--run-id=local-static-01'])).toEqual({
      command: 'collect',
      profile: 'static',
      runId: 'local-static-01',
      imports: {},
      onlyImports: false,
    });
  });

  it('core 는 등록된 명령의 raw report 를 imports 디렉터리에서 가져올 수 있다', () => {
    expect(
      parseArgs([
        'collect',
        '--profile=core',
        '--run-id=local-quality-01',
        '--import=bundle.treeshake.react-ui:tmp/observability/imports/treeshake.json',
        '--import=bundle.size-limit:tmp/observability/imports/size-limit.json',
        '--only-imports',
      ]),
    ).toEqual({
      command: 'collect',
      profile: 'core',
      runId: 'local-quality-01',
      imports: {
        'bundle.treeshake.react-ui': 'tmp/observability/imports/treeshake.json',
        'bundle.size-limit': 'tmp/observability/imports/size-limit.json',
      },
      onlyImports: true,
    });
  });

  it('eval 은 이미 만든 consumer eval 산출물 디렉터리를 가져온다', () => {
    expect(
      parseArgs([
        'collect',
        '--profile=eval',
        '--from=tmp/llm-evals/pr-smoke',
        '--run-id=local-eval-01',
      ]),
    ).toEqual({
      command: 'collect',
      profile: 'eval',
      runId: 'local-eval-01',
      from: 'tmp/llm-evals/pr-smoke',
    });
  });

  it('run 은 core · eval · eval-live 만 받고 run id 를 시각으로 만든다', () => {
    const now = new Date(2026, 9, 1, 10, 15, 0);
    expect(parseArgs(['run', '--profile=core'], now)).toEqual({
      command: 'run',
      profile: 'core',
      runId: 'core-20261001-101500',
      live: {},
    });
    expect(parseArgs(['run', '--profile=eval', '--run-id=my-eval'], now)).toEqual({
      command: 'run',
      profile: 'eval',
      runId: 'my-eval',
      live: {},
    });
    expect(parseArgs(['run', '--profile=eval-live'], now)).toEqual({
      command: 'run',
      profile: 'eval-live',
      runId: 'eval-live-20261001-101500',
      live: {},
    });
    expect(
      parseArgs(['run', '--profile=eval-live', '--provider=local', '--model=qwen3:14b'], now),
    ).toMatchObject({ live: { provider: 'local', model: 'qwen3:14b' } });
    expect(() => parseArgs(['run', '--profile=eval', '--provider=local'], now)).toThrow(
      CliUsageError,
    );
    expect(() => parseArgs(['run', '--profile=static'], now)).toThrow(CliUsageError);
    expect(() => parseArgs(['run'], now)).toThrow(CliUsageError);
  });

  it('export 는 run id 만 받는다', () => {
    expect(parseArgs(['export', '--run-id=local-static-01'])).toEqual({
      command: 'export',
      runId: 'local-static-01',
    });
  });

  it.each([
    [[]],
    [['serve']],
    [['collect', '--run-id=a']],
    [['collect', '--profile=full', '--run-id=a']],
    [['collect', '--profile=a11y', '--run-id=a']],
    [['collect', '--profile=static', '--run-id=../x']],
    [['export', '--run-id=a', '--argv=rm']],
    [['export', '--run-id=a', 'extra']],
    [['export', '--run-id=a', '--run-id=b']],
    [['export', '--profile=static', '--run-id=a']],
    [['collect', '--profile=static', '--run-id=a', '--only-imports']],
    [
      [
        'collect',
        '--profile=static',
        '--run-id=a',
        '--import=bundle.size-limit:tmp/observability/imports/a.json',
      ],
    ],
    [
      [
        'collect',
        '--profile=core',
        '--run-id=a',
        '--import=rm -rf:tmp/observability/imports/a.json',
      ],
    ],
    [
      [
        'collect',
        '--profile=core',
        '--run-id=a',
        '--import=eval.consumer-smoke:tmp/observability/imports/a.json',
      ],
    ],
    [
      [
        'collect',
        '--profile=core',
        '--run-id=a',
        '--import=test.react-ui:tmp/observability/imports/a.json',
      ],
    ],
    [
      [
        'collect',
        '--profile=core',
        '--run-id=a',
        '--import=bundle.size-limit:libs/react-ui/package.json',
      ],
    ],
    [
      [
        'collect',
        '--profile=core',
        '--run-id=a',
        '--import=bundle.size-limit:tmp/observability/imports/a.json',
        '--import=bundle.size-limit:tmp/observability/imports/b.json',
      ],
    ],
    [['collect', '--profile=core', '--run-id=a', '--only-imports=yes']],
    [['collect', '--profile=eval', '--run-id=a']],
    [['collect', '--profile=eval', '--run-id=a', '--from=tmp/observability/runs']],
    [['collect', '--profile=eval', '--run-id=a', '--from=tmp/llm-evals']],
    [
      [
        'collect',
        '--profile=eval',
        '--run-id=a',
        '--from=tmp/llm-evals/a',
        '--from=tmp/llm-evals/b',
      ],
    ],
    [['collect', '--profile=eval', '--run-id=a', '--from=tmp/llm-evals/a', '--only-imports']],
    [['collect', '--profile=core', '--run-id=a', '--from=tmp/llm-evals/a']],
    [['export', '--run-id=a', '--from=tmp/llm-evals/a']],
  ])('%j 는 usage 오류다', (argv) => {
    expect(() => parseArgs(argv)).toThrow(CliUsageError);
  });
});
