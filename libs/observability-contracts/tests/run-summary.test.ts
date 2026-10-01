import { describe, expect, it } from 'vitest';

import {
  publicIndexSchema,
  publicSummaryPath,
  runArtifactSchema,
  runSummarySchema,
  storeIndexSchema,
  summarizeRun,
} from '../src/index.js';

import { evalRun } from './eval-fixtures.js';
import { artifact, available, HASH, missing } from './fixtures.js';
import { sizeLimitMeasurement } from './measurement-fixtures.js';

const summarize = (overrides: Record<string, unknown> = {}) =>
  summarizeRun(runArtifactSchema.parse(artifact(overrides)));

describe('summarizeRun — 화면이 run 전체를 받기 전에 읽는 요약', () => {
  it('metadata 와 observation 을 그대로 옮기고 계약을 통과한다', () => {
    const parsed = runArtifactSchema.parse(artifact());
    const summary = summarizeRun(parsed);
    expect(runSummarySchema.parse(summary)).toEqual(summary);
    expect(summary.metadata).toEqual(parsed.metadata);
    expect(summary.observations).toEqual(parsed.observations);
  });

  it('영역마다 담긴 행 수만 센다 — 값을 다시 계산하지 않는다', () => {
    const summary = summarize({
      bundles: [sizeLimitMeasurement()],
      evals: [evalRun()],
    });
    expect(summary.sections).toEqual({
      bundles: 1,
      contexts: 0,
      evals: 1,
    });
  });

  it('원본 판정이 실패인 것만 failures 에 싣는다 — not-run 은 실패가 아니다', () => {
    const summary = summarize({
      observations: [
        available(),
        missing('not-run'),
        available({
          id: 'eval.consumer-smoke',
          domain: 'eval',
          unit: 'ratio',
          scope: 'tools/evals/consumer',
          value: 0.5,
          denominator: 2,
          outcome: 'fail',
        }),
      ],
      bundles: [
        sizeLimitMeasurement({
          value: 11757,
          budget: {
            limitBytes: 11000,
            limitSource: '11 KB',
            headroomBytes: -757,
            outcome: 'fail',
            toolPassed: false,
          },
        }),
      ],
    });
    expect(summary.failures).toEqual([
      {
        domain: 'eval',
        id: 'eval.consumer-smoke',
        scope: 'tools/evals/consumer',
        reason: 'eval.consumer-smoke 의 원본 판정이 fail 이다',
      },
      {
        domain: 'bundle',
        id: 'bundle.size-limit.react-ui.cx-only',
        scope: '@berrypjh/react-ui',
        reason: '@berrypjh/react-ui — cx only: 757 B 초과 (한도 11 KB)',
      },
    ]);
  });

  it('eval 은 executor 종류와 notice 만 요약한다 — 성공률을 요약하지 않는다', () => {
    expect(summarize({ evals: [evalRun()] }).evals).toEqual([
      {
        sourceId: 'eval:pr-smoke',
        executorClass: 'harness-smoke',
        notices: ['harness-smoke', 'no-live-executor', 'no-baseline'],
      },
    ]);
  });
});

describe('runSummarySchema', () => {
  it('알 수 없는 필드와 공개할 수 없는 evidence 를 거부한다', () => {
    const summary = summarize();
    expect(runSummarySchema.safeParse({ ...summary, extra: 1 }).success).toBe(false);
    const raw = available({
      evidence: [{ source: 'file', path: 'raw/size.json', sha256: HASH, excerpt: null }],
    });
    expect(runSummarySchema.safeParse({ ...summary, observations: [raw] }).success).toBe(false);
  });
});

describe('public index 의 요약 경로', () => {
  const entry = { id: 'a', path: 'runs/a.json' };

  it('요약 경로는 선택이고, 있으면 그 run 의 요약만 가리킨다', () => {
    expect(publicIndexSchema.safeParse({ version: 1, runs: [entry] }).success).toBe(true);
    expect(
      publicIndexSchema.safeParse({
        version: 1,
        runs: [{ ...entry, summary: publicSummaryPath('a') }],
      }).success,
    ).toBe(true);
    expect(
      publicIndexSchema.safeParse({
        version: 1,
        runs: [{ ...entry, summary: 'runs/b.summary.json' }],
      }).success,
    ).toBe(false);
  });

  it('store index 는 요약 경로를 갖지 않는다', () => {
    expect(
      storeIndexSchema.safeParse({
        version: 1,
        runs: [{ id: 'a', path: 'runs/a/run.json', summary: publicSummaryPath('a') }],
      }).success,
    ).toBe(false);
  });
});
