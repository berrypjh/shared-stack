import {
  type ContextMeasurement,
  contextMeasurementSchema,
  sanitizeExcerpt,
  type TOKEN_PROVIDERS,
} from '@berrypjh/observability-contracts';

import type { ContextSize, VariantContext } from '../../../evals/consumer/variants/context';

export type Tokenizer = {
  provider: (typeof TOKEN_PROVIDERS)[number];
  tokenModel: string;
  tokenizerVersion: string | null;
  tokenizerVersionReason?: string | null;
};

/** measure-tokens scenario 하나의 결과. `files`·`missing` 은 package 기준 상대 경로다. */
export type PackageScenarioResult = {
  scenario: string;
  files: string[];
  missing: string[];
  chars: number | null;
  tokens: number | null;
};

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const providerSlug = (provider: Tokenizer['provider']) =>
  provider === 'openai-tiktoken-local' ? 'openai' : 'anthropic';

const missingReason = (missing: string[]) =>
  sanitizeExcerpt(`없는 입력: ${missing.join(', ')}`, 400);

type Size = {
  files: string[];
  missingPaths: string[];
  chars: number | null;
  tokens: number | null;
};

/** 선언된 입력이 하나라도 없으면 부분 합계를 두지 않는다 — 원 metric 과 같은 규칙이다. */
const sizeFields = (size: Size) =>
  size.missingPaths.length > 0 || size.chars === null || size.tokens === null
    ? {
        availability: 'unavailable',
        chars: null,
        tokens: null,
        reason:
          size.missingPaths.length > 0
            ? missingReason(size.missingPaths)
            : 'token 수를 얻지 못했다',
        reasonCode: size.missingPaths.length > 0 ? 'missing-input' : 'provider-error',
      }
    : {
        availability: 'available',
        chars: size.chars,
        tokens: size.tokens,
        reason: null,
        reasonCode: null,
      };

type PackageInput = {
  target: string;
  packageDir: string;
  tokenizer: Tokenizer;
  results: PackageScenarioResult[];
};

/** `tools/scripts/measure-tokens` 의 패키지 시나리오 결과를 계약 모양으로. */
export const normalizePackageScenarios = ({
  target,
  packageDir,
  tokenizer,
  results,
}: PackageInput): ContextMeasurement[] =>
  results.map((result) => {
    const inPackage = (relative: string) => `${packageDir}/${relative}`;
    return contextMeasurementSchema.parse({
      id: `context.package-scenario.${slug(target)}.${slug(result.scenario)}.${providerSlug(tokenizer.provider)}`,
      scope: 'package-scenario',
      subject: `${target}/${result.scenario}`,
      provider: tokenizer.provider,
      tokenModel: tokenizer.tokenModel,
      tokenizerVersion: tokenizer.tokenizerVersion,
      tokenizerVersionReason: tokenizer.tokenizerVersionReason ?? null,
      contentConstruction: 'measure-tokens-read-files',
      files: result.files.filter((file) => !result.missing.includes(file)).map(inPackage),
      missingPaths: result.missing.map(inPackage),
      ...sizeFields({
        files: result.files,
        missingPaths: result.missing.map(inPackage),
        chars: result.chars,
        tokens: result.tokens,
      }),
    });
  });

type VariantInput = { contexts: VariantContext[]; tokenizerVersion: string };

const variantMeasurement = (
  id: string,
  scope: 'variant-initial' | 'variant-routed',
  subject: string,
  tokenModel: string,
  tokenizerVersion: string,
  size: ContextSize,
): ContextMeasurement =>
  contextMeasurementSchema.parse({
    id,
    scope,
    subject,
    provider: 'openai-tiktoken-local',
    tokenModel,
    tokenizerVersion,
    tokenizerVersionReason: null,
    contentConstruction: 'eval-variant-context-join',
    files: size.files,
    missingPaths: size.missingPaths,
    ...sizeFields(size),
  });

/**
 * `measureVariantContext` 결과를 initial 과 routed 로 나눈다. routing 이 없는 variant 는
 * routed 행을 만들지 않는다 — 0 이나 union 으로 채우지 않는다.
 */
export const normalizeVariantContexts = ({
  contexts,
  tokenizerVersion,
}: VariantInput): ContextMeasurement[] =>
  contexts.flatMap((context) => [
    variantMeasurement(
      `context.variant-initial.${slug(context.variant)}.openai`,
      'variant-initial',
      context.variant,
      context.tokenModel,
      tokenizerVersion,
      context,
    ),
    ...Object.entries(context.routed ?? {}).map(([platform, size]) =>
      variantMeasurement(
        `context.variant-routed.${slug(context.variant)}.${slug(platform)}.openai`,
        'variant-routed',
        `${context.variant}@${platform}`,
        context.tokenModel,
        tokenizerVersion,
        size,
      ),
    ),
  ]);
