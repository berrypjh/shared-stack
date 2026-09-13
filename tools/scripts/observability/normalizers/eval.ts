import {
  type EvalRun,
  evalRunSchema,
  EXECUTOR_CLASSES,
  sanitizeExcerpt,
  UNKNOWN,
} from '@berrypjh/observability-contracts';

import { NO_BASELINE_MESSAGE } from '../../../evals/consumer/ci/compare';
import type {
  Agg,
  Rate,
  RunSummary,
  VariantMetrics,
} from '../../../evals/consumer/reporters/aggregate';
import { buildConfusion, type ConfusionMatrix } from '../../../evals/consumer/reporters/confusion';
import type { GradedTrace } from '../../../evals/consumer/runner/trace';
import type { VariantContext } from '../../../evals/consumer/variants/context';
import { type VariantId, VARIANTS } from '../../../evals/consumer/variants/index';

/**
 * eval summary·trace → `EvalRun`. 값은 옮기기만 하고, 없는 값에 이유를 붙이고,
 * 공개할 수 없는 내용 (변경 파일 내용·held-out gold·발췌) 을 걷어낸다.
 */

export type Imported<T> =
  | { status: 'parsed'; value: T }
  | { status: 'missing' | 'invalid' | 'not-run'; reason: string };

export type EvalImport = {
  sourceId: string;
  summary: Imported<RunSummary>;
  traces: Imported<GradedTrace[]>;
  routing: Imported<{ split: string; matrix: ConfusionMatrix }>;
  context: Imported<VariantContext[]>;
  /** 수집 시점에 `tools/evals/consumer/baseline/<split>.json` 이 있는지. */
  baselineExists: boolean;
};

type ExecutorClass = (typeof EXECUTOR_CLASSES)[number];
type Notice = EvalRun['notices'][number];
type RoutingEntry = {
  source: 'trace-grades' | 'deterministic-resolver';
  variant: string | null;
  matrix: ConfusionMatrix;
};

const HELD_OUT_SPLIT = 'test';
const GIT_SHA = /^[0-9a-f]{40}$/;
const REASON_MAX = 500;
/** 모델 없이 결과를 만드는 executor. 성공률을 LLM 성능으로 읽으면 안 된다. */
const NO_LIVE_EXECUTOR = new Set<ExecutorClass>(['harness-smoke', 'scripted', 'unavailable']);
/** repair hook 을 주지 않는 executor (run.ts 의 smoke·replay·unavailable, 테스트용 scripted). */
const NO_REPAIR_HOOK = new Set<ExecutorClass>([
  'harness-smoke',
  'scripted',
  'replay',
  'unavailable',
]);

export const executorClassOf = (executor: string): ExecutorClass => {
  if (executor === 'smoke-scripted') return 'harness-smoke';
  if (executor === 'scripted' || executor === 'unavailable') return executor;
  if (/^replay\(.*\)$/.test(executor)) return 'replay';
  return 'unknown';
};

/** pipeline 과 같은 capability 로 판정한다: `run-verification` 은 harness 실행, `repair` 는 repair loop. */
export const variantProvenance = (variantId: string, executorClass: ExecutorClass) => {
  const variant = VARIANTS[variantId as VariantId];
  if (!variant) throw new Error(`unknown eval variant ${variantId}`);
  const capabilities = variant.allowedCapabilities;
  const repair = !capabilities.includes('repair')
    ? 'not-in-variant'
    : NO_REPAIR_HOOK.has(executorClass)
      ? 'no-repair-hook'
      : 'unknown';
  return {
    verificationAuthority: capabilities.includes('run-verification')
      ? ('harness-executed' as const)
      : ('executor-reported' as const),
    repair: repair as 'not-in-variant' | 'no-repair-hook' | 'unknown',
  };
};

const rateOf = (rate: Rate) => ({
  kind: 'rate' as const,
  ...rate,
  nullReason:
    rate.value !== null ? null : rate.denominator === 0 ? 'zero-denominator' : 'source-null',
});

