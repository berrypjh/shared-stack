import fs from 'node:fs';
import path from 'node:path';

import type { ContextMeasurement } from '@berrypjh/observability-contracts';

import type { TiktokenModel } from 'tiktoken';

import { measureVariantContext } from '../../../evals/consumer/variants/context';
import type { Variant } from '../../../evals/consumer/variants/index';
import { countOpenAITokens } from '../../../lib/token-count';
import {
  findMissingFiles,
  type MeasureTarget,
  readScenarioFiles,
} from '../../measure-tokens/registry';
import {
  normalizePackageScenarios,
  normalizeVariantContexts,
  type PackageScenarioResult,
} from '../normalizers/context';

/** 설치된 tiktoken 버전. tiktoken 의 exports 가 `package.json` 을 막아 require 대신 파일을 읽는다. */
export const readTokenizerVersion = (workspaceRoot: string): string =>
  (
    JSON.parse(
      fs.readFileSync(path.join(workspaceRoot, 'node_modules/tiktoken/package.json'), 'utf8'),
    ) as { version: string }
  ).version;

type PackageInput = {
  workspaceRoot: string;
  targets: Record<string, MeasureTarget>;
  tokenModel: string;
  tokenizerVersion: string;
};

/**
 * measure-tokens 등록부의 시나리오를 CLI 와 같은 내용 구성·같은 tokenizer 로 센다.
 * 로컬 tiktoken 만 쓴다 — 외부 API 를 부르지 않는다. 없는 입력은 읽지 않고 missing-input 으로 남긴다.
 */
export const collectPackageScenarios = async ({
  workspaceRoot,
  targets,
  tokenModel,
  tokenizerVersion,
}: PackageInput): Promise<ContextMeasurement[]> => {
  const measurements: ContextMeasurement[] = [];
  for (const [target, { dir, scenarios }] of Object.entries(targets)) {
    const packageDir = path.join(workspaceRoot, dir);
    const results: PackageScenarioResult[] = [];
    for (const [scenario, files] of Object.entries(scenarios)) {
      const missing = await findMissingFiles(packageDir, files);
      if (missing.length > 0) {
        results.push({ scenario, files, missing, chars: null, tokens: null });
        continue;
      }
      const { content, chars } = await readScenarioFiles(packageDir, files);
      results.push({
        scenario,
        files,
        missing,
        chars,
        tokens: countOpenAITokens(content, tokenModel as TiktokenModel),
      });
    }
    measurements.push(
      ...normalizePackageScenarios({
        target,
        packageDir: dir,
        tokenizer: { provider: 'openai-tiktoken-local', tokenModel, tokenizerVersion },
        results,
      }),
    );
  }
  return measurements;
};

/** consumer eval 의 `measureVariantContext` 를 그대로 호출한다 — 초기·routed 컨텍스트를 다시 세지 않는다. */
export const collectVariantContexts = async ({
  variants,
  tokenizerVersion,
}: {
  variants: Variant[];
  tokenizerVersion: string;
}): Promise<ContextMeasurement[]> => {
  const contexts = [];
  for (const variant of variants) contexts.push(await measureVariantContext(variant));
  return normalizeVariantContexts({ contexts, tokenizerVersion });
};
