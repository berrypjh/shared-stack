import { describe, expect, it } from 'vitest';

import { fakeFetch, OTHER_SHA, publicArtifact, publicIndex, SHA } from '../../test/fixtures';

import { loadObservability } from './loadObservability';

const INDEX = '/observability/index.json';
const run = (id: string) => `/observability/runs/${id}.json`;

const load = (
  files: Record<string, unknown>,
  options: { expectedSha?: string; runId?: string } = {},
) => loadObservability(fakeFetch(files).fetcher, options.expectedSha ?? SHA, options.runId);

describe('index', () => {
  it('index 가 없으면 아직 수집한 run 이 없다', async () => {
    expect(await load({})).toMatchObject({ status: 'missing', target: 'index' });
  });

  it('index 에 run 이 없으면 empty', async () => {
    expect(await load({ [INDEX]: publicIndex() })).toEqual({ status: 'empty' });
  });

  it('JSON 이 아니면 invalid — dev 서버의 HTML fallback 을 데이터로 믿지 않는다', async () => {
    expect(await load({ [INDEX]: '<!doctype html><html></html>' })).toMatchObject({
      status: 'invalid',
      target: 'index',
    });
  });

  it('schema 를 어기면 invalid 이고 이유를 준다', async () => {
    const result = await load({ [INDEX]: { version: 2, runs: [] } });
    expect(result).toMatchObject({ status: 'invalid', target: 'index' });
    expect(result.status === 'invalid' && result.message.length).toBeGreaterThan(0);
  });

  it('JSON 을 요청하고 index 가 가리킨 경로만 읽는다', async () => {
    const { fetcher, calls } = fakeFetch({
      [INDEX]: publicIndex('run-a'),
      [run('run-a')]: publicArtifact('run-a'),
    });
    await loadObservability(fetcher, SHA);
    expect(calls).toEqual([
      { url: INDEX, accept: 'application/json' },
      { url: run('run-a'), accept: 'application/json' },
    ]);
  });

  it('요청 자체가 실패하면 unreachable', async () => {
    const failing = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await loadObservability(failing, SHA)).toMatchObject({ status: 'unreachable' });
  });
});

describe('run', () => {
  const files = {
    [INDEX]: publicIndex('run-a', 'run-b'),
    [run('run-a')]: publicArtifact('run-a'),
    [run('run-b')]: publicArtifact('run-b'),
  };

  it('기본은 index 의 마지막 run 이고 목록을 함께 준다', async () => {
    expect(await load(files)).toMatchObject({
      status: 'ready',
      runId: 'run-b',
      runIds: ['run-a', 'run-b'],
    });
  });

  it('고른 run 을 읽는다', async () => {
    expect(await load(files, { runId: 'run-a' })).toMatchObject({
      status: 'ready',
      runId: 'run-a',
    });
  });

  it('index 에 없는 run 을 고르면 missing', async () => {
    expect(await load(files, { runId: 'run-z' })).toMatchObject({
      status: 'missing',
      target: 'run',
    });
  });

  it('index 가 가리킨 파일이 없으면 missing', async () => {
    expect(await load({ [INDEX]: publicIndex('run-a') })).toMatchObject({
      status: 'missing',
      target: 'run',
    });
  });

  it('계약을 어기면 invalid — 음수 bytes 를 화면에 올리지 않는다', async () => {
    const valid = publicArtifact('run-a');
    const broken = {
      ...valid,
      observations: [{ ...valid.observations[0], value: -1 }, valid.observations[1]],
    };
    expect(await load({ [INDEX]: publicIndex('run-a'), [run('run-a')]: broken })).toMatchObject({
      status: 'invalid',
      target: 'run',
    });
  });

  it('artifact 의 run id 가 index 와 다르면 다른 출처라 invalid', async () => {
    const result = await load({
      [INDEX]: publicIndex('run-a'),
      [run('run-a')]: publicArtifact('run-b'),
    });
    expect(result).toMatchObject({ status: 'invalid', target: 'run' });
  });

  it('partial run 도 보여주되 partial 로 표시한다', async () => {
    const partial = publicArtifact('run-a', { state: 'partial' });
    expect(await load({ [INDEX]: publicIndex('run-a'), [run('run-a')]: partial })).toMatchObject({
      status: 'ready',
      partial: true,
    });
  });

  it('source SHA 가 기준과 다르면 stale, 같으면 fresh', async () => {
    const single = { [INDEX]: publicIndex('run-a'), [run('run-a')]: publicArtifact('run-a') };
    expect(await load(single, { expectedSha: OTHER_SHA })).toMatchObject({
      freshness: { status: 'stale' },
    });
    expect(await load(single)).toMatchObject({ partial: false, freshness: { status: 'fresh' } });
  });
});
