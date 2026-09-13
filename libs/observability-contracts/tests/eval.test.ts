import { describe, expect, it } from 'vitest';

import {
  CONFUSION_EXPECTED,
  CONFUSION_PREDICTED,
  confusionMatrixSchema,
  EVAL_METRICS,
  evalRunSchema,
  evalTraceSchema,
  evalVariantSchema,
  NON_HARNESS_METRICS,
  publicRunArtifactSchema,
  runArtifactSchema,
} from '../src/index.js';

import {
  agg,
  confusion,
  evalRun,
  evalTrace,
  evalVariant,
  nullAgg,
  nullRate,
  rate,
} from './eval-fixtures.js';
import { artifact } from './fixtures.js';

const okVariant = (input: unknown) => evalVariantSchema.safeParse(input).success;
const okTrace = (input: unknown) => evalTraceSchema.safeParse(input).success;
const okRun = (input: unknown) => evalRunSchema.safeParse(input).success;

const withPrimary = (key: string, value: unknown) =>
  evalVariant({ primary: { ...evalVariant().primary, [key]: value } });

/** null metric 은 unsupported 에도 올라가야 한다. */
const withNullPrimary = (key: string, value: unknown) => ({
  ...withPrimary(key, value),
  unsupported: [...evalVariant().unsupported, `primary.${key}`],
});

describe('EVAL_METRICS — 기존 VariantMetrics key 한 벌', () => {
  it('primary·secondary·diagnostic key 를 그대로 가진다', () => {
    expect(Object.keys(EVAL_METRICS.primary)).toEqual(Object.keys(evalVariant().primary));
    expect(Object.keys(EVAL_METRICS.secondary)).toEqual(Object.keys(evalVariant().secondary));
    expect(Object.keys(EVAL_METRICS.diagnostic)).toEqual(Object.keys(evalVariant().diagnostic));
  });

  it('harness 가 만들지 않는 metric 은 registry 에 없다', () => {
    const keys = [
      ...Object.keys(EVAL_METRICS.primary),
      ...Object.keys(EVAL_METRICS.secondary),
      ...Object.keys(EVAL_METRICS.diagnostic),
    ];
    for (const name of NON_HARNESS_METRICS) expect(keys).not.toContain(name);
    expect(
      okVariant(
        evalVariant({
          secondary: { ...evalVariant().secondary, wrongPlatformRate: rate(0, 0, 4) },
        }),
      ),
    ).toBe(false);
  });
});

describe('rate·aggregate — null 은 0 이 아니고 이유를 가진다', () => {
  it('fixture 가 통과한다', () => {
    expect(okVariant(evalVariant())).toBe(true);
  });

  it('실측 0 은 분모와 함께 보존된다', () => {
    expect(evalVariantSchema.parse(evalVariant()).primary.verifiedTaskSuccessRate).toEqual(
      rate(0, 0, 4),
    );
  });

  it('분모가 0 이면 값은 null 이고 zero-denominator 다', () => {
    expect(okVariant(withPrimary('falseSuccessRate', { ...rate(0, 0, 4), denominator: 0 }))).toBe(
      false,
    );
    expect(okVariant(withNullPrimary('falseSuccessRate', nullRate(0, 0)))).toBe(true);
  });

  it('이유 없는 null, 분자와 맞지 않는 값, 분모를 넘는 분자는 거부한다', () => {
    expect(okVariant(withPrimary('routingAccuracy', { ...nullRate(4, 4), nullReason: null }))).toBe(
      false,
    );
    expect(okVariant(withPrimary('routingAccuracy', rate(0.5, 4, 4)))).toBe(false);
    expect(okVariant(withPrimary('routingAccuracy', rate(1, 5, 4)))).toBe(false);
  });

  it('표본이 없는 aggregate 는 값이 없다', () => {
    expect(okVariant(withPrimary('medianInputTokens', agg(0, 0)))).toBe(false);
    expect(okVariant(withNullPrimary('medianInputTokens', nullAgg(0, 'no-samples')))).toBe(true);
    expect(okVariant(withNullPrimary('medianInputTokens', nullAgg(4, 'no-samples')))).toBe(false);
  });

  it('원인을 알 수 없는 null 은 source-null 로 남긴다', () => {
    expect(okVariant(withPrimary('requiredEvidenceRecallAtK', nullAgg(3, 'source-null')))).toBe(
      false,
    );
    expect(okVariant(withNullPrimary('requiredEvidenceRecallAtK', nullAgg(3, 'source-null')))).toBe(
      true,
    );
  });
});

