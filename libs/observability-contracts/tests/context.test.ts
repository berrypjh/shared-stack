import { describe, expect, it } from 'vitest';

import {
  compareContext,
  CONTEXT_SCOPES,
  contextMeasurementSchema,
  publicRunArtifactSchema,
  runArtifactSchema,
} from '../src/index.js';

import { artifact } from './fixtures.js';
import { contextMeasurement, missingContext } from './measurement-fixtures.js';

const ok = (input: unknown) => contextMeasurementSchema.safeParse(input).success;
const parse = (input: unknown) => contextMeasurementSchema.parse(input);

describe('ContextMeasurement', () => {
  it('fixture 가 통과하고 scope 는 네 가지로 분리된다', () => {
    expect(ok(contextMeasurement())).toBe(true);
    expect([...CONTEXT_SCOPES]).toEqual([
      'package-scenario',
      'variant-initial',
      'variant-routed',
      'agent-input',
    ]);
  });

  it('실측 0 token 은 값이고, available 인데 null 이면 거부한다', () => {
    expect(ok(contextMeasurement({ chars: 0, tokens: 0 }))).toBe(true);
    expect(ok(contextMeasurement({ tokens: null }))).toBe(false);
  });

  describe('누락된 입력', () => {
    it('없는 파일은 missing-input 으로 unavailable 이고 부분 합계를 두지 않는다', () => {
      expect(ok(missingContext())).toBe(true);
      expect(ok(missingContext({ tokens: 120, chars: 400 }))).toBe(false);
    });

    it('누락이 있는데 available 이거나 다른 이유 코드면 거부한다', () => {
      expect(ok(contextMeasurement({ missingPaths: ['libs/design-tokens/dist/AGENTS.md'] }))).toBe(
        false,
      );
      expect(ok(missingContext({ reasonCode: 'provider-error' }))).toBe(false);
    });
  });

  describe('tokenizer', () => {
    it('버전을 모르면 null 과 이유를 함께 둔다', () => {
      const unknown = {
        provider: 'anthropic-count-tokens',
        tokenModel: 'claude-sonnet-4-6',
        tokenizerVersion: null,
      };
      expect(
        ok(
          contextMeasurement({
            ...unknown,
            tokenizerVersionReason: 'server-side tokenizer 버전을 노출하지 않는다',
          }),
        ),
      ).toBe(true);
      expect(ok(contextMeasurement({ ...unknown, tokenizerVersionReason: null }))).toBe(false);
      expect(ok(contextMeasurement({ tokenizerVersionReason: '중복된 이유' }))).toBe(false);
    });

    it('선택하지 않은 provider 는 not-run 이다', () => {
      const notSelected = contextMeasurement({
        provider: 'anthropic-count-tokens',
        tokenModel: 'claude-sonnet-4-6',
        tokenizerVersion: null,
        tokenizerVersionReason: 'server-side tokenizer 버전을 노출하지 않는다',
        availability: 'not-run',
        chars: null,
        tokens: null,
        reason: 'Anthropic 측정은 명시적으로 선택할 때만 한다',
        reasonCode: 'provider-not-selected',
      });
      expect(ok(notSelected)).toBe(true);
    });
  });
});

describe('compareContext', () => {
  const base = parse(contextMeasurement());

  it('같은 조건이면 token delta 를 준다', () => {
    const current = parse(contextMeasurement({ tokens: 46000 }));
    expect(compareContext(current, base)).toEqual({
      comparable: true,
      reasons: [],
      deltaTokens: -895,
      relativeDelta: -895 / 46895,
    });
  });

  it.each([
    ['tokenModel', { tokenModel: 'gpt-4' }],
    ['tokenizerVersion', { tokenizerVersion: '1.0.21' }],
    [
      'provider',
      { provider: 'anthropic-count-tokens', tokenizerVersion: null, tokenizerVersionReason: 'x' },
    ],
    ['contentConstruction', { contentConstruction: 'eval-variant-context-join' }],
    ['scope', { scope: 'variant-routed' }],
  ])('%s 가 다르면 비교하지 않는다', (field, change) => {
    const other = parse(contextMeasurement(change));
    const result = compareContext(other, base);
    expect(result).toMatchObject({ comparable: false, deltaTokens: null, relativeDelta: null });
    expect(result.reasons.join(' ')).toContain(field);
  });

  it('token 이 없는 쪽이 있으면 비교하지 않는다', () => {
    expect(compareContext(parse(missingContext()), base)).toMatchObject({
      comparable: false,
      deltaTokens: null,
    });
  });
});

describe('RunArtifact measurements', () => {
  it('artifact 는 bundle·context measurement 를 담는다', () => {
    expect(
      runArtifactSchema.safeParse(artifact({ contexts: [contextMeasurement()] })).success,
    ).toBe(true);
  });

  it('공개 artifact 에 held-out gold 경로를 context 파일로 싣지 않는다', () => {
    const leaking = contextMeasurement({ files: ['tools/evals/consumer/datasets/test.jsonl'] });
    expect(runArtifactSchema.safeParse(artifact({ contexts: [leaking] })).success).toBe(true);
    expect(publicRunArtifactSchema.safeParse(artifact({ contexts: [leaking] })).success).toBe(
      false,
    );
  });
});
