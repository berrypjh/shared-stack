import fs from 'node:fs/promises';
import path from 'node:path';

import { runArtifactSchema } from '@berrypjh/observability-contracts';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { measureContexts } from '../../../evals/consumer/runner/offline';
import { writeRunArtifacts } from '../../../evals/consumer/runner/pipeline';
import { runFixture } from '../__fixtures__/eval-run';
import { SHA, sha256, tempDir } from '../__fixtures__/fixtures';
import { toPublicArtifact } from '../export';
import { BoundaryError } from '../safe-fs';

import { collectEval } from './eval';

const result = await runFixture();
let workspace: string;

const git = {
  head: async () => `${SHA}\n`,
  commitTime: async () => '2026-09-13T13:16:29+09:00',
  status: async () => '',
  diff: async () => '',
};

const collect = (from: string) =>
  collectEval({
    workspaceRoot: workspace,
    runId: 'eval-01',
    from,
    git,
    env: {},
    now: () => new Date('2026-09-13T14:00:00.000Z'),
    toolVersions: { node: 'v24.20.0' },
    tokenizerVersion: '1.0.22',
    readBaseline: async () => ({ status: 'missing' }),
  });

const evalDir = (name: string) => path.join(workspace, 'tmp/llm-evals', name);

beforeEach(async () => {
  workspace = await tempDir('eval-workspace');
  await writeRunArtifacts(evalDir('run-a'), result);
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe('collectEval', () => {
  it('summary·traces 를 다시 실행하지 않고 eval profile run 으로 가져온다', async () => {
    const { artifact, raw } = await collect('tmp/llm-evals/run-a');
    expect(runArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.metadata).toMatchObject({ profile: 'eval', state: 'complete' });
    expect(artifact.observations).toEqual([]);

    const [evalRun] = artifact.evals;
    expect(evalRun).toMatchObject({
      sourceId: 'eval:run-a',
      traceCount: 6,
      executorClass: 'scripted',
    });
    expect(evalRun.import.routing.status).toBe('missing');

    const summaryText = await fs.readFile(path.join(evalDir('run-a'), 'summary.json'), 'utf8');
    expect(raw).toEqual([
      {
        path: 'eval-inputs.json',
        value: {
          from: 'tmp/llm-evals/run-a',
          files: expect.arrayContaining([
            { path: 'summary.json', status: 'parsed', sha256: sha256(summaryText) },
          ]),
        },
      },
    ]);
    expect(JSON.stringify(toPublicArtifact(artifact))).not.toContain('import * as ui');
  });

  it('tmp/llm-evals 밖은 읽지 않는다', async () => {
    await expect(collect('tmp/observability/runs')).rejects.toBeInstanceOf(BoundaryError);
    await expect(collect('tmp/llm-evals/../observability')).rejects.toBeInstanceOf(BoundaryError);
  });

  it('traces 가 없으면 partial 이고 summary 는 그대로 보인다', async () => {
    await fs.rm(path.join(evalDir('run-a'), 'traces.jsonl'));
    const { artifact } = await collect('tmp/llm-evals/run-a');
    const [evalRun] = artifact.evals;
    expect(artifact.metadata.state).toBe('partial');
    expect(evalRun.import.traces.status).toBe('missing');
    expect(evalRun.variants).toHaveLength(1);
    expect(evalRun.notices.map((notice) => notice.code)).toContain('partial-import');
  });

  it('깨진 trace 줄은 줄 번호와 함께 invalid 로 남긴다', async () => {
    const file = path.join(evalDir('run-a'), 'traces.jsonl');
    const lines = (await fs.readFile(file, 'utf8')).split('\n');
    lines[1] = '{oops';
    await fs.writeFile(file, lines.join('\n'));
    const { artifact } = await collect('tmp/llm-evals/run-a');
    expect(artifact.metadata.state).toBe('partial');
    expect(artifact.evals[0].import.traces).toMatchObject({ status: 'invalid' });
    expect(artifact.evals[0].import.traces.reason).toContain('traces.jsonl:2');
  });

  it('context-only 산출물은 success 를 not-run 으로 두고 context 만 싣는다', async () => {
    const contexts = await measureContexts(['consumer-docs']);
    await fs.mkdir(evalDir('offline'), { recursive: true });
    await fs.writeFile(
      path.join(evalDir('offline'), 'context.json'),
      JSON.stringify({ kind: 'context-only', executor: null, contexts }),
    );
    const { artifact } = await collect('tmp/llm-evals/offline');
    const [evalRun] = artifact.evals;
    expect(artifact.metadata.state).toBe('complete');
    expect(evalRun).toMatchObject({ origin: null, variants: [], traceCount: null });
    expect(evalRun.import.summary.status).toBe('not-run');
    expect(artifact.contexts.map((measurement) => measurement.id)).toContain(
      'context.variant-initial.consumer-docs.openai',
    );
  });

  it('가져올 산출물이 하나도 없으면 실패한다', async () => {
    await fs.mkdir(evalDir('empty'), { recursive: true });
    await expect(collect('tmp/llm-evals/empty')).rejects.toThrow(/no eval artifacts/);
  });
});

describe('collectEval — live 실행의 실제 입력', () => {
  /** fixture 실행을 live executor 가 만든 것처럼 바꾸고, 한도로 뺀 variant 를 남긴다. */
  const asLive = async (dir: string) => {
    const summaryFile = path.join(dir, 'summary.json');
    const summary = JSON.parse(await fs.readFile(summaryFile, 'utf8'));
    await fs.writeFile(
      summaryFile,
      JSON.stringify({ ...summary, executor: 'anthropic-live', model: 'claude-test' }),
    );
    const tracesFile = path.join(dir, 'traces.jsonl');
    const lines = (await fs.readFile(tracesFile, 'utf8')).trim().split('\n');
    await fs.writeFile(
      tracesFile,
      `${lines
        .map((line) =>
          JSON.stringify({ ...JSON.parse(line), executor: 'anthropic-live', model: 'claude-test' }),
        )
        .join('\n')}\n`,
    );
    await fs.writeFile(
      path.join(dir, 'live-skipped.json'),
      JSON.stringify([
        {
          variant: 'full-source',
          reason: '컨텍스트 한도 초과 — 첫 메시지 387,000 토큰 > 한도 200,000',
        },
      ]),
    );
  };

  it('trial 마다 API 사용량을 실제 입력 행으로, 뺀 variant 는 이유 행으로 싣는다', async () => {
    await asLive(evalDir('run-a'));
    const { artifact } = await collect('tmp/llm-evals/run-a');
    expect(artifact.evals[0].executorClass).toBe('live');
    expect(artifact.evals[0].skippedVariants).toEqual([
      {
        variant: 'full-source',
        label: 'Full Source',
        reason: '컨텍스트 한도 초과 — 첫 메시지 387,000 토큰 > 한도 200,000',
      },
    ]);
    expect(artifact.evals[0].variants.every((variant) => variant.description)).toBe(true);

    const inputs = artifact.contexts.filter((row) => row.scope === 'agent-input');
    expect(inputs).toHaveLength((artifact.evals[0].traceCount ?? 0) + 1);
    const measured = inputs.filter((row) => row.availability === 'available');
    expect(measured.every((row) => row.tokens === 1000 && row.chars === null)).toBe(true);
    expect(measured[0]).toMatchObject({
      provider: 'anthropic-messages-usage',
      tokenModel: 'claude-test',
      contentConstruction: 'executor-reported',
    });
    expect(measured[0].subject).toMatch(/^[a-z-]+::[a-z0-9-]+::1$/);
    expect(inputs.at(-1)).toMatchObject({
      subject: 'full-source',
      availability: 'unavailable',
      reasonCode: 'not-collected',
      definition: { label: 'Full Source' },
    });
  });

  it('live 가 아닌 실행은 실제 입력 행을 만들지 않는다 — smoke 의 고정값은 실측이 아니다', async () => {
    const { artifact } = await collect('tmp/llm-evals/run-a');
    expect(artifact.contexts.filter((row) => row.scope === 'agent-input')).toEqual([]);
  });
});