describe('evalVariant', () => {
  it('unsupported 는 null metric 전체 목록이다', () => {
    expect(okVariant(evalVariant({ unsupported: evalVariant().unsupported.slice(1) }))).toBe(false);
  });

  it('모든 metric 이 null 인 variant 도 이유와 함께 표현된다', () => {
    const allNull = (group: Record<string, { kind: string }>) =>
      Object.fromEntries(
        Object.entries(group).map(([key, metric]) => [
          key,
          metric.kind === 'rate' ? nullRate(0, 0) : nullAgg(),
        ]),
      );
    const base = evalVariant();
    const variant = evalVariant({
      tasks: 0,
      trials: 0,
      primary: allNull(base.primary),
      secondary: allNull(base.secondary),
      diagnostic: allNull(base.diagnostic),
      failureBreakdown: Object.fromEntries(
        Object.keys(base.failureBreakdown).map((key) => [key, 0]),
      ),
      unsupported: [
        ...Object.keys(base.primary).map((key) => `primary.${key}`),
        ...Object.keys(base.secondary).map((key) => `secondary.${key}`),
        ...Object.keys(base.diagnostic).map((key) => `diagnostic.${key}`),
      ],
    });
    expect(okVariant(variant)).toBe(true);
  });

  it('성공 + 실패 분류의 합은 trial 수와 같아야 한다', () => {
    const breakdown = { ...evalVariant().failureBreakdown, 'verification-omitted': 2 };
    expect(okVariant(evalVariant({ failureBreakdown: breakdown }))).toBe(false);
  });
});

describe('confusion matrix — expected 4행 × predicted 5열', () => {
  it('행·열 label 을 계약으로 고정한다', () => {
    expect([...CONFUSION_EXPECTED]).toEqual(['web', 'react-native', 'both', 'none']);
    expect([...CONFUSION_PREDICTED]).toEqual(['web', 'react-native', 'none', 'both', 'unreported']);
    expect(confusionMatrixSchema.safeParse(confusion()).success).toBe(true);
  });

  it('합계가 맞지 않으면 거부한다', () => {
    expect(confusionMatrixSchema.safeParse(confusion({ total: 5 })).success).toBe(false);
    expect(confusionMatrixSchema.safeParse(confusion({ correct: 3 })).success).toBe(false);
    expect(confusionMatrixSchema.safeParse(confusion({ unreported: 1 })).success).toBe(false);
    expect(confusionMatrixSchema.safeParse(confusion({ accuracy: 0.5 })).success).toBe(false);
  });

  it('both 행이나 unreported 열을 빼면 거부한다', () => {
    const { both: _both, ...withoutBoth } = confusion().rows;
    expect(confusionMatrixSchema.safeParse(confusion({ rows: withoutBoth })).success).toBe(false);
    const { unreported: _unreported, ...webRow } = confusion().rows.web;
    expect(
      confusionMatrixSchema.safeParse(confusion({ rows: { ...confusion().rows, web: webRow } }))
        .success,
    ).toBe(false);
  });

  it('비어 있으면 accuracy 는 null 이다', () => {
    const zero = { web: 0, 'react-native': 0, none: 0, both: 0, unreported: 0 };
    const empty = {
      rows: { web: zero, 'react-native': zero, both: zero, none: zero },
      total: 0,
      correct: 0,
      unreported: 0,
    };
    expect(confusionMatrixSchema.safeParse({ ...empty, accuracy: null }).success).toBe(true);
    expect(confusionMatrixSchema.safeParse({ ...empty, accuracy: 0 }).success).toBe(false);
  });
});

describe('evalTrace — 안전한 trace 상세', () => {
  it('fixture 가 통과한다', () => {
    expect(okTrace(evalTrace())).toBe(true);
  });

  describe('false success 는 명시적 true 주장에서만', () => {
    const claim = (claimedSuccess: unknown, falseSuccess: boolean, claimCounted: boolean) =>
      evalTrace({
        claimedSuccess,
        success: { ...evalTrace().success, falseSuccess, claimCounted },
      });

    it.each([
      ['true', true, true, true],
      ['false', false, false, true],
      ['unknown', 'unknown', false, false],
      ['null', null, false, false],
    ])('%s 주장은 falseSuccess=%s·분모 포함=%s', (_label, claimed, falseSuccess, counted) => {
      expect(okTrace(claim(claimed, falseSuccess as boolean, counted as boolean))).toBe(true);
    });

    it('unknown·null·false 주장을 false success 로 두거나 분모에 넣을 수 없다', () => {
      expect(okTrace(claim('unknown', true, false))).toBe(false);
      expect(okTrace(claim(null, false, true))).toBe(false);
      expect(okTrace(claim(false, true, true))).toBe(false);
    });
  });

  it('required evidence 가 없으면 recall·RR 은 N/A 다', () => {
    const none = {
      ...evalTrace().retrieval,
      requiredCount: 0,
      hitsAtK: 0,
      recallAtK: null,
      reciprocalRank: null,
      firstHitRank: null,
      required: [],
    };
    expect(okTrace(evalTrace({ retrieval: { ...none, nullReason: 'no-required-evidence' } }))).toBe(
      true,
    );
    expect(okTrace(evalTrace({ retrieval: { ...none, recallAtK: 0, nullReason: null } }))).toBe(
      false,
    );
    expect(
      okTrace(
        evalTrace({
          retrieval: {
            ...evalTrace().retrieval,
            recallAtK: null,
            nullReason: 'no-required-evidence',
          },
        }),
      ),
    ).toBe(false);
  });

  it('RN test unsupported 를 원본 상태와 이유로 보존한다', () => {
    const unsupported = {
      kind: 'test',
      required: true,
      status: 'unsupported',
      attempt: 0,
      durationMs: null,
      exitCode: null,
      failureFingerprint: null,
      excerpt: 'react-native components cannot render in the jsdom fixture harness',
    };
    const verification = {
      ...evalTrace().verification,
      unsupportedRequired: ['test'],
      runs: [unsupported],
    };
    expect(evalTraceSchema.parse(evalTrace({ verification })).verification.runs[0]).toMatchObject({
      status: 'unsupported',
      excerpt: 'react-native components cannot render in the jsdom fixture harness',
    });
  });

  it('변경 파일은 경로만 남기고 내용은 공개하지 않는다', () => {
    expect(
      okTrace(
        evalTrace({ changedFiles: [{ path: 'src/App.tsx', content: 'export const App = 1;' }] }),
      ),
    ).toBe(false);
  });

  it('id 는 variant::task::trial 이다', () => {
    expect(okTrace({ ...evalTrace(), id: 'other' })).toBe(false);
  });
});

