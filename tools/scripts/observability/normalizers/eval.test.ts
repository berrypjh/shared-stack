import {
  type EvalAggregate,
  type EvalRate,
  type EvalRun,
  publicRunArtifactSchema,
} from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { NO_BASELINE_MESSAGE } from '../../../evals/consumer/ci/compare';
import { aggregateVariant } from '../../../evals/consumer/reporters/aggregate';
import { buildConfusion } from '../../../evals/consumer/reporters/confusion';
import type { GradedTrace } from '../../../evals/consumer/runner/trace';
import { VARIANTS } from '../../../evals/consumer/variants/index';
import { runFixture } from '../__fixtures__/eval-run';
import { fixtureArtifact } from '../__fixtures__/fixtures';
import { toPublicArtifact } from '../export';

import { type EvalImport, executorClassOf, normalizeEvalRun, variantProvenance } from './eval';

const { summary, traces } = await runFixture();

const parsed = <T>(value: T) => ({ status: 'parsed' as const, value });
const missing = (reason: string) => ({ status: 'missing' as const, reason });

const importOf = (overrides: Partial<EvalImport> = {}): EvalImport => ({
  sourceId: 'eval:fixture',
  summary: parsed(summary),
  traces: parsed(traces),
  routing: missing('routing.json 이 없다'),
  context: missing('context.json 이 없다'),
  baseline: { status: 'missing' },
  ...overrides,
});

const run = normalizeEvalRun(importOf());
const [variant] = run.variants;
const traceOf = (evalRun: EvalRun, taskId: string) => {
  const trace = evalRun.traces.find((candidate) => candidate.taskId === taskId);
  if (!trace) throw new Error(`no trace for ${taskId}`);
  return trace;
};
const codes = (evalRun: EvalRun) => evalRun.notices.map((notice) => notice.code);
const GROUPS = ['primary', 'secondary', 'diagnostic'] as const;
const metricsOf = (group: object) => Object.entries(group) as [string, EvalRate | EvalAggregate][];

describe('normalizeEvalRun — summary 값은 옮기기만 한다', () => {
  it('rate·aggregate 를 분자·분모·n 과 함께 그대로 둔다', () => {
    const [source] = summary.variants;
    for (const group of GROUPS) {
      for (const [key, metric] of metricsOf(variant[group])) {
        const { kind: _kind, nullReason: _reason, ...values } = metric;
        expect(values, `${group}.${key}`).toEqual((source[group] as Record<string, unknown>)[key]);
      }
    }
    expect(variant.unsupported).toEqual(source.unsupported);
    expect(variant.failureBreakdown).toEqual(source.failureBreakdown);
    expect(variant).toMatchObject({ variant: 'consumer-docs', tasks: 6, trials: 6 });
  });

  it('원본 run 조건과 수집 metadata 를 섞지 않는다', () => {
    expect(run.origin).toMatchObject({
      runId: 'eval-fixture',
      executor: 'scripted',
      model: null,
      k: 5,
      taskCount: 6,
      trialsPerTask: 1,
      conditions: summary.conditions,
    });
    expect(run.traceCount).toBe(6);
  });
});

describe('false success — 명시적 true 주장 중 required 검증을 통과하지 못한 비율', () => {
  it('분모는 true·false 주장만 센다 — unknown·null 은 제외한다', () => {
    const claimed = traces.filter((trace) => typeof trace.claimedSuccess === 'boolean');
    const falseSuccess = claimed.filter(
      (trace) => trace.claimedSuccess === true && trace.grade.verification.passed !== true,
    );
    expect(claimed).toHaveLength(4);
    expect(falseSuccess.map((trace) => trace.taskId)).toEqual(['web-button-polymorphic']);
    expect(variant.primary.falseSuccessRate).toMatchObject({
      numerator: falseSuccess.length,
      denominator: claimed.length,
    });
  });

  it.each([
    ['web-button-polymorphic', true, true],
    ['rn-use-theme-getcolor', false, true],
    ['web-textfield-helper', false, false],
    ['web-select-menuitem', false, false],
  ])('%s 는 falseSuccess=%s·분모 포함=%s', (taskId, falseSuccess, claimCounted) => {
    expect(traceOf(run, taskId).success).toMatchObject({ falseSuccess, claimCounted });
  });

  it('task success 와 따로 센다 — 거짓 주장이 아니어도 실패일 수 있다', () => {
    expect(traceOf(run, 'rn-use-theme-getcolor').success).toMatchObject({
      taskSucceeded: false,
      falseSuccess: false,
    });
    expect(variant.primary.verifiedTaskSuccessRate.numerator).toBe(
      traces.filter((trace) => trace.grade.success.taskSucceeded).length,
    );
  });
});

