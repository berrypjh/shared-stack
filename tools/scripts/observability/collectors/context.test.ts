import fs from 'node:fs/promises';
import path from 'node:path';

import { contextMeasurementSchema } from '@berrypjh/observability-contracts';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { measureVariantContext } from '../../../evals/consumer/variants/context';
import { VARIANTS } from '../../../evals/consumer/variants/index';
import { countOpenAITokens } from '../../../lib/token-count';
import { readScenarioFiles } from '../../measure-tokens/registry';
import { tempDir } from '../__fixtures__/fixtures';

import { collectPackageScenarios, collectVariantContexts, readTokenizerVersion } from './context';

let workspace: string;

const TARGETS = {
  fixture: {
    dir: 'libs/fixture',
    scenarios: {
      baseline: ['package.json', 'dist/types.d.ts'],
      'agents-only': ['dist/AGENTS.md'],
    },
  },
};

beforeEach(async () => {
  workspace = await tempDir('context-workspace');
  await fs.mkdir(path.join(workspace, 'libs/fixture/dist'), { recursive: true });
  await fs.writeFile(path.join(workspace, 'libs/fixture/package.json'), '{"name":"@fixture/x"}');
  await fs.writeFile(
    path.join(workspace, 'libs/fixture/dist/types.d.ts'),
    'export declare const x: number;\n',
  );
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe('collectPackageScenarios', () => {
  it('measure-tokens 와 같은 내용 구성·같은 tokenizer 로 센다', async () => {
    const [baseline] = await collectPackageScenarios({
      workspaceRoot: workspace,
      targets: TARGETS,
      tokenModel: 'gpt-4o',
      tokenizerVersion: '1.0.22',
    });
    const { content } = await readScenarioFiles(
      path.join(workspace, 'libs/fixture'),
      TARGETS.fixture.scenarios.baseline,
    );
    expect(contextMeasurementSchema.parse(baseline)).toEqual(baseline);
    expect(baseline).toMatchObject({
      id: 'context.package-scenario.fixture.baseline.openai',
      availability: 'available',
      chars: content.length,
      tokens: countOpenAITokens(content, 'gpt-4o'),
      tokenizerVersion: '1.0.22',
    });
  });

  it('없는 입력은 문서를 만들지 않고 missing-input 으로 남긴다', async () => {
    const [, agents] = await collectPackageScenarios({
      workspaceRoot: workspace,
      targets: TARGETS,
      tokenModel: 'gpt-4o',
      tokenizerVersion: '1.0.22',
    });
    expect(agents).toMatchObject({
      availability: 'unavailable',
      reasonCode: 'missing-input',
      missingPaths: ['libs/fixture/dist/AGENTS.md'],
      tokens: null,
    });
    await expect(fs.access(path.join(workspace, 'libs/fixture/dist/AGENTS.md'))).rejects.toThrow();
  });
});

describe('readTokenizerVersion', () => {
  it('설치된 tiktoken 버전을 package.json 에서 읽는다', async () => {
    const { version } = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'node_modules/tiktoken/package.json'), 'utf8'),
    ) as { version: string };
    expect(readTokenizerVersion(process.cwd())).toBe(version);
  });
});

describe('collectVariantContexts', () => {
  it('eval 의 measureVariantContext 결과를 그대로 옮긴다 — 다시 세지 않는다', async () => {
    const variant = VARIANTS['progressive-retrieval'];
    const measured = await measureVariantContext(variant);
    const measurements = await collectVariantContexts({
      variants: [variant],
      tokenizerVersion: '1.0.22',
    });
    expect(measurements[0]).toMatchObject({
      scope: 'variant-initial',
      tokens: measured.tokens,
      files: measured.files,
    });
    expect(measurements.filter((m) => m.scope === 'variant-routed').map((m) => m.tokens)).toEqual(
      Object.values(measured.routed ?? {}).map((size) => size.tokens),
    );
  });
});
