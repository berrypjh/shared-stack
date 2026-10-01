import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { type Profile, PROFILES, runIdSchema } from '@berrypjh/observability-contracts';

import { baselineFile } from '../../evals/consumer/ci/baseline';
import { VARIANTS } from '../../evals/consumer/variants/index';
import { openAIModelFromEnv } from '../../lib/token-count';
import { REPO_ROOT } from '../generate-consumer-catalog/config';
import { MEASURE_TARGETS } from '../measure-tokens/registry';

import {
  collectPackageScenarios,
  collectVariantContexts,
  readTokenizerVersion,
} from './collectors/context';
import { collectCore } from './collectors/core';
import { collectEval, EVAL_DIR_PATTERN, EVALS_DIR } from './collectors/eval';
import { readEvalBaselineFile } from './collectors/eval-baseline';
import { runArgv } from './collectors/exec';
import { IMPORTS_DIR } from './collectors/imports';
import { exportRun, PUBLIC_ROOT } from './export';
import { PROFILE_COMMANDS } from './registry';
import { collectStatic, gitReader, readToolVersions } from './static';
import { STORE_ROOT, writeRun } from './store';

/**
 * 품질 관측 수집 CLI. 결과는 DevHub 평가 화면이 읽는다.
 *
 *   pnpm quality:core    번들 · 컨텍스트를 수집하고 DevHub 로 내보낸다 (run id 자동)
 *   pnpm quality:eval    smoke 평가를 돌려 수집하고 DevHub 로 내보낸다 (run id 자동)
 *   pnpm quality:eval:live  모델을 실제로 호출해 평가하고 수집 · 내보낸다 (--provider=claude|openai|local --model=<id>)
 *
 * 세부 옵션이 필요할 때:
 *   pnpm quality:collect --profile=static --run-id=local-static-01
 *   pnpm quality:collect --profile=core --run-id=local-quality-01
 *   pnpm quality:collect --profile=core --run-id=<id> --import=bundle.size-limit:tmp/observability/imports/size-limit.json --only-imports
 *   pnpm quality:export --run-id=local-static-01
 *
 * 순서: 계약 lib build → collect(tmp/observability) → export(apps/devhub/public/observability) → Vite.
 */

export class CliUsageError extends Error {}

export type CliCommand =
  | {
      command: 'collect';
      profile: Exclude<Profile, 'eval'>;
      runId: string;
      imports: Record<string, string>;
      onlyImports: boolean;
    }
  | { command: 'collect'; profile: 'eval'; runId: string; from: string }
  | { command: 'export'; runId: string }
  | { command: 'run'; profile: RunProfile; runId: string; live: LiveFlags };

/** `eval-live` 가 평가 harness 에 그대로 넘기는 모델 선택 (`--provider` · `--model` 등). */
type LiveFlags = Partial<Record<(typeof LIVE_FLAGS)[number], string>>;
const LIVE_FLAGS = ['provider', 'model', 'base-url', 'context-limit'] as const;

/**
 * `run` 이 한 번에 수집 · 내보내기 하는 profile. DevHub 평가 묶음과 1:1 이다.
 * `eval-live` 는 smoke 대신 모델을 실제로 호출하는 평가이고, 수집은 eval profile 로 한다.
 */
const RUN_PROFILES = ['core', 'eval', 'eval-live'] as const;
type RunProfile = (typeof RUN_PROFILES)[number];

const USAGE = [
  'usage:',
  '  quality:collect --profile=static --run-id=<id>',
  `  quality:collect --profile=core --run-id=<id> [--import=<command-id>:${IMPORTS_DIR}/<file>]... [--only-imports]`,
  `  quality:collect --profile=eval --from=${EVALS_DIR}/<dir> --run-id=<id>`,
  '  quality:export --run-id=<id>',
  '  quality:core | quality:eval | quality:eval:live   (run --profile=core|eval|eval-live [--run-id=<id>])',
  '  quality:eval:live --provider=claude|openai|local --model=<id> [--base-url=<url>] [--context-limit=<토큰>]',
].join('\n');

const VALUE_FLAGS: Record<CliCommand['command'], readonly string[]> = {
  collect: ['profile', 'run-id', 'import', 'from'],
  export: ['run-id'],
  run: ['profile', 'run-id', ...LIVE_FLAGS],
};