describe('verification', () => {
  it('RN test unsupported 를 상태·required·attempt·원인과 함께 보존한다', () => {
    const { verification } = traceOf(run, 'rn-use-theme-getcolor');
    expect(verification.unsupportedRequired).toEqual(['test']);
    expect(verification.runs.find((entry) => entry.kind === 'test')).toEqual({
      kind: 'test',
      required: true,
      status: 'unsupported',
      attempt: 0,
      durationMs: null,
      exitCode: null,
      failureFingerprint: null,
      excerpt: expect.stringContaining('jsdom'),
    });
    const notice = run.notices.find((entry) => entry.code === 'unsupported-required-check');
    expect(notice?.message).toContain('consumer-docs::rn-use-theme-getcolor::1');
  });

  it('D4·D5 만 harness 가 검증을 실행한다. repair hook 은 executor 로 판단한다', () => {
    expect(variantProvenance('consumer-docs', 'unknown')).toEqual({
      verificationAuthority: 'executor-reported',
      repair: 'not-in-variant',
    });
    expect(variantProvenance('progressive-with-verification', 'harness-smoke')).toEqual({
      verificationAuthority: 'harness-executed',
      repair: 'not-in-variant',
    });
    expect(variantProvenance('progressive-with-repair', 'harness-smoke').repair).toBe(
      'no-repair-hook',
    );
    expect(variantProvenance('progressive-with-repair', 'replay').repair).toBe('no-repair-hook');
    expect(variantProvenance('progressive-with-repair', 'unknown').repair).toBe('unknown');
  });
});

describe('routing', () => {
  it('선택하지 않은 platform 은 none 이 아니라 unreported 칸이다', () => {
    const [entry] = run.routing;
    expect(entry).toEqual({
      source: 'trace-grades',
      variant: 'consumer-docs',
      matrix: summary.routingConfusion?.['consumer-docs'],
    });
    expect(entry.matrix.rows.web).toMatchObject({ unreported: 1, none: 0 });
  });

  it('deterministic resolver 의 both·unreported 를 그대로 싣는다', () => {
    const matrix = buildConfusion([
      { expected: 'both', predicted: 'both' },
      { expected: 'both', predicted: null },
      { expected: 'none', predicted: 'none' },
    ]);
    const withRouting = normalizeEvalRun(importOf({ routing: parsed({ split: 'dev', matrix }) }));
    expect(withRouting.routing.at(-1)).toEqual({
      source: 'deterministic-resolver',
      variant: null,
      matrix,
    });
    expect(matrix.rows.both).toMatchObject({ both: 1, unreported: 1, none: 0 });
  });

  it('split 이 다른 routing 은 섞지 않는다', () => {
    const matrix = buildConfusion([{ expected: 'web', predicted: 'web' }]);
    const mismatch = normalizeEvalRun(importOf({ routing: parsed({ split: 'test', matrix }) }));
    expect(mismatch.import.routing.status).toBe('invalid');
    expect(mismatch.routing.map((entry) => entry.source)).toEqual(['trace-grades']);
  });
});

