import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { type Profile, PROFILES, runIdSchema } from '@berrypjh/observability-contracts';

import { baselineFile } from '../../evals/consumer/ci/baseline';
import { VARIANTS } from '../../evals/consumer/variants/index';
import { openAIModelFromEnv } from '../../lib/token-count';
import { REPO_ROOT, TARGETS } from '../generate-consumer-catalog/config';
import { buildCatalog } from '../generate-consumer-catalog/generate';
import { serializeCatalog } from '../generate-consumer-catalog/schema';
import { MEASURE_TARGETS } from '../measure-tokens/registry';

import {
  collectPackageScenarios,
  collectVariantContexts,
  readTokenizerVersion,
} from './collectors/context';
import { collectCore } from './collectors/core';
import { collectDesignSystem } from './collectors/design-system';
import { collectEval, EVAL_DIR_PATTERN, EVALS_DIR } from './collectors/eval';
import { readEvalBaselineFile } from './collectors/eval-baseline';
import { runArgv } from './collectors/exec';
import { IMPORTS_DIR } from './collectors/imports';
import { collectPackageSurfaces } from './collectors/package-surface';
import { exportRun, PUBLIC_ROOT } from './export';
import { PROFILE_COMMANDS } from './registry';
import { collectStatic, gitReader, readToolVersions } from './static';
import { STORE_ROOT, writeRun } from './store';

/**
 * quality-lab 수집 CLI.
 *
 *   pnpm quality:collect --profile=static --run-id=local-static-01
 *   pnpm quality:collect --profile=core --run-id=local-quality-01
 *   pnpm quality:collect --profile=core --run-id=<id> --import=test.react-ui:tmp/quality-lab/imports/react-ui.json --only-imports
 *   pnpm quality:export --run-id=local-static-01
 *
 * 순서: 계약 lib build → collect(tmp/quality-lab) → export(apps/quality-lab/public/observability) → Vite.
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
  | { command: 'export'; runId: string };

const USAGE = [
  'usage:',
  '  quality:collect --profile=static --run-id=<id>',
  `  quality:collect --profile=core --run-id=<id> [--import=<command-id>:${IMPORTS_DIR}/<file>]... [--only-imports]`,
  `  quality:collect --profile=eval --from=${EVALS_DIR}/<dir> --run-id=<id>`,
  '  quality:export --run-id=<id>',
].join('\n');

const VALUE_FLAGS: Record<CliCommand['command'], readonly string[]> = {
  collect: ['profile', 'run-id', 'import', 'from'],
  export: ['run-id'],
};

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
export const parseArgs = (argv: string[]): CliCommand => {
  const [command, ...rest] = argv;
  if (command !== 'collect' && command !== 'export') throw new CliUsageError(USAGE);

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

  const runId = runIdSchema.safeParse(flags.get('run-id'));
  if (!runId.success) throw new CliUsageError(`--run-id must be lowercase kebab-case\n${USAGE}`);
  if (command === 'export') return { command, runId: runId.data };

  const profile = PROFILES.find((candidate) => candidate === flags.get('profile'));
  if (!profile)
    throw new CliUsageError(`--profile must be one of ${PROFILES.join(', ')}\n${USAGE}`);
  if (profile === 'a11y') {
    throw new CliUsageError(
      `--profile=a11y is collected by pnpm quality --base-url=http://localhost:4300\n${USAGE}`,
    );
  }
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

/** 기존 catalog generator 로 메모리에서만 다시 만든다. dist 에 쓰지 않는다. */
const regenerateCatalog = async (packagePath: string): Promise<string | null> => {
  const target = Object.values(TARGETS).find((candidate) => candidate.packageRoot === packagePath);
  return target ? serializeCatalog(await buildCatalog(target)) : null;
};

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
    return collectStatic({
      ...common,
      collectDesign: async () => ({
        designSystem: await collectDesignSystem({ workspaceRoot: REPO_ROOT }),
        packageSurfaces: await collectPackageSurfaces({
          workspaceRoot: REPO_ROOT,
          regenerateCatalog: regenerateCatalog,
        }),
      }),
    });
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

const main = async (argv: string[]) => {
  const args = parseArgs(argv);
  const storeRoot = path.join(REPO_ROOT, STORE_ROOT);

  if (args.command === 'collect') {
    const { artifact, raw } = await collect(args);
    await writeRun(storeRoot, { artifact, raw });
    console.log(
      `collected ${args.runId} (${args.profile}, ${artifact.metadata.state}) -> ${STORE_ROOT}/runs/${args.runId}`,
    );
    return;
  }

  const written = await exportRun({
    storeRoot,
    publicRoot: path.join(REPO_ROOT, PUBLIC_ROOT),
    runId: args.runId,
  });
  console.log(`exported ${args.runId} -> ${PUBLIC_ROOT}/${written}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
