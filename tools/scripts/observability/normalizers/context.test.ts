import { compareContext, contextMeasurementSchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import type { VariantContext } from '../../../evals/consumer/variants/context';

import { normalizePackageScenarios, normalizeVariantContexts } from './context';

const TOKENIZER = {
  provider: 'openai-tiktoken-local' as const,
  tokenModel: 'gpt-4o',
  tokenizerVersion: '1.0.22',
};

describe('normalizePackageScenarios', () => {
  const measurements = normalizePackageScenarios({
    target: 'design-tokens',
    packageDir: 'libs/design-tokens',
    tokenizer: TOKENIZER,
    results: [
      {
        scenario: 'catalog-only',
        files: ['dist/tokens.json'],
        missing: [],
        chars: 47929,
        tokens: 16290,
      },
      { scenario: 'empty', files: ['dist/empty.txt'], missing: [], chars: 0, tokens: 0 },
      {
        scenario: 'agents+catalog',
        files: ['dist/AGENTS.md', 'dist/tokens.json'],
        missing: ['dist/AGENTS.md'],
        chars: null,
        tokens: null,
      },
    ],
  });

  it('계약을 통과하고 measure-tokens 의 내용 구성·tokenizer 를 기록한다', () => {
    for (const measurement of measurements)
      expect(contextMeasurementSchema.parse(measurement)).toEqual(measurement);
    expect(measurements[0]).toMatchObject({
      id: 'context.package-scenario.design-tokens.catalog-only.openai',
      scope: 'package-scenario',
      subject: 'design-tokens/catalog-only',
      provider: 'openai-tiktoken-local',
      tokenModel: 'gpt-4o',
      tokenizerVersion: '1.0.22',
      contentConstruction: 'measure-tokens-read-files',
      files: ['libs/design-tokens/dist/tokens.json'],
      availability: 'available',
      tokens: 16290,
    });
  });

  it('실측 0 token 은 0 이다', () => {
    expect(measurements[1]).toMatchObject({ availability: 'available', chars: 0, tokens: 0 });
  });

  it('없는 파일은 missing-input 으로 unavailable 이고 부분 합계를 만들지 않는다', () => {
    expect(measurements[2]).toMatchObject({
      id: 'context.package-scenario.design-tokens.agents-catalog.openai',
      availability: 'unavailable',
      reasonCode: 'missing-input',
      missingPaths: ['libs/design-tokens/dist/AGENTS.md'],
      files: ['libs/design-tokens/dist/tokens.json'],
      chars: null,
      tokens: null,
    });
  });
});

describe('normalizeVariantContexts', () => {
  const routedSize = (tokens: number) => ({
    files: ['libs/react-ui/package.json'],
    missingPaths: [],
    chars: tokens * 3,
    tokens,
  });

  const CONTEXTS: VariantContext[] = [
    {
      variant: 'consumer-docs',
      files: ['libs/react-ui/AGENTS.consumer.md'],
      missingPaths: [],
      chars: 32719,
      tokens: 11959,
      tokenModel: 'gpt-4o',
      routed: null,
    },
    {
      variant: 'progressive-retrieval',
      files: ['libs/react-ui/package.json'],
      missingPaths: [],
      chars: 122615,
      tokens: 35588,
      tokenModel: 'gpt-4o',
      routed: { web: routedSize(15195), 'react-native': routedSize(20393) },
    },
    {
      variant: 'full-source',
      files: [],
      missingPaths: ['libs/ui-core/src/**'],
      chars: null,
      tokens: null,
      tokenModel: 'gpt-4o',
      routed: null,
    },
  ];

  const measurements = normalizeVariantContexts({ contexts: CONTEXTS, tokenizerVersion: '1.0.22' });

  it('initial 과 routed 를 다른 scope 로 나눈다 — routing 이 없으면 routed 행이 없다', () => {
    for (const measurement of measurements)
      expect(contextMeasurementSchema.parse(measurement)).toEqual(measurement);
    expect(measurements.map((m) => [m.id, m.scope, m.tokens])).toEqual([
      ['context.variant-initial.consumer-docs.openai', 'variant-initial', 11959],
      ['context.variant-initial.progressive-retrieval.openai', 'variant-initial', 35588],
      ['context.variant-routed.progressive-retrieval.web.openai', 'variant-routed', 15195],
      ['context.variant-routed.progressive-retrieval.react-native.openai', 'variant-routed', 20393],
      ['context.variant-initial.full-source.openai', 'variant-initial', null],
    ]);
  });

  it('eval 의 내용 구성은 measure-tokens 와 다르게 표시한다', () => {
    expect(new Set(measurements.map((m) => m.contentConstruction))).toEqual(
      new Set(['eval-variant-context-join']),
    );
  });

  it('선언 경로가 없으면 missing-input 이다', () => {
    expect(measurements[4]).toMatchObject({
      availability: 'unavailable',
      reasonCode: 'missing-input',
      missingPaths: ['libs/ui-core/src/**'],
    });
  });

  it('tokenizer 가 다르면 같은 variant 라도 비교하지 않는다', () => {
    const other = normalizeVariantContexts({ contexts: CONTEXTS, tokenizerVersion: '1.0.21' });
    expect(compareContext(other[0], measurements[0])).toMatchObject({
      comparable: false,
      deltaTokens: null,
    });
    expect(compareContext(measurements[0], measurements[0])).toMatchObject({
      comparable: true,
      deltaTokens: 0,
    });
  });
});