describe('retrieval', () => {
  it('required evidence 가 없으면 recall·RR 은 N/A 이고 평균의 n 에서 빠진다', () => {
    expect(traceOf(run, 'no-ui-date-format').retrieval).toMatchObject({
      requiredCount: 0,
      recallAtK: null,
      reciprocalRank: null,
      nullReason: 'no-required-evidence',
    });
    expect(variant.primary.requiredEvidenceRecallAtK.n).toBe(5);
  });

  it('evidence 중복과 tool call 중복을 따로 센다', () => {
    expect(traceOf(run, 'web-button-polymorphic').retrieval).toMatchObject({
      evidenceDuplicates: 2,
      toolCallDuplicates: 1,
    });
  });
});

describe('null metric', () => {
  it('모든 metric 이 null 인 summary 는 0 없이 이유만 남긴다', () => {
    const empty = aggregateVariant(VARIANTS['consumer-docs'], summary.variants[0].context, [], []);
    const allNull = normalizeEvalRun(
      importOf({
        summary: parsed({ ...summary, taskCount: 0, variants: [empty], routingConfusion: {} }),
        traces: parsed([]),
      }),
    );
    const [only] = allNull.variants;
    expect(only.unsupported).toHaveLength(23);
    for (const group of GROUPS) {
      for (const [, metric] of metricsOf(only[group])) {
        expect(metric.value).toBeNull();
        expect(metric.nullReason).toBe(metric.kind === 'rate' ? 'zero-denominator' : 'no-samples');
      }
    }
  });

  it('분모가 있는데 값이 null 이면 원인을 지어내지 않고 source-null 이다', () => {
    const [source] = summary.variants;
    const odd = {
      ...source,
      primary: {
        ...source.primary,
        routingAccuracy: { value: null, numerator: 5, denominator: 6 },
      },
      unsupported: [...source.unsupported, 'primary.routingAccuracy'],
    };
    const result = normalizeEvalRun(importOf({ summary: parsed({ ...summary, variants: [odd] }) }));
    expect(result.variants[0].primary.routingAccuracy.nullReason).toBe('source-null');
  });
});

describe('summary 와 trace 가 어긋나면', () => {
  it('trace 가 빠지면 traces 를 invalid 로 두고 부분 import 를 알린다', () => {
    const partial = normalizeEvalRun(importOf({ traces: parsed(traces.slice(1)) }));
    expect(partial.import.traces).toMatchObject({ status: 'invalid' });
    expect(partial.import.traces.reason).toContain('consumer-docs');
    expect(partial).toMatchObject({ traces: [], traceCount: null });
    expect(partial.variants).toHaveLength(1);
    expect(codes(partial)).toContain('partial-import');
  });

  it('수가 같아도 false success 분자가 다르면 거부한다', () => {
    const flipped: GradedTrace[] = traces.map((trace) =>
      trace.taskId === 'web-button-polymorphic'
        ? {
            ...trace,
            grade: { ...trace.grade, success: { ...trace.grade.success, falseSuccess: false } },
          }
        : trace,
    );
    const result = normalizeEvalRun(importOf({ traces: parsed(flipped) }));
    expect(result.import.traces.reason).toContain('falseSuccessRate');
  });
});