const aggregateOf = (aggregate: Agg) => ({
  kind: 'aggregate' as const,
  ...aggregate,
  nullReason: aggregate.value !== null ? null : aggregate.n === 0 ? 'no-samples' : 'source-null',
});

const groupOf = (group: Record<string, Rate | Agg>) =>
  Object.fromEntries(
    Object.entries(group).map(([key, metric]) => [
      key,
      'n' in metric ? aggregateOf(metric) : rateOf(metric),
    ]),
  );

const variantOf = (metrics: VariantMetrics, executorClass: ExecutorClass) => ({
  variant: metrics.variant,
  label: metrics.label,
  tasks: metrics.tasks,
  trials: metrics.trials,
  primary: groupOf(metrics.primary),
  secondary: groupOf(metrics.secondary),
  diagnostic: groupOf(metrics.diagnostic),
  failureBreakdown: metrics.failureBreakdown,
  unsupported: metrics.unsupported,
  context: {
    tokens: metrics.context.tokens,
    files: metrics.context.files.length,
    missingPaths: metrics.context.missingPaths,
    tokenModel: metrics.context.tokenModel,
    routed:
      metrics.context.routed &&
      Object.fromEntries(
        Object.entries(metrics.context.routed).map(([platform, size]) => [
          platform,
          { tokens: size.tokens, files: size.files.length },
        ]),
      ),
  },
  ...variantProvenance(metrics.variant, executorClass),
});

const traceId = (trace: GradedTrace) => `${trace.variant}::${trace.taskId}::${trace.trial}`;

const excerptOf = (text: string | null) => (text === null ? null : sanitizeExcerpt(text) || null);

/** 지문은 한 줄 text 로 둔다. */
const fingerprintOf = (text: string | null) =>
  text === null
    ? null
    : sanitizeExcerpt(text)
        .replace(/\p{Cc}+/gu, ' ')
        .trim() || null;

const traceOf = (trace: GradedTrace) => {
  const heldOut = trace.split === HELD_OUT_SPLIT;
  const { routing, retrieval, verification, success } = trace.grade;
  return {
    id: traceId(trace),
    variant: trace.variant,
    taskId: trace.taskId,
    trial: trace.trial,
    split: trace.split,
    expectedPlatform: trace.expectedPlatform,
    selectedPlatform: trace.selectedPlatform,
    claimedSuccess: trace.claimedSuccess,
    routing,
    retrieval: {
      k: retrieval.k,
      requiredCount: retrieval.required.length,
      hitsAtK: retrieval.hitsAtK,
      recallAtK: retrieval.recallAtK,
      reciprocalRank: retrieval.reciprocalRank,
      firstHitRank: retrieval.firstHitRank,
      evidenceDuplicates: retrieval.duplicateRetrievals,
      toolCallDuplicates: trace.toolCalls.filter((call) => call.duplicate).length,
      nullReason: retrieval.required.length === 0 ? 'no-required-evidence' : null,
      required: heldOut ? null : retrieval.required,
      retrieved: heldOut ? null : trace.retrieved,
    },
    verification: {
      requiredKinds: verification.requiredKinds,
      missingRequired: verification.missingRequired,
      failedRequired: verification.failedRequired,
      unsupportedRequired: verification.unsupportedRequired,
      invocationRate: verification.invocationRate,
      passed: verification.passed,
      runs: trace.verification.map((run) => ({
        kind: run.kind,
        required: run.required,
        status: run.status,
        attempt: run.attempt,
        durationMs: run.durationMs,
        exitCode: run.exitCode,
        failureFingerprint: heldOut ? null : fingerprintOf(run.failureFingerprint),
        excerpt: heldOut ? null : excerptOf(run.excerpt),
      })),
    },
    success,
    repair: {
      attempts: trace.repairAttempts,
      succeeded: trace.repairSucceeded,
      repeatedFailures: trace.repeatedFailures,
    },
    changedFiles: trace.changedFiles.map((file) => ({ path: file.path, content: 'redacted' })),
  };
};

