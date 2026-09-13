import { summarizeRun } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { fakeFetch, publicArtifact, SHA } from '../../test/fixtures';

import { createClient } from './client';

const INDEX = '/observability/index.json';
const RUN = '/observability/runs/run-a.json';
const SUMMARY = '/observability/runs/run-a.summary.json';

const withSummary = {
  version: 1,
  runs: [{ id: 'run-a', path: 'runs/run-a.json', summary: 'runs/run-a.summary.json' }],
};

const summaryOf = (runId: string) => summarizeRun(publicArtifact(runId) as never);

const urls = (calls: { url: string }[]) => calls.map((call) => call.url);

describe('createClient — index → 요약 → 필요한 detail 만', () => {
  it('요약은 run 파일을 받지 않는다', async () => {
    const { fetcher, calls } = fakeFetch({ [INDEX]: withSummary, [SUMMARY]: summaryOf('run-a') });
    const client = createClient(fetcher, SHA);
    const summary = await client.summary('run-a');
    expect(summary).toMatchObject({ status: 'ready', source: 'summary' });
    expect(urls(calls)).toEqual([INDEX, SUMMARY]);
  });

  it('run detail 은 필요할 때만 받고 같은 run 은 다시 받지 않는다', async () => {
    const { fetcher, calls } = fakeFetch({
      [INDEX]: withSummary,
      [RUN]: publicArtifact('run-a'),
    });
    const client = createClient(fetcher, SHA);
    expect(await client.run('run-a')).toMatchObject({ status: 'ready' });
    await client.run('run-a');
    expect(urls(calls)).toEqual([INDEX, RUN]);
  });

  it('요약 파일이 없는 이전 export 는 그렇게 말하고 run 을 몰래 받지 않는다', async () => {
    const legacy = { version: 1, runs: [{ id: 'run-a', path: 'runs/run-a.json' }] };
    const { fetcher, calls } = fakeFetch({ [INDEX]: legacy, [RUN]: publicArtifact('run-a') });
    const client = createClient(fetcher, SHA);
    expect(await client.summary('run-a')).toEqual({
      status: 'missing',
      target: 'summary',
      message: 'run-a 의 요약 파일이 index 에 없습니다 — 다시 export 하세요',
    });
    expect(urls(calls)).toEqual([INDEX]);
  });

  it('요약이 필요한데 파일이 없으면 run 을 읽어 같은 함수로 요약할 수 있다', async () => {
    const legacy = { version: 1, runs: [{ id: 'run-a', path: 'runs/run-a.json' }] };
    const { fetcher } = fakeFetch({ [INDEX]: legacy, [RUN]: publicArtifact('run-a') });
    const summary = await createClient(fetcher, SHA).summary('run-a', { fallbackToRun: true });
    expect(summary).toEqual({ status: 'ready', source: 'run', value: summaryOf('run-a') });
  });

  it('index 에 없는 run 은 파일을 요청하지 않고 missing 이다', async () => {
    const { fetcher, calls } = fakeFetch({ [INDEX]: withSummary });
    expect(await createClient(fetcher, SHA).run('run-z')).toMatchObject({
      status: 'missing',
      target: 'run',
    });
    expect(urls(calls)).toEqual([INDEX]);
  });

  it('계약을 어긴 요약은 invalid 다', async () => {
    const { fetcher } = fakeFetch({ [INDEX]: withSummary, [SUMMARY]: { metadata: 'x' } });
    expect(await createClient(fetcher, SHA).summary('run-a')).toMatchObject({
      status: 'invalid',
      target: 'summary',
    });
  });

  it('요약 파일의 run id 가 다르면 다른 run 의 요약이라 invalid 다', async () => {
    const { fetcher } = fakeFetch({ [INDEX]: withSummary, [SUMMARY]: summaryOf('run-b') });
    expect(await createClient(fetcher, SHA).summary('run-a')).toMatchObject({
      status: 'invalid',
      target: 'summary',
    });
  });

  it('clear 하면 다시 받는다', async () => {
    const { fetcher, calls } = fakeFetch({ [INDEX]: withSummary, [RUN]: publicArtifact('run-a') });
    const client = createClient(fetcher, SHA);
    await client.run('run-a');
    client.clear();
    await client.run('run-a');
    expect(urls(calls)).toEqual([INDEX, RUN, INDEX, RUN]);
  });

  it('freshness 는 build 기준 SHA 와 비교한다', async () => {
    const { fetcher } = fakeFetch({ [INDEX]: withSummary, [SUMMARY]: summaryOf('run-a') });
    const client = createClient(fetcher, 'b'.repeat(40));
    const summary = await client.summary('run-a');
    expect(summary.status === 'ready' && client.freshness(summary.value.metadata).status).toBe(
      'stale',
    );
  });
});