describe('executor 와 badge', () => {
  it.each([
    ['smoke-scripted', 'harness-smoke'],
    ['scripted', 'scripted'],
    ['replay(claude-code)', 'replay'],
    ['unavailable', 'unavailable'],
    ['claude-agent-sdk', 'unknown'],
  ] as const)('%s → %s', (executor, executorClass) => {
    expect(executorClassOf(executor)).toBe(executorClass);
  });

  it('smoke-scripted 결과는 harness badge 와 live executor 부재를 항상 단다', () => {
    const smoke = normalizeEvalRun(
      importOf({ summary: parsed({ ...summary, executor: 'smoke-scripted' }) }),
    );
    expect(smoke.executorClass).toBe('harness-smoke');
    expect(codes(smoke)).toEqual(expect.arrayContaining(['harness-smoke', 'no-live-executor']));
  });

  it('baseline 이 없으면 그렇게 말하고, 있지만 비교를 요청하지 않았으면 그것을 말한다', () => {
    expect(run.notices).toContainEqual({ code: 'no-baseline', message: NO_BASELINE_MESSAGE });
    expect(run.originalComparison).toEqual({
      source: 'baseline-file',
      status: 'no-baseline',
      comparable: null,
      warnings: [],
      reason: null,
    });
    const present = normalizeEvalRun(importOf({ baseline: { status: 'present' } }));
    expect(codes(present)).toContain('baseline-not-requested');
    expect(present.originalComparison).toBeNull();
  });

  it('깨진 baseline 파일은 없는 baseline 으로 뭉개지 않는다', () => {
    const reason = 'baseline 파일이 JSON 이 아니다';
    const corrupt = normalizeEvalRun(importOf({ baseline: { status: 'invalid', reason } }));
    expect(codes(corrupt)).not.toContain('no-baseline');
    expect(corrupt.originalComparison).toEqual({
      source: 'baseline-file',
      status: 'corrupt-baseline',
      comparable: null,
      warnings: [],
      reason,
    });
  });

  it('evaluator 가 비교했으면 그 결과와 원래 warnings 를 그대로 옮긴다', () => {
    const warnings = [{ field: 'model', baseline: '"a"', current: '"b"' }];
    const compared = normalizeEvalRun(
      importOf({
        summary: parsed({
          ...summary,
          comparison: { status: 'compared', comparable: false, warnings, deltas: [] },
        }),
        baseline: { status: 'present' },
      }),
    );
    expect(compared.originalComparison).toEqual({
      source: 'summary',
      status: 'compared',
      comparable: false,
      warnings,
      reason: null,
    });
    expect(codes(compared)).not.toContain('baseline-not-requested');
  });
});

describe('공개 가능한 trace 상세', () => {
  it('변경 파일은 경로만 남기고 발췌는 정제한다', () => {
    const trace = traceOf(run, 'web-button-loading');
    expect(trace.changedFiles).toEqual([{ path: 'src/Generated0.tsx', content: 'redacted' }]);
    expect(JSON.stringify(run)).not.toContain('import * as ui');
    const excerpt = trace.verification.runs.find((entry) => entry.kind === 'test')?.excerpt ?? '';
    expect(excerpt).not.toContain('\u001b');
    expect(excerpt).not.toContain('/Users/someone');
    expect(excerpt).not.toContain('sk-abcdefghijklmnopqrstuvwx');
    expect(excerpt).toContain('[redacted]');
    expect(
      publicRunArtifactSchema.safeParse({ ...toPublicArtifact(fixtureArtifact()), evals: [run] })
        .success,
    ).toBe(true);
  });

  it('held-out split 은 gold evidence·retrieved·발췌·지문을 싣지 않는다', () => {
    const heldOut = normalizeEvalRun(
      importOf({
        summary: parsed({
          ...summary,
          split: 'test',
          conditions: summary.conditions && { ...summary.conditions, split: 'test' },
        }),
        traces: parsed(traces.map((trace) => ({ ...trace, split: 'test' as const }))),
      }),
    );
    for (const trace of heldOut.traces) {
      expect(trace.retrieval).toMatchObject({ required: null, retrieved: null });
      for (const entry of trace.verification.runs) {
        expect(entry).toMatchObject({ excerpt: null, failureFingerprint: null });
      }
    }
    expect(
      publicRunArtifactSchema.safeParse({
        ...toPublicArtifact(fixtureArtifact()),
        evals: [heldOut],
      }).success,
    ).toBe(true);
  });
});

describe('context-only', () => {
  it('executor 를 돌리지 않은 산출물은 success 를 not-run 으로 두고 variant 를 만들지 않는다', () => {
    const reason = 'context-only 는 executor 를 돌리지 않는다';
    const contextOnly = normalizeEvalRun(
      importOf({
        sourceId: 'eval:offline',
        summary: { status: 'not-run', reason },
        traces: { status: 'not-run', reason },
        context: parsed([]),
      }),
    );
    expect(contextOnly).toMatchObject({
      origin: null,
      executorClass: null,
      variants: [],
      routing: [],
      traceCount: null,
    });
    expect(codes(contextOnly)).toContain('no-live-executor');
    expect(codes(contextOnly)).not.toContain('partial-import');
  });
});
