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
        '--import=test.react-ui:tmp/quality-lab/imports/react-ui.json',
        '--import=bundle.size-limit:tmp/quality-lab/imports/size-limit.json',
        '--only-imports',
      ]),
    ).toEqual({
      command: 'collect',
      profile: 'core',
      runId: 'local-quality-01',
      imports: {
        'test.react-ui': 'tmp/quality-lab/imports/react-ui.json',
        'bundle.size-limit': 'tmp/quality-lab/imports/size-limit.json',
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
        '--import=test.react-ui:tmp/quality-lab/imports/a.json',
      ],
    ],
    [['collect', '--profile=core', '--run-id=a', '--import=rm -rf:tmp/quality-lab/imports/a.json']],
    [
      [
        'collect',
        '--profile=core',
        '--run-id=a',
        '--import=eval.consumer-smoke:tmp/quality-lab/imports/a.json',
      ],
    ],
    [
      [
        'collect',
        '--profile=core',
        '--run-id=a',
        '--import=test.react-ui:libs/react-ui/package.json',
      ],
    ],
    [
      [
        'collect',
        '--profile=core',
        '--run-id=a',
        '--import=test.react-ui:tmp/quality-lab/imports/a.json',
        '--import=test.react-ui:tmp/quality-lab/imports/b.json',
      ],
    ],
    [['collect', '--profile=core', '--run-id=a', '--only-imports=yes']],
    [['collect', '--profile=eval', '--run-id=a']],
    [['collect', '--profile=eval', '--run-id=a', '--from=tmp/quality-lab/runs']],
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