/** summary 의 합계를 trace grade 에서 다시 세어 본다. 어긋나면 trace 를 믿지 않는다. */
const totalMismatches = (summary: RunSummary, traces: GradedTrace[]): string[] => {
  const issues: string[] = [];
  const known = new Set(summary.variants.map((variant) => variant.variant));
  const stray = [...new Set(traces.map((trace) => trace.variant))].filter((id) => !known.has(id));
  if (stray.length > 0)
    issues.push(`traces have variants missing from summary: ${stray.join(', ')}`);
  const otherSplit = traces.filter((trace) => trace.split !== summary.split);
  if (otherSplit.length > 0)
    issues.push(`${otherSplit.length} traces are not split ${summary.split}`);

  for (const metrics of summary.variants) {
    const own = traces.filter((trace) => trace.variant === metrics.variant);
    const claimed = own.filter((trace) => trace.grade.success.claimCounted);
    const pairs: [string, number, number][] = [
      ['trials', metrics.trials, own.length],
      [
        'verifiedTaskSuccessRate.numerator',
        metrics.primary.verifiedTaskSuccessRate.numerator,
        own.filter((trace) => trace.grade.success.taskSucceeded).length,
      ],
      [
        'falseSuccessRate.numerator',
        metrics.primary.falseSuccessRate.numerator,
        claimed.filter((trace) => trace.grade.success.falseSuccess).length,
      ],
      [
        'falseSuccessRate.denominator',
        metrics.primary.falseSuccessRate.denominator,
        claimed.length,
      ],
    ];
    for (const [name, fromSummary, fromTraces] of pairs) {
      if (fromSummary !== fromTraces) {
        issues.push(`${metrics.variant} ${name}: summary ${fromSummary}, traces ${fromTraces}`);
      }
    }
    const matrix = summary.routingConfusion?.[metrics.variant];
    const recount = buildConfusion(
      own.map((trace) => ({ expected: trace.expectedPlatform, predicted: trace.selectedPlatform })),
    );
    if (matrix && JSON.stringify(matrix) !== JSON.stringify(recount)) {
      issues.push(`${metrics.variant} routing confusion differs from trace selections`);
    }
  }
  return issues;
};

const clip = (text: string) =>
  text.length <= REASON_MAX ? text : `${text.slice(0, REASON_MAX - 1)}…`;

const statusOf = (imported: Imported<unknown>) =>
  imported.status === 'parsed'
    ? { status: 'parsed' as const, reason: null }
    : { status: imported.status, reason: clip(imported.reason) };

const unsupportedNotice = (summary: RunSummary, traces: GradedTrace[] | null): Notice | null => {
  const rates = summary.variants
    .map((variant) => ({
      variant: variant.variant,
      rate: variant.secondary.verificationUnsupportedRate,
    }))
    .filter(({ rate }) => rate.numerator > 0);
  if (rates.length === 0) return null;
  const counts = rates.map(
    ({ variant, rate }) => `${variant} ${rate.numerator}/${rate.denominator}`,
  );
  const examples = (traces ?? [])
    .filter((trace) => trace.grade.verification.unsupportedRequired.length > 0)
    .map((trace) => `${traceId(trace)} ${trace.grade.verification.unsupportedRequired.join('+')}`);
  return {
    code: 'unsupported-required-check',
    message: clip(
      `required check 를 이 harness 에서 실행할 수 없는 trial 이 있다 (${counts.join(', ')})` +
        (examples.length > 0 ? ` — ${examples.join(', ')}` : ''),
    ),
  };
};

