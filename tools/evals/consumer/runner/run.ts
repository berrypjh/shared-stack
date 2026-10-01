import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import { toBaseline, writeBaseline } from '../ci/baseline';
import { SMOKE_TASK_IDS, smokeOutcome } from '../ci/smoke-fixture';
import { DEFAULT_K } from '../graders';
import { renderConfusion } from '../reporters/confusion';
import { renderMarkdown } from '../reporters/markdown';
import type { VariantContext } from '../variants/context';
import { VARIANT_IDS } from '../variants/index';

import { createLiveExecutor } from './live/executor';
import { anthropicCounter, estimateCounter, LIVE_SKIPPED_FILE, preflight } from './live/preflight';
import { PROVIDER_IDS, type ProviderId, PROVIDERS } from './live/providers';
import { loadDataset } from './dataset';
import { createReplayExecutor, type EvalExecutor, unavailableExecutor } from './executor';
import { measureContexts, resolveRouting, type RoutingReport } from './offline';
import { REPO_ROOT } from './paths';
import { runEval, writeRunArtifacts } from './pipeline';
import { splitSchema } from './schema';
import { readTraces } from './trace';

/**
 * Consumer eval runner.
 *
 *   node --import tsx tools/evals/consumer/runner/run.ts --split=dev --replay=<traces.jsonl>
 *   node --import tsx tools/evals/consumer/runner/run.ts --live --provider=claude|openai|local --model=<id>
 *     [--base-url=<url>] [--context-limit=<토큰>] [--all-tasks]   (claude · openai 는 API 키 필요)
 *
 * executor(smoke · live · replay)를 고르지 않으면 실패한다. 가짜 baseline을 만들지 않는다.
 * `--live` 는 기본으로 smoke 과제만 돌리고, 첫 메시지가 컨텍스트 한도를 넘는 variant 는 빼고 이유를 남긴다.
 * `--context-only`는 executor 없이 variant 초기 컨텍스트만 실측한다.
 */

type Args = Record<string, string | true>;

const parseArgs = (argv: string[]): Args =>
  Object.fromEntries(
    argv.map((a) => {
      const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
      if (!m) throw new Error(`unrecognised argument "${a}"`);
      return [m[1], m[2] ?? true] as const;
    }),
  );

const str = (args: Args, key: string, fallback: string): string =>
  typeof args[key] === 'string' ? (args[key] as string) : fallback;

const gitSha = (): string | null => {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
};

const printContexts = (contexts: VariantContext[]): void => {
  for (const ctx of contexts) {
    const line = (
      label: string,
      size: { files: string[]; chars: number | null; tokens: number | null },
    ) =>
      `${label.padEnd(30)} files=${String(size.files.length).padStart(4)}` +
      `  chars=${(size.chars === null ? 'N/A' : size.chars.toLocaleString()).padStart(9)}` +
      `  tokens=${(size.tokens === null ? 'N/A' : size.tokens.toLocaleString()).padStart(8)}`;

    console.log(line(ctx.variant, ctx));
    if (ctx.missingPaths.length) console.log(`  missing: ${ctx.missingPaths.join(', ')}`);
    for (const [platform, size] of Object.entries(ctx.routed ?? {})) {
      console.log(line(`  └ routed:${platform}`, size));
    }
  }
};

/**
 * executor 없이 deterministic platform resolver만 돌려 routing raw data를 만든다.
 * fixture에서 관측 가능한 근거(dependencies, project tree)와 prompt만 본다.
 */
const printRouting = (report: RoutingReport): void => {
  const mismatches = report.decisions
    .filter((d) => d.predicted !== d.expected)
    .map(
      (d) =>
        `  ${d.taskId}: expected ${d.expected}, got ${d.diagnosis}` +
        ` (${d.confidence}) — ${d.evidence.map((e) => `${e.kind}:${e.value}`).join(', ')}`,
    );

  console.log(`split: ${report.split}  resolver: deterministic (no executor)\n`);
  console.log(renderConfusion(report.matrix));
  if (mismatches.length) console.log(`\nmismatches:\n${mismatches.join('\n')}`);
};

