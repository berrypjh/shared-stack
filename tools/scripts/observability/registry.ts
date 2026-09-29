import type { Domain, Profile, Unit } from '@berrypjh/observability-contracts';

export type CommandSpec = {
  id: string;
  domain: Domain;
  unit: Unit;
  scope: string;
  argv: readonly string[];
};

/**
 * 수집기가 실행할 수 있는 명령의 전부.
 *
 * CLI 입력은 profile 과 run id 만 고를 수 있고 argv 를 만들 수 없다. 브라우저에는 명령
 * endpoint 가 없다. 실제 실행은 다음 단계 collector 가 `execFile`(shell 없음)로 한다.
 */
export const COMMANDS: readonly CommandSpec[] = [
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
];

export class UnregisteredCommandError extends Error {}

export const commandById = (id: string): CommandSpec => {
  const spec = COMMANDS.find((command) => command.id === id);
  if (!spec) throw new UnregisteredCommandError(`${id} is not a registered command`);
  return spec;
};

/**
 * profile 이 실행하는 명령 id. static 은 정의만 읽고 아무것도 실행하지 않는다.
 * core 는 bundle 명령을 실행한다 (context 는 명령 없이 in-process 로 센다).
 * eval 은 core 에 넣지 않는다. eval profile 은 이미 만든 eval 산출물을 읽기만 한다.
 */
export const PROFILE_COMMANDS: Record<Profile, readonly string[]> = {
  static: [],
  core: COMMANDS.filter((command) => command.domain === 'bundle').map((command) => command.id),
  eval: [],
};