describe('evalRun', () => {
  it('fixture 가 통과한다', () => {
    expect(okRun(evalRun())).toBe(true);
  });

  it('smoke-scripted 결과는 harness badge 와 live executor 부재를 항상 알린다', () => {
    const notices = evalRun().notices.filter((notice) => notice.code !== 'harness-smoke');
    expect(okRun(evalRun({ notices }))).toBe(false);
    const withoutLive = evalRun().notices.filter((notice) => notice.code !== 'no-live-executor');
    expect(okRun(evalRun({ notices: withoutLive }))).toBe(false);
  });

  it('trace 수는 taskCount × trialsPerTask × variant 수와 같다 — 셋을 섞지 않는다', () => {
    expect(okRun(evalRun({ traceCount: 3, traces: evalRun().traces.slice(0, 3) }))).toBe(false);
    expect(okRun(evalRun({ origin: { ...evalRun().origin, trialsPerTask: 2 } }))).toBe(false);
  });

  it('같은 variant·task·trial trace 가 둘이면 거부한다', () => {
    const traces = [...evalRun().traces.slice(0, 3), evalRun().traces[0]];
    expect(okRun(evalRun({ traces }))).toBe(false);
  });

  it('context-only 에는 summary 가 없고 success 는 not-run 이다', () => {
    const contextOnly = evalRun({
      sourceId: 'eval:context-only',
      origin: null,
      executorClass: null,
      import: {
        summary: { status: 'not-run', reason: 'context-only 는 executor 를 돌리지 않는다' },
        traces: { status: 'not-run', reason: 'context-only 는 trace 를 만들지 않는다' },
        routing: { status: 'missing', reason: 'routing.json 이 없다' },
        context: { status: 'parsed', reason: null },
      },
      notices: [{ code: 'no-live-executor', message: 'live agent executor 가 없다' }],
      variants: [],
      routing: [],
      traceCount: null,
      traces: [],
    });
    expect(okRun(contextOnly)).toBe(true);
    expect(okRun({ ...contextOnly, variants: [evalVariant()] })).toBe(false);
  });

  it('summary 를 읽지 못했으면 원본 origin 이 없다', () => {
    expect(
      okRun(
        evalRun({
          import: { ...evalRun().import, summary: { status: 'invalid', reason: 'schema 오류' } },
        }),
      ),
    ).toBe(false);
  });
});

describe('RunArtifact.evals', () => {
  it('artifact 는 eval run 을 담는다', () => {
    expect(runArtifactSchema.safeParse(artifact({ evals: [evalRun()] })).success).toBe(true);
  });

  it('eval import 이전에 수집된 run 은 import 한 eval 이 없는 것으로 읽힌다', () => {
    const { evals: _evals, ...before } = artifact();
    expect(runArtifactSchema.parse(before).evals).toEqual([]);
  });

  it('held-out split 은 공개 artifact 에 gold evidence·발췌를 싣지 않는다', () => {
    const heldOutTrace = (evidence: boolean) =>
      evalTrace({
        split: 'test',
        retrieval: {
          ...evalTrace().retrieval,
          required: evidence ? evalTrace().retrieval.required : null,
          retrieved: evidence ? evalTrace().retrieval.retrieved : null,
        },
      });
    const heldOut = (evidence: boolean) =>
      evalRun({
        origin: {
          ...evalRun().origin,
          split: 'test',
          conditions: { ...evalRun().origin.conditions, split: 'test' },
        },
        traces: evalRun().traces.map((trace) => ({
          ...heldOutTrace(evidence),
          id: trace.id,
          taskId: trace.taskId,
        })),
      });
    expect(runArtifactSchema.safeParse(artifact({ evals: [heldOut(true)] })).success).toBe(true);
    expect(publicRunArtifactSchema.safeParse(artifact({ evals: [heldOut(true)] })).success).toBe(
      false,
    );
    expect(publicRunArtifactSchema.safeParse(artifact({ evals: [heldOut(false)] })).success).toBe(
      true,
    );
  });
});