const pad = (value: number) => String(value).padStart(2, '0');

/** `core-20261001-101500`(이 컴퓨터의 시각) — 같은 profile 의 실행이 시각 순으로 정렬된다. */
export const defaultRunId = (profile: RunProfile, now: Date) =>
  `${profile}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

const unexpected = (arg: string) => new CliUsageError(`unexpected argument ${arg}\n${USAGE}`);

/** `--import=<command-id>:<path>`. core 명령이고 imports 디렉터리 안의 경로여야 한다. */
const parseImports = (specs: string[]): Record<string, string> => {
  const imports: Record<string, string> = {};
  for (const spec of specs) {
    const separator = spec.indexOf(':');
    const commandId = spec.slice(0, separator);
    const importPath = spec.slice(separator + 1);
    if (
      separator <= 0 ||
      !PROFILE_COMMANDS.core.includes(commandId) ||
      !importPath.startsWith(`${IMPORTS_DIR}/`) ||
      commandId in imports
    ) {
      throw unexpected(`--import=${spec}`);
    }
    imports[commandId] = importPath;
  }
  return imports;
};

/** 등록된 subcommand·flag 만 받는다. 명령이나 argv 를 넘길 방법이 없다. */
export const parseArgs = (argv: string[], now = new Date()): CliCommand => {
  const [command, ...rest] = argv;
  if (command !== 'collect' && command !== 'export' && command !== 'run') {
    throw new CliUsageError(USAGE);
  }

  const flags = new Map<string, string>();
  const importSpecs: string[] = [];
  let onlyImports = false;
  for (const arg of rest) {
    const [, key, value] = /^--([a-z-]+)(?:=(.+))?$/.exec(arg) ?? [];
    if (command === 'collect' && key === 'only-imports' && value === undefined && !onlyImports) {
      onlyImports = true;
      continue;
    }
    if (!key || value === undefined || !VALUE_FLAGS[command].includes(key)) throw unexpected(arg);
    if (key === 'import') {
      importSpecs.push(value);
      continue;
    }
    if (flags.has(key)) throw unexpected(arg);
    flags.set(key, value);
  }

  if (command === 'run') {
    const profile = RUN_PROFILES.find((candidate) => candidate === flags.get('profile'));
    if (!profile) {
      throw new CliUsageError(`--profile must be one of ${RUN_PROFILES.join(', ')}\n${USAGE}`);
    }
    const runId = runIdSchema.safeParse(flags.get('run-id') ?? defaultRunId(profile, now));
    if (!runId.success) throw new CliUsageError(`--run-id must be lowercase kebab-case\n${USAGE}`);
    const live = Object.fromEntries(
      LIVE_FLAGS.flatMap((key) => (flags.has(key) ? [[key, flags.get(key)]] : [])),
    ) as LiveFlags;
    if (profile !== 'eval-live' && Object.keys(live).length > 0) {
      throw new CliUsageError(`--${Object.keys(live)[0]} is an eval-live option\n${USAGE}`);
    }
    return { command, profile, runId: runId.data, live };
  }

  const runId = runIdSchema.safeParse(flags.get('run-id'));
  if (!runId.success) throw new CliUsageError(`--run-id must be lowercase kebab-case\n${USAGE}`);
  if (command === 'export') return { command, runId: runId.data };

  const profile = PROFILES.find((candidate) => candidate === flags.get('profile'));
  if (!profile)
    throw new CliUsageError(`--profile must be one of ${PROFILES.join(', ')}\n${USAGE}`);
  const from = flags.get('from');
  if (profile === 'eval') {
    if (!from || !EVAL_DIR_PATTERN.test(from) || importSpecs.length > 0 || onlyImports) {
      throw new CliUsageError(`--profile=eval needs only --from=${EVALS_DIR}/<dir>\n${USAGE}`);
    }
    return { command, profile, runId: runId.data, from };
  }
  if (from !== undefined) throw new CliUsageError(`--from is an eval profile option\n${USAGE}`);
  if (profile !== 'core' && (importSpecs.length > 0 || onlyImports)) {
    throw new CliUsageError(`--import and --only-imports are core profile options\n${USAGE}`);
  }
  return { command, profile, runId: runId.data, imports: parseImports(importSpecs), onlyImports };
};

const COMMAND_TIMEOUT_MS = 15 * 60 * 1000;

const collect = async (args: Extract<CliCommand, { command: 'collect' }>) => {
  const common = {
    workspaceRoot: REPO_ROOT,
    runId: args.runId,
    git: gitReader(REPO_ROOT),
    env: process.env,
    now: () => new Date(),
    toolVersions: readToolVersions(REPO_ROOT, process.env),
  };
  if (args.profile === 'eval') {
    return collectEval({
      ...common,
      from: args.from,
      tokenizerVersion: readTokenizerVersion(REPO_ROOT),
      readBaseline: (split) => readEvalBaselineFile(baselineFile(split)),
    });
  }
  if (args.profile === 'static') {
    return collectStatic(common);
  }

  const tokenizerVersion = readTokenizerVersion(REPO_ROOT);
  return collectCore({
    ...common,
    exec: runArgv,
    timeoutMs: COMMAND_TIMEOUT_MS,
    imports: args.imports,
    onlyImports: args.onlyImports,
    collectContexts: async () => [
      ...(await collectPackageScenarios({
        workspaceRoot: REPO_ROOT,
        targets: MEASURE_TARGETS,
        tokenModel: openAIModelFromEnv(),
        tokenizerVersion,
      })),
      ...(await collectVariantContexts({ variants: Object.values(VARIANTS), tokenizerVersion })),
    ],
  });
};

const EVAL_RUNNER = 'tools/evals/consumer/runner/run.ts';

/** live 평가는 모델 호출이 이어져 smoke 보다 오래 걸린다. */
const LIVE_TIMEOUT_MS = 60 * 60 * 1000;

/**
 * 평가 harness 를 돌려 `tmp/llm-evals/<runId>` 에 산출물을 쓴다. smoke 는 고정 입력이라 외부 호출이
 * 없고, live 는 Anthropic API 를 부른다 — 키는 이 프로세스의 환경변수로만 넘어가고 어디에도 쓰지 않는다.
 */
const runHarness = async (runId: string, mode: 'smoke' | 'live', live: LiveFlags = {}) => {
  const argv = [process.execPath, '--import', 'tsx', EVAL_RUNNER, `--${mode}`, '--split=dev'];
  const flags = Object.entries(live).map(([key, value]) => `--${key}=${value}`);
  const result = await runArgv([...argv, ...flags, `--run-id=${runId}`], {
    cwd: REPO_ROOT,
    timeoutMs: mode === 'live' ? LIVE_TIMEOUT_MS : COMMAND_TIMEOUT_MS,
  });
  if (result.stderr) console.error(result.stderr.trim());
  if (result.exitCode !== 0) throw new Error(`${mode} eval failed (exit ${result.exitCode})`);
  return `${EVALS_DIR}/${runId}`;
};

const storeRoot = path.join(REPO_ROOT, STORE_ROOT);

const collectAndStore = async (args: Extract<CliCommand, { command: 'collect' }>) => {
  const { artifact, raw } = await collect(args);
  await writeRun(storeRoot, { artifact, raw });
  console.log(
    `collected ${args.runId} (${args.profile}, ${artifact.metadata.state}) -> ${STORE_ROOT}/runs/${args.runId}`,
  );
};

const exportToDevHub = async (runId: string) => {
  const written = await exportRun({
    storeRoot,
    publicRoot: path.join(REPO_ROOT, PUBLIC_ROOT),
    runId,
  });
  console.log(`exported ${runId} -> ${PUBLIC_ROOT}/${written}`);
};

const main = async (argv: string[]) => {
  const args = parseArgs(argv);
  if (args.command === 'collect') return collectAndStore(args);
  if (args.command === 'export') return exportToDevHub(args.runId);

  const { runId } = args;
  await collectAndStore(
    args.profile === 'core'
      ? { command: 'collect', profile: 'core', runId, imports: {}, onlyImports: false }
      : {
          command: 'collect',
          profile: 'eval',
          runId,
          from: await runHarness(runId, args.profile === 'eval-live' ? 'live' : 'smoke', args.live),
        },
  );
  await exportToDevHub(args.runId);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