/** `--json=<file>` 이면 콘솔 출력과 같은 데이터를 JSON 으로도 남긴다. 판정·측정은 다시 하지 않는다. */
const writeJson = async (args: Args, data: unknown): Promise<void> => {
  if (typeof args.json !== 'string') return;
  const file = path.resolve(REPO_ROOT, args.json);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
  console.error(`json written to ${path.relative(REPO_ROOT, file)}`);
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const variantIds = str(args, 'variants', VARIANT_IDS.join(',')).split(',');

  if (args['context-only']) {
    const contexts = await measureContexts(variantIds);
    printContexts(contexts);
    await writeJson(args, { kind: 'context-only', executor: null, contexts });
    return;
  }

  if (args['routing-only']) {
    const report = await resolveRouting(splitSchema.parse(str(args, 'split', 'dev')));
    printRouting(report);
    await writeJson(args, { kind: 'routing-only', executor: null, ...report });
    return;
  }

  const split = splitSchema.parse(str(args, 'split', 'dev'));
  const trials = Number(str(args, 'trials', '1'));
  if (!Number.isInteger(trials) || trials < 1) throw new Error('--trials must be a positive int');
  const runId = str(args, 'run-id', `${split}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  const outDir = path.resolve(REPO_ROOT, str(args, 'out', 'tmp/llm-evals'), runId);

  const smoke = Boolean(args.smoke);
  const live = Boolean(args.live);
  const replay = typeof args.replay === 'string' ? args.replay : null;
  const listed = str(args, 'tasks', '').split(',').filter(Boolean);
  // live 는 호출마다 비용이 들어 기본을 smoke 과제로 둔다. 전체는 --all-tasks 로 연다.
  const taskIds =
    smoke || (live && listed.length === 0 && !args['all-tasks'])
      ? SMOKE_TASK_IDS
      : listed.length > 0
        ? listed
        : undefined;

  let runVariants = variantIds;
  let skipped: { variant: string; reason: string }[] = [];
  let executor: EvalExecutor;
  if (smoke) {
    executor = { name: 'smoke-scripted', model: null, run: async ({ task }) => smokeOutcome(task) };
  } else if (live) {
    // 제공자 · 모델은 기본값 없이 늘 고른다 — 어떤 모델로 돌렸는지가 명령에 드러나게.
    const providerId = str(args, 'provider', '') as ProviderId;
    const model = str(args, 'model', '');
    if (!PROVIDER_IDS.includes(providerId) || !model) {
      throw new Error(
        `--live 는 --provider(${PROVIDER_IDS.join(' · ')})와 --model 이 필요하다 (예: --provider=local --model=qwen3:14b)`,
      );
    }
    const provider: (typeof PROVIDERS)[ProviderId] = PROVIDERS[providerId];
    const apiKey = provider.keyEnv ? (process.env[provider.keyEnv] ?? null) : null;
    if (provider.keyEnv && !apiKey) {
      throw new Error(
        `--provider=${providerId} 는 ${provider.keyEnv} 가 필요하다 (루트 환경 파일 또는 환경변수)`,
      );
    }
    const baseUrl = str(args, 'base-url', provider.baseUrl);
    const limit = Number(str(args, 'context-limit', String(provider.contextLimit)));
    if (!Number.isInteger(limit) || limit < 1)
      throw new Error('--context-limit must be a positive int');
    const all = await loadDataset(split);
    const tasks = taskIds ? all.filter((task) => taskIds.includes(task.taskId)) : all;
    const exact = provider.count === 'anthropic' && apiKey;
    console.error(
      `live: ${providerId} · ${model} · ${baseUrl} · 컨텍스트 한도 ${limit} · 과제 ${tasks.length}개`,
    );
    ({ runnable: runVariants, skipped } = await preflight({
      variantIds,
      tasks,
      limit,
      count: exact ? anthropicCounter(apiKey, model) : estimateCounter,
      estimated: !exact,
    }));
    for (const item of skipped) console.error(`skip ${item.variant}: ${item.reason}`);
    if (runVariants.length === 0) throw new Error('실행할 수 있는 variant 가 없다');
    executor = createLiveExecutor({ provider: providerId, model, apiKey, baseUrl });
  } else {
    executor = replay
      ? createReplayExecutor(await readTraces(path.resolve(REPO_ROOT, replay)))
      : unavailableExecutor;
  }

  const result = await runEval({
    split,
    trials,
    variantIds: runVariants,
    executor,
    k: Number(str(args, 'k', String(DEFAULT_K))),
    gitSha: gitSha(),
    ref: process.env.GITHUB_REF ?? null,
    compareBaseline: Boolean(args['compare-baseline']),
    taskIds,
    runId,
    createdAt: new Date().toISOString(),
  });

  await writeRunArtifacts(outDir, result);
  if (live) {
    await fs.writeFile(
      path.join(outDir, LIVE_SKIPPED_FILE),
      `${JSON.stringify(skipped, null, 2)}\n`,
    );
  }

  if (args['write-baseline']) {
    if (!result.summary.conditions) throw new Error('cannot write a baseline without conditions');
    const file = await writeBaseline(split, toBaseline(result.summary, result.summary.conditions));
    console.log(`baseline written to ${path.relative(REPO_ROOT, file)}`);
  }

  console.log(renderMarkdown(result.summary));
  console.log(`\nwritten to ${path.relative(REPO_ROOT, outDir)}`);
};

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
