import fs from 'node:fs/promises';
import path from 'node:path';

import { readBaseline } from '../ci/baseline';
import { compareToBaseline } from '../ci/compare';
import { buildConditions } from '../ci/conditions';
import { DEFAULT_K, gradePublicImport, gradeTask, loadPackageSurfaces } from '../graders';
import { aggregateVariant, confusionByVariant, type RunSummary } from '../reporters/aggregate';
import { renderMarkdown } from '../reporters/markdown';
import { measureVariantContext } from '../variants/context';
import { resolveVariants } from '../variants/index';
import { executePlan } from '../verification/execute';
import { planVerifications } from '../verification/policy';
import { runVerificationLoop } from '../verification/repair';
import { materializeWorkspace } from '../verification/workspace';

import { loadDataset } from './dataset';
import type { EvalExecutor } from './executor';
import { fromRepoRoot } from './paths';
import type { ConsumerEvalTask, Split, Trace } from './schema';
import { type GradedTrace, writeTraces } from './trace';
import { HARNESS_VERSION } from './version';

/** D4/D5에서 harness가 직접 검증을 돌린다 — executor가 보고한 값을 믿지 않는다. */
const VERIFY_CAPABILITY = 'run-verification';
const REPAIR_CAPABILITY = 'repair';

export type RunOptions = {
  split: Split;
  trials: number;
  variantIds: string[];
  executor: EvalExecutor;
  k?: number;
  gitSha: string | null;
  runId: string;
  createdAt: string;
  /** 주면 그 taskId만 돌린다. 없는 id가 있으면 조용히 넘기지 않고 실패한다. */
  taskIds?: string[];
  /** git ref (CI에서 전달). 조건 metadata에만 쓴다. */
  ref?: string | null;
  /** baseline 스냅샷과 비교할지. 없으면 "baseline 없음"으로 보고한다. */
  compareBaseline?: boolean;
};

export type RunResult = { summary: RunSummary; traces: GradedTrace[] };

type VerifyArgs = {
  task: ConsumerEvalTask;
  outcome: Awaited<ReturnType<EvalExecutor['run']>>;
  surfaces: Awaited<ReturnType<typeof loadPackageSurfaces>>;
  dir: string;
  repair: EvalExecutor['repair'];
};

/**
 * fixture + agent 변경으로 임시 workspace를 만들고 required check를 실제로 돌린다.
 * executor가 스스로 보고한 verification은 여기서 실측 결과로 교체된다.
 */
const verifyOutcome = async ({ task, outcome, surfaces, dir, repair }: VerifyArgs) => {
  let files = outcome.changedFiles;
  await materializeWorkspace(task.fixture, files, dir);

  const plans = planVerifications(task, { workspaceDir: dir });
  const loop = await runVerificationLoop({
    plans,
    execute: (plan, attempt) =>
      executePlan(plan, {
        attempt,
        inProcess: {
          'public-import': () => {
            const grade = gradePublicImport(files, surfaces);
            return {
              passed: grade.passed,
              excerpt: grade.violations
                .map((v) => `${v.file}: ${v.kind} — ${v.specifier}`)
                .join('\n'),
            };
          },
        },
      }),
    repair,
    applyRepair: async (changed) => {
      files = [...files.filter((f) => !changed.some((c) => c.path === f.path)), ...changed];
      await materializeWorkspace(task.fixture, files, dir);
    },
  });

  return {
    ...outcome,
    changedFiles: files,
    verification: loop.runs,
    repairAttempts: loop.repairAttempts,
    repairSucceeded: loop.repairSucceeded,
    repeatedFailures: loop.repeatedFailures,
    repairTokens: loop.repairTokens ?? outcome.repairTokens,
    toolCalls: [...outcome.toolCalls, ...loop.repairToolCalls],
  };
};

/** dataset × variant × trial을 돌려 채점된 trace와 summary를 만든다. IO는 하지 않는다. */
export const runEval = async ({
  split,
  trials,
  variantIds,
  executor,
  k = DEFAULT_K,
  gitSha,
  runId,
  createdAt,
  taskIds,
  ref = null,
  compareBaseline = false,
}: RunOptions): Promise<RunResult> => {
  const all = await loadDataset(split);
  const tasks = taskIds ? all.filter((t) => taskIds.includes(t.taskId)) : all;
  if (taskIds) {
    const missing = taskIds.filter((id) => !all.some((t) => t.taskId === id));
    if (missing.length) throw new Error(`unknown taskId(s) in ${split}: ${missing.join(', ')}`);
  }
  const variants = resolveVariants(variantIds);
  const surfaces = await loadPackageSurfaces();

  // 검증용 임시 workspace는 아티팩트 디렉터리 밖에 둔다 — report/trace만 업로드된다.
  const verifyRoot = fromRepoRoot('tmp/llm-evals/work', runId);

  const traces: GradedTrace[] = [];
  const metrics = [];
  for (const variant of variants) {
    const verifies = variant.allowedCapabilities.includes(VERIFY_CAPABILITY);
    const repairs = variant.allowedCapabilities.includes(REPAIR_CAPABILITY);
    const context = await measureVariantContext(variant);
    const variantTraces: GradedTrace[] = [];
    for (const task of tasks) {
      for (let trial = 1; trial <= trials; trial += 1) {
        let outcome = await executor.run({ runId, split, task, variant: variant.id, trial });
        if (verifies) {
          outcome = await verifyOutcome({
            task,
            outcome,
            surfaces,
            dir: path.join(verifyRoot, variant.id, `${task.taskId}-${trial}`),
            repair: repairs ? executor.repair : undefined,
          });
        }
        const trace: Trace = {
          runId,
          taskId: task.taskId,
          variant: variant.id,
          trial,
          split,
          gitSha,
          executor: executor.name,
          model: executor.model,
          harnessVersion: HARNESS_VERSION,
          expectedPlatform: task.expected.platform,
          expectedPackages: task.expected.packages,
          ...outcome,
        };
        variantTraces.push({ ...trace, grade: gradeTask(task, trace, { surfaces, k }) });
      }
    }
    traces.push(...variantTraces);
    metrics.push(aggregateVariant(variant, context, tasks, variantTraces));
  }

  const conditions = await buildConditions({
    gitSha,
    ref,
    split,
    variants,
    trials,
    executor: executor.name,
    model: executor.model,
  });

  const summary: RunSummary = {
    runId,
    createdAt,
    split,
    gitSha,
    executor: executor.name,
    model: executor.model,
    harnessVersion: HARNESS_VERSION,
    taskCount: tasks.length,
    trialCount: trials,
    k,
    variants: metrics,
    routingConfusion: confusionByVariant(traces),
    conditions,
    comparison: null,
  };

  summary.comparison = compareBaseline
    ? compareToBaseline(summary, conditions, await readBaseline(split))
    : null;

  return { traces, summary };
};

/** `traces.jsonl` / `summary.json` / `report.md` 세 산출물을 쓴다. */
export const writeRunArtifacts = async (
  outDir: string,
  { summary, traces }: RunResult,
): Promise<void> => {
  await fs.mkdir(outDir, { recursive: true });
  await writeTraces(path.join(outDir, 'traces.jsonl'), traces);
  await fs.writeFile(
    path.join(outDir, 'summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  );
  await fs.writeFile(path.join(outDir, 'report.md'), renderMarkdown(summary), 'utf8');
};
