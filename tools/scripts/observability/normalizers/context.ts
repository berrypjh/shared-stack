import {
  type ContextMeasurement,
  contextMeasurementSchema,
  sanitizeExcerpt,
  type TOKEN_PROVIDERS,
  type VariantDefinition,
} from '@berrypjh/observability-contracts';

import type { GradedTrace } from '../../../evals/consumer/runner/trace';
import type { ContextSize, VariantContext } from '../../../evals/consumer/variants/context';
import type { Variant } from '../../../evals/consumer/variants/index';

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

type VariantInput = {
  contexts: VariantContext[];
  tokenizerVersion: string;
  /** variant id → 이름 · 설명. 없는 id 는 정의 없이 둔다. */
  definitions: Record<string, VariantDefinition>;
};

/** consumer eval variant 의 이름 · 설명을 계약의 정의 모양으로. */
export const variantDefinitions = (variants: Variant[]): Record<string, VariantDefinition> =>
  Object.fromEntries(
    variants.map((variant) => [
      variant.id,
      { label: variant.label, description: variant.description },
    ]),
  );

const variantMeasurement = (
  id: string,
  scope: 'variant-initial' | 'variant-routed',
  subject: string,
  tokenModel: string,
  tokenizerVersion: string,
  size: ContextSize,
  definition: VariantDefinition | undefined,
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
    ...(definition && { definition }),
    ...sizeFields(size),
  });

/**
 * `measureVariantContext` 결과를 initial 과 routed 로 나눈다. routing 이 없는 variant 는
 * routed 행을 만들지 않는다 — 0 이나 union 으로 채우지 않는다.
 */
export const normalizeVariantContexts = ({
  contexts,
  tokenizerVersion,
  definitions,
}: VariantInput): ContextMeasurement[] =>
  contexts.flatMap((context) => [
    variantMeasurement(
      `context.variant-initial.${slug(context.variant)}.openai`,
      'variant-initial',
      context.variant,
      context.tokenModel,
      tokenizerVersion,
      context,
      definitions[context.variant],
    ),
    ...Object.entries(context.routed ?? {}).map(([platform, size]) =>
      variantMeasurement(
        `context.variant-routed.${slug(context.variant)}.${slug(platform)}.openai`,
        'variant-routed',
        `${context.variant}@${platform}`,
        context.tokenModel,
        tokenizerVersion,
        size,
        definitions[context.variant],
      ),
    ),
  ]);

/** live executor 가 남긴 trace 하나 · 실행하지 않은 variant 하나. */
type AgentInputInput = {
  traces: Pick<GradedTrace, 'variant' | 'taskId' | 'trial' | 'inputTokens'>[];
  skipped: { variant: string; reason: string }[];
  model: string;
  /** 사용량을 보고한 API 형식. executor 이름(`live-openai` 등)에서 정한다. */
  provider: UsageProvider;
  definitions: Record<string, VariantDefinition>;
};

const USAGE_REASON = 'API 가 보고한 사용량 — tokenizer 버전을 알 수 없음';

type UsageProvider = 'anthropic-messages-usage' | 'openai-chat-usage';

/** live executor 이름에서 사용량을 보고한 API 형식을 정한다. */
export const usageProviderOf = (executor: string): UsageProvider =>
  executor === 'live-openai' ? 'openai-chat-usage' : 'anthropic-messages-usage';

const agentInputRow = (
  provider: UsageProvider,
  subject: string,
  variant: string,
  model: string,
  definitions: Record<string, VariantDefinition>,
  size:
    | { tokens: number }
    | { tokens: null; reason: string; reasonCode: 'not-collected' | 'provider-error' },
): ContextMeasurement =>
  contextMeasurementSchema.parse({
    id: `context.agent-input.${slug(subject)}.anthropic`,
    scope: 'agent-input',
    subject,
    provider,
    tokenModel: model,
    tokenizerVersion: null,
    tokenizerVersionReason: USAGE_REASON,
    contentConstruction: 'executor-reported',
    files: [],
    missingPaths: [],
    ...(definitions[variant] && { definition: definitions[variant] }),
    ...(size.tokens === null
      ? {
          availability: 'unavailable',
          chars: null,
          tokens: null,
          reason: size.reason,
          reasonCode: size.reasonCode,
        }
      : {
          availability: 'available',
          chars: null,
          tokens: size.tokens,
          reason: null,
          reasonCode: null,
        }),
  });

/**
 * live 실행의 실제 입력 토큰. trial 마다 한 행이고(`<variant>::<task>::<trial>`), 값은 executor 가
 * 매 턴 API 사용량을 더한 것이다. 실행하지 않은 variant 는 0 이 아니라 이유가 있는 행으로 남는다.
 */
export const normalizeAgentInputs = ({
  traces,
  skipped,
  model,
  provider,
  definitions,
}: AgentInputInput): ContextMeasurement[] => [
  ...traces.map((trace) =>
    agentInputRow(
      provider,
      `${trace.variant}::${trace.taskId}::${trace.trial}`,
      trace.variant,
      model,
      definitions,
      trace.inputTokens === null
        ? {
            tokens: null,
            reason: 'executor 가 입력 토큰을 보고하지 않았다',
            reasonCode: 'provider-error',
          }
        : { tokens: trace.inputTokens },
    ),
  ),
  ...skipped.map((item) =>
    agentInputRow(provider, item.variant, item.variant, model, definitions, {
      tokens: null,
      reason: sanitizeExcerpt(item.reason, 400),
      reasonCode: 'not-collected',
    }),
  ),
];