const noticesOf = (
  input: EvalImport,
  summary: RunSummary | null,
  traces: GradedTrace[] | null,
  executorClass: ExecutorClass | null,
  tracesStatus: ReturnType<typeof statusOf>,
  hookless: boolean,
): Notice[] => {
  const notices: Notice[] = [];
  const add = (code: Notice['code'], message: string) =>
    notices.push({ code, message: clip(message) });

  if (executorClass === 'harness-smoke') {
    add(
      'harness-smoke',
      'smoke-scripted 는 catalog → resolver → grader → verification → report 사슬을 확인하는 고정 입력이다. 모델 성능이 아니다',
    );
  }
  if (summary && executorClass && NO_LIVE_EXECUTOR.has(executorClass)) {
    add(
      'no-live-executor',
      `live agent executor 없이 만든 결과다 (executor: ${summary.executor}). LLM 성공률로 읽지 않는다`,
    );
  }
  if (input.summary.status === 'not-run') {
    add(
      'no-live-executor',
      'executor 를 돌리지 않은 산출물이다 — task success·false success 는 not-run 이다',
    );
  }
  if (summary) {
    if (
      summary.comparison?.status === 'no-baseline' ||
      (!summary.comparison && !input.baselineExists)
    ) {
      add('no-baseline', NO_BASELINE_MESSAGE);
    } else if (!summary.comparison) {
      add(
        'baseline-not-requested',
        `tools/evals/consumer/baseline/${summary.split}.json 이 있지만 이 run 은 baseline 비교를 요청하지 않았다`,
      );
    }
    const unsupported = unsupportedNotice(summary, traces);
    if (unsupported) notices.push(unsupported);
  }
  if (executorClass === 'replay' && hookless) {
    add(
      'replay-without-repair-hook',
      'replay 는 repair hook 이 없어 D5 repair loop 가 수정을 받지 못한다',
    );
  }
  const halves = [input.summary.status, tracesStatus.status];
  if (
    halves.includes('invalid') ||
    (halves.includes('parsed') && !halves.every((s) => s === 'parsed'))
  ) {
    add('partial-import', 'summary 와 trace 중 일부만 가져왔다 — 전체 결과로 읽지 않는다');
  }
  return notices;
};

export const normalizeEvalRun = (input: EvalImport): EvalRun => {
  const summary = input.summary.status === 'parsed' ? input.summary.value : null;
  let tracesStatus = statusOf(input.traces);
  let traces = input.traces.status === 'parsed' ? input.traces.value : null;
  if (summary && traces) {
    const issues = totalMismatches(summary, traces);
    if (issues.length > 0) {
      tracesStatus = {
        status: 'invalid',
        reason: clip(`summary and traces disagree: ${issues.join('; ')}`),
      };
      traces = null;
    }
  }

  let routingStatus = statusOf(input.routing);
  const routing: RoutingEntry[] = summary
    ? summary.variants.flatMap((variant) => {
        const matrix = summary.routingConfusion?.[variant.variant];
        return matrix
          ? [{ source: 'trace-grades' as const, variant: variant.variant, matrix }]
          : [];
      })
    : [];
  if (input.routing.status === 'parsed') {
    const { split, matrix } = input.routing.value;
    if (summary && summary.split !== split) {
      routingStatus = {
        status: 'invalid',
        reason: `routing.json split ${split} 이 summary split ${summary.split} 와 다르다`,
      };
    } else {
      routing.push({ source: 'deterministic-resolver', variant: null, matrix });
    }
  }

  const executorClass = summary ? executorClassOf(summary.executor) : null;
  const variants = summary
    ? summary.variants.map((metrics) => variantOf(metrics, executorClassOf(summary.executor)))
    : [];

  return evalRunSchema.parse({
    sourceId: input.sourceId,
    origin: summary && {
      runId: summary.runId,
      createdAt: summary.createdAt,
      split: summary.split,
      gitSha: summary.gitSha && GIT_SHA.test(summary.gitSha) ? summary.gitSha : UNKNOWN,
      executor: summary.executor,
      model: summary.model,
      harnessVersion: summary.harnessVersion,
      k: summary.k,
      taskCount: summary.taskCount,
      trialsPerTask: summary.trialCount,
      conditions: summary.conditions,
    },
    executorClass,
    import: {
      summary: statusOf(input.summary),
      traces: tracesStatus,
      routing: routingStatus,
      context: statusOf(input.context),
    },
    notices: noticesOf(
      input,
      summary,
      traces,
      executorClass,
      tracesStatus,
      variants.some((variant) => variant.repair === 'no-repair-hook'),
    ),
    variants,
    routing,
    traceCount: traces ? traces.length : null,
    traces: traces ? traces.map(traceOf) : [],
  });
};
