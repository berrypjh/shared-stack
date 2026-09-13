import { EVAL_METRICS } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { toJsonl } from '../../../evals/consumer/runner/jsonl';
import { measureContexts, resolveRouting } from '../../../evals/consumer/runner/offline';
import { runFixture } from '../__fixtures__/eval-run';

import {
  EvalImportError,
  parseContextReport,
  parseEvalSummary,
  parseGradedTraces,
  parseRoutingReport,
} from './eval';

const { summary, traces } = await runFixture();
const tracesText = toJsonl(traces);
const lines = tracesText.trimEnd().split('\n');

const withoutKey = (value: Record<string, unknown>, key: string) => {
  const { [key]: _removed, ...rest } = value;
  return rest;
};

describe('parseEvalSummary — 기존 summary 를 다시 계산하지 않고 읽는다', () => {
  it('harness 가 쓴 summary 를 그대로 돌려준다', () => {
    expect(parseEvalSummary(JSON.stringify(summary), 'summary.json')).toEqual(summary);
  });

  it('VariantMetrics 의 metric key 는 contracts registry 와 같다', () => {
    const [variant] = summary.variants;
    expect(Object.keys(variant.primary)).toEqual(Object.keys(EVAL_METRICS.primary));
    expect(Object.keys(variant.secondary)).toEqual(Object.keys(EVAL_METRICS.secondary));
    expect(Object.keys(variant.diagnostic)).toEqual(Object.keys(EVAL_METRICS.diagnostic));
  });

  it('schema 가 다르면 경로와 함께 거부한다', () => {
    const [variant] = summary.variants;
    const broken = {
      ...summary,
      variants: [
        {
          ...variant,
          primary: {
            ...variant.primary,
            falseSuccessRate: withoutKey(variant.primary.falseSuccessRate, 'denominator'),
          },
        },
      ],
    };
    expect(() => parseEvalSummary(JSON.stringify(broken), 'summary.json')).toThrow(
      /summary\.json .*variants\.0\.primary\.falseSuccessRate\.denominator/s,
    );
    expect(() =>
      parseEvalSummary(JSON.stringify(withoutKey(summary, 'trialCount')), 'summary.json'),
    ).toThrow(/trialCount/);
    expect(() => parseEvalSummary('{', 'summary.json')).toThrow(EvalImportError);
    expect(() => parseEvalSummary('{', 'summary.json')).toThrow('summary.json is not valid JSON');
  });
});

describe('parseGradedTraces — 기존 trace parser 를 쓰고 grade 를 함께 검증한다', () => {
  it('채점된 trace 를 grade 와 함께 읽는다', () => {
    expect(parseGradedTraces(tracesText, 'traces.jsonl')).toEqual(traces);
  });

  it('깨진 줄은 줄 번호와 원인을 알린다', () => {
    const replaceLine = (index: number, line: string) =>
      lines.map((current, i) => (i === index ? line : current)).join('\n');

    expect(() => parseGradedTraces(replaceLine(1, '{oops'), 'traces.jsonl')).toThrow(
      'traces.jsonl:2 invalid JSON',
    );
    const noTaskId = JSON.stringify(withoutKey(traces[1], 'taskId'));
    expect(() => parseGradedTraces(replaceLine(1, noTaskId), 'traces.jsonl')).toThrow(
      /traces\.jsonl:2 invalid trace — taskId/,
    );
    const noGrade = JSON.stringify(withoutKey(traces[0], 'grade'));
    expect(() => parseGradedTraces(replaceLine(0, noGrade), 'traces.jsonl')).toThrow(
      /traces\.jsonl:1 invalid grade — grade/,
    );
    const badClaim = JSON.stringify({
      ...traces[0],
      grade: { ...traces[0].grade, success: { ...traces[0].grade.success, claimCounted: 'yes' } },
    });
    expect(() => parseGradedTraces(replaceLine(0, badClaim), 'traces.jsonl')).toThrow(
      /traces\.jsonl:1 invalid grade — grade\.success\.claimCounted/,
    );
    expect(() => parseGradedTraces(replaceLine(1, '{oops'), 'traces.jsonl')).toThrow(
      EvalImportError,
    );
  });

  it('같은 variant·task·trial 이 두 번 나오면 거부한다', () => {
    const duplicated = `${tracesText}${JSON.stringify(traces[0])}\n`;
    expect(() => parseGradedTraces(duplicated, 'traces.jsonl')).toThrow(
      `traces.jsonl:${traces.length + 1} duplicate trace consumer-docs::web-button-loading::1 (first at line 1)`,
    );
  });
});

describe('offline JSON — routing-only·context-only writer 출력', () => {
  it('routing-only 는 split 과 confusion 만 가져온다', async () => {
    const report = await resolveRouting('dev');
    const text = JSON.stringify({ kind: 'routing-only', executor: null, ...report });
    expect(parseRoutingReport(text, 'routing.json')).toEqual({
      split: 'dev',
      matrix: report.matrix,
    });
    expect(() =>
      parseRoutingReport(JSON.stringify({ kind: 'context-only', contexts: [] }), 'routing.json'),
    ).toThrow(EvalImportError);
  });

  it('context-only 는 measureVariantContext 결과를 그대로 가져온다', async () => {
    const contexts = await measureContexts(['consumer-docs']);
    const text = JSON.stringify({ kind: 'context-only', executor: null, contexts });
    expect(parseContextReport(text, 'context.json')).toEqual(contexts);
  });
});
