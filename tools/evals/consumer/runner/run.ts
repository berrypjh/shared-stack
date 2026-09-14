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
 *
 * live executor가 없으면 실패한다. 가짜 baseline을 만들지 않는다.
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
  const replay = typeof args.replay === 'string' ? args.replay : null;
  const executor: EvalExecutor = smoke
    ? {
        name: 'smoke-scripted',
        model: null,
        run: async ({ task }) => smokeOutcome(task),
      }
    : replay
      ? createReplayExecutor(await readTraces(path.resolve(REPO_ROOT, replay)))
      : unavailableExecutor;

  const result = await runEval({
    split,
    trials,
    variantIds,
    executor,
    k: Number(str(args, 'k', String(DEFAULT_K))),
    gitSha: gitSha(),
    ref: process.env.GITHUB_REF ?? null,
    compareBaseline: Boolean(args['compare-baseline']),
    taskIds: smoke
      ? SMOKE_TASK_IDS
      : str(args, 'tasks', '')
        ? str(args, 'tasks', '').split(',').filter(Boolean)
        : undefined,
    runId,
    createdAt: new Date().toISOString(),
  });

  await writeRunArtifacts(outDir, result);

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
