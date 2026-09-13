import type {
  MetricDomain,
  Profile,
  Unit,
  VERIFICATION_KINDS,
} from '@berrypjh/observability-contracts';

type Base = { id: string; scope: string; argv: readonly string[] };

export type CommandSpec =
  | (Base & { domain: MetricDomain; unit: Unit })
  | (Base & { domain: 'verification'; kind: (typeof VERIFICATION_KINDS)[number] });

/**
 * 수집기가 실행할 수 있는 명령의 전부.
 *
 * CLI 입력은 profile 과 run id 만 고를 수 있고 argv 를 만들 수 없다. 브라우저에는 명령
 * endpoint 가 없다. 실제 실행은 다음 단계 collector 가 `execFile`(shell 없음)로 한다.
 */
export const COMMANDS: readonly CommandSpec[] = [
  {
    id: 'test.observability-contracts',
    domain: 'test',
    unit: 'ratio',
    scope: '@berrypjh/observability-contracts',
    argv: ['pnpm', 'nx', 'test', '@berrypjh/observability-contracts'],
  },
  {
    id: 'test.quality-lab',
    domain: 'test',
    unit: 'ratio',
    scope: '@berrypjh/quality-lab',
    argv: ['pnpm', 'nx', 'test', '@berrypjh/quality-lab'],
  },
  // `@nx/vitest:test` executor 는 forwarded `--reporter` 로 report 를 쓰고 끝나지 않는다 (2026-09-13 재현).
  // 그래서 그 executor 를 쓰는 project 는 target 과 같은 config 로 vitest 를 직접 실행한다.
  {
    id: 'test.react-ui',
    domain: 'test',
    unit: 'ratio',
    scope: '@berrypjh/react-ui',
    argv: ['pnpm', 'exec', 'vitest', 'run', '--config', 'libs/react-ui/vitest.config.mts'],
  },
  {
    id: 'test.react-native-ui',
    domain: 'test',
    unit: 'ratio',
    scope: '@berrypjh/react-native-ui',
    argv: ['pnpm', 'nx', 'test', '@berrypjh/react-native-ui'],
  },
  {
    id: 'test.demo-web',
    domain: 'test',
    unit: 'ratio',
    scope: '@berrypjh/demo-web',
    argv: ['pnpm', 'nx', 'test', '@berrypjh/demo-web'],
  },
  // tools/ 는 Nx project 가 아니라 affected 밖이다 — 독립 영역으로 기록한다.
  {
    id: 'test.tools',
    domain: 'test',
    unit: 'ratio',
    scope: 'tools',
    argv: ['pnpm', 'exec', 'vitest', 'run', '--config', 'tools/vitest.tools.config.mts'],
  },
  {
    id: 'lint.quality-lab',
    domain: 'verification',
    kind: 'lint',
    scope: '@berrypjh/quality-lab',
    argv: ['pnpm', 'nx', 'lint', '@berrypjh/quality-lab'],
  },
  {
    id: 'typecheck.quality-lab',
    domain: 'verification',
    kind: 'typecheck',
    scope: '@berrypjh/quality-lab',
    argv: ['pnpm', 'nx', 'typecheck', '@berrypjh/quality-lab'],
  },
  {
    id: 'typecheck.observability-contracts',
    domain: 'verification',
    kind: 'typecheck',
    scope: '@berrypjh/observability-contracts',
    argv: ['pnpm', 'nx', 'typecheck', '@berrypjh/observability-contracts'],
  },
  // react-ui typecheck target 의 세 tsc 를 범위별로 나눈다 — 어느 범위가 실패했는지 섞지 않는다.
  {
    id: 'typecheck.react-ui.lib',
    domain: 'verification',
    kind: 'typecheck',
    scope: '@berrypjh/react-ui',
    argv: ['pnpm', 'exec', 'tsc', '-p', 'libs/react-ui/tsconfig.lib.json'],
  },
  {
    id: 'typecheck.react-ui.storybook',
    domain: 'verification',
    kind: 'typecheck',
    scope: '@berrypjh/react-ui',
    argv: ['pnpm', 'exec', 'tsc', '-p', 'libs/react-ui/tsconfig.storybook.json', '--noEmit'],
  },
  {
    id: 'typecheck.react-ui.spec',
    domain: 'verification',
    kind: 'typecheck',
    scope: '@berrypjh/react-ui',
    argv: ['pnpm', 'exec', 'tsc', '-p', 'libs/react-ui/tsconfig.spec.json', '--noEmit'],
  },
  {
    id: 'build.observability-contracts',
    domain: 'verification',
    kind: 'build',
    scope: '@berrypjh/observability-contracts',
    argv: ['pnpm', 'nx', 'build', '@berrypjh/observability-contracts'],
  },
  {
    id: 'bundle.size-limit',
    domain: 'bundle',
    unit: 'bytes',
    scope: 'workspace',
    argv: ['pnpm', 'size', '--json'],
  },
  {
    id: 'bundle.treeshake.react-ui',
    domain: 'bundle',
    unit: 'bytes',
    scope: '@berrypjh/react-ui',
    argv: ['pnpm', 'treeshake', 'react-ui', 'cx', 'Box', 'Stack', 'Button', 'TextField', '--json'],
  },
  {
    id: 'context.tokens-measure',
    domain: 'context',
    unit: 'tokens',
    scope: 'workspace',
    argv: ['pnpm', 'tokens:measure'],
  },
  {
    id: 'eval.consumer-smoke',
    domain: 'eval',
    unit: 'ratio',
    scope: 'tools/evals/consumer',
    argv: ['pnpm', 'eval:consumer:smoke'],
  },
  {
    id: 'a11y.storybook',
    domain: 'a11y',
    unit: 'count',
    scope: '@berrypjh/react-ui',
    argv: ['pnpm', 'storybook:a11y'],
  },
];

export class UnregisteredCommandError extends Error {}

export const commandById = (id: string): CommandSpec => {
  const spec = COMMANDS.find((command) => command.id === id);
  if (!spec) throw new UnregisteredCommandError(`${id} is not a registered command`);
  return spec;
};

/**
 * profile 이 실행하는 명령 id. static 은 정의만 읽고 아무것도 실행하지 않는다.
 * core 는 test·verification·bundle 명령을 실행한다 (context 는 명령 없이 in-process 로 센다).
 * eval·a11y 는 core 에 넣지 않는다. eval profile 은 이미 만든 eval 산출물을 읽기만 한다.
 */
export const PROFILE_COMMANDS: Record<Profile, readonly string[]> = {
  static: [],
  core: COMMANDS.filter((command) =>
    ['test', 'verification', 'bundle'].includes(command.domain),
  ).map((command) => command.id),
  eval: [],
};
