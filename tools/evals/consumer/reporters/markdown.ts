import type { ComparisonResult } from '../ci/compare';
import { FAILURE_CATEGORIES } from '../graders';

import type { Agg, Rate, RunSummary, VariantMetrics } from './aggregate';
import { renderConfusion } from './confusion';

/**
 * 네 축(Correctness / Routing / Context Efficiency / Verification)을 각각 독립적으로 보여준다.
 * 합성 점수(composite score)를 만들지 않는다 — 축끼리 상쇄되면 판단이 불가능해진다.
 */

const NA = 'N/A';

const pct = (r: Rate): string =>
  r.value === null ? NA : `${(r.value * 100).toFixed(1)}% (${r.numerator}/${r.denominator})`;

const ratio = (a: Agg, digits = 2): string => (a.value === null ? NA : a.value.toFixed(digits));
const pctAgg = (a: Agg): string => (a.value === null ? NA : `${(a.value * 100).toFixed(1)}%`);
const int = (a: Agg): string => (a.value === null ? NA : String(a.value));
const num = (value: number | null): string => (value === null ? NA : value.toLocaleString());

const table = (headers: string[], rows: string[][]): string =>
  [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');

const scorecard = (variants: VariantMetrics[]): string =>
  table(
    ['Variant', 'Success', 'Route', 'Evidence@K', 'Input Tokens', 'Calls', 'Verify'],
    variants.map((v) => [
      v.label,
      pct(v.primary.verifiedTaskSuccessRate),
      pct(v.primary.routingAccuracy),
      pctAgg(v.primary.requiredEvidenceRecallAtK),
      int(v.primary.medianInputTokens),
      ratio(v.secondary.toolCallsPerSuccessfulTask),
      pct(v.secondary.verificationPassRate),
    ]),
  );

const correctness = (variants: VariantMetrics[]): string =>
  table(
    ['Variant', 'Verified Success', 'False Success', 'No-tool Correct', 'Tokens / Success'],
    variants.map((v) => [
      v.label,
      pct(v.primary.verifiedTaskSuccessRate),
      pct(v.primary.falseSuccessRate),
      pct(v.secondary.noToolCorrectness),
      ratio(v.secondary.tokensPerSuccessfulTask, 0),
    ]),
  );

const routing = (variants: VariantMetrics[]): string =>
  table(
    ['Variant', 'Routing Accuracy', 'Wrong Package', 'Evidence@K', 'MRR'],
    variants.map((v) => [
      v.label,
      pct(v.primary.routingAccuracy),
      pct(v.secondary.wrongPackageRate),
      pctAgg(v.primary.requiredEvidenceRecallAtK),
      ratio(v.secondary.mrr, 3),
    ]),
  );

const contextEfficiency = (variants: VariantMetrics[]): string =>
  table(
    [
      'Variant',
      'Initial Context',
      'Routed web',
      'Routed RN',
      'Median Input Tokens',
      'Retrieved Tokens',
      'Duplicate Retrievals',
    ],
    variants.map((v) => [
      v.label,
      num(v.context.tokens),
      num(v.context.routed?.web?.tokens ?? null),
      num(v.context.routed?.['react-native']?.tokens ?? null),
      int(v.primary.medianInputTokens),
      int(v.diagnostic.medianRetrievedTokens),
      int(v.diagnostic.medianDuplicateRetrievals),
    ]),
  );

const verification = (variants: VariantMetrics[]): string =>
  table(
    [
      'Variant',
      'Invoked',
      'Pass',
      'Unsupported',
      'False Success',
      'Repair Attempts',
      'Repair Success',
      'Repeated Failure',
    ],
    variants.map((v) => [
      v.label,
      pctAgg(v.secondary.verificationInvocationRate),
      pct(v.secondary.verificationPassRate),
      pct(v.secondary.verificationUnsupportedRate),
      pct(v.primary.falseSuccessRate),
      int(v.secondary.medianRepairAttempts),
      pct(v.secondary.repairSuccessRate),
      pct(v.secondary.repeatedFailureRate),
    ]),
  );

const failures = (variants: VariantMetrics[]): string =>
  table(
    ['Variant', ...FAILURE_CATEGORIES],
    variants.map((v) => [v.label, ...FAILURE_CATEGORIES.map((c) => String(v.failureBreakdown[c]))]),
  );

const unsupported = (variants: VariantMetrics[]): string =>
  variants
    .map((v) =>
      v.unsupported.length === 0
        ? `- ${v.label}: none`
        : `- ${v.label}: ${v.unsupported.join(', ')}`,
    )
    .join('\n');

const comparison = (result: ComparisonResult | null): string => {
  if (!result) return 'Baseline comparison was not requested for this run.';
  if (result.status === 'no-baseline') return result.message;

  const changed = result.deltas.filter((d) => d.delta !== null && d.delta !== 0);
  const head = result.comparable
    ? 'Baseline and current run share the same conditions.'
    : [
        '**Conditions differ — these numbers are not directly comparable.**',
        '',
        table(
          ['Field', 'Baseline', 'Current'],
          result.warnings.map((w) => [w.field, `\`${w.baseline}\``, `\`${w.current}\``]),
        ),
      ].join('\n');

  const body =
    changed.length === 0
      ? 'No metric changed against the baseline.'
      : table(
          ['Variant', 'Metric', 'Baseline', 'Current', 'Delta', 'Gate'],
          changed.map((d) => [
            d.variant,
            d.metric,
            num(d.baseline),
            num(d.current),
            d.delta === null ? NA : d.delta.toFixed(3),
            d.gate,
          ]),
        );

  return [
    head,
    '',
    body,
    '',
    'Every stochastic metric is **report-only**. No threshold gate is applied until a baseline',
    'and repeated-trial variance exist. Deterministic invariants are gated by the CI job itself.',
  ].join('\n');
};

const conditions = (summary: RunSummary): string => {
  const c = summary.conditions;
  if (!c) return '';
  return [
    '## Run conditions',
    '',
    table(
      ['Field', 'Value'],
      [
        ['git sha', c.gitSha ?? NA],
        ['ref', c.ref ?? NA],
        ['split', c.split],
        ['dataset hash', `\`${c.datasetHash}\``],
        ['dataset tasks', String(c.datasetTaskCount)],
        ['variants', c.variants.join(', ')],
        ['trials', String(c.trials)],
        ['executor', c.executor],
        ['model', c.model ?? NA],
        ['model settings', c.modelSettings === null ? NA : JSON.stringify(c.modelSettings)],
        ['timeout ms', c.timeoutMs === null ? NA : String(c.timeoutMs)],
        ['capability hash', `\`${c.capabilityHash}\``],
        ['catalog schema', String(c.catalogSchemaVersion)],
        ['harness', c.harnessVersion],
      ],
    ),
    '',
  ].join('\n');
};

/** summary만 입력으로 받는 순수 함수 — 같은 입력이면 항상 같은 출력. */
export const renderMarkdown = (summary: RunSummary): string =>
  [
    '# Consumer Eval Report',
    '',
    `- run id: \`${summary.runId}\``,
    `- created at: ${summary.createdAt}`,
    `- split: **${summary.split}**`,
    `- tasks: ${summary.taskCount}`,
    `- trials per task: ${summary.trialCount}`,
    `- git sha: ${summary.gitSha ?? NA}`,
    `- executor: ${summary.executor}`,
    `- model: ${summary.model ?? NA}`,
    `- harness version: ${summary.harnessVersion}`,
    `- evidence K: ${summary.k}`,
    '',
    '## Overall Scorecard',
    '',
    scorecard(summary.variants),
    '',
    '## Correctness',
    '',
    correctness(summary.variants),
    '',
    '### Failure breakdown',
    '',
    failures(summary.variants),
    '',
    '## Routing',
    '',
    routing(summary.variants),
    '',
    summary.routingConfusion
      ? Object.entries(summary.routingConfusion)
          .map(([variant, matrix]) => `#### ${variant}\n\n${renderConfusion(matrix)}`)
          .join('\n\n')
      : 'No routing data — the executor did not report a platform selection.',
    '',
    '## Context Efficiency',
    '',
    contextEfficiency(summary.variants),
    '',
    '## Verification',
    '',
    verification(summary.variants),
    '',
    conditions(summary),
    '## Baseline comparison',
    '',
    comparison(summary.comparison ?? null),
    '',
    '## Unsupported metrics',
    '',
    'These metrics have no value because the underlying data was not reported.',
    'They are `N/A`, not zero.',
    '',
    unsupported(summary.variants),
    '',
    '## Measurement notes',
    '',
    '- The four axes above are reported independently. There is no composite score, by design.',
    '- Initial context tokens are a real local measurement (tiktoken, shared with `tools/scripts/measure-tokens`).',
    '- Every trial metric comes from executor traces. Nothing is synthesised when an executor does not report it.',
    '',
  ].join('\n');
