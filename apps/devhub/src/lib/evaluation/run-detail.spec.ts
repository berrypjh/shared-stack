import { publicRunArtifactSchema } from '@berrypjh/observability-contracts';

import {
  fakeFetch,
  OTHER_SHA,
  publicArtifact,
  publicIndex,
  SHA,
} from '../../test/evaluation/fixtures';

import { createClient, type Fetcher } from './client';
import { isNoData, problemOf, statusText, verifiedRun } from './run-detail';

const INDEX = '/observability/index.json';
const run = (id: string) => `/observability/runs/${id}.json`;

/** 실행 상세가 `client.run` 으로 받는 index → run 읽기 · 계약 검증 · run id 대조. */
const load = (files: Record<string, unknown>, runId: string, expectedSha = SHA) =>
  createClient(fakeFetch(files).fetcher, expectedSha).run(runId);

describe('client.run — index', () => {
  it('index 가 없으면 아직 수집한 run 이 없다', async () => {
    const result = await load({}, 'run-a');
    expect(result).toMatchObject({ status: 'missing', target: 'index' });
    expect(isNoData(result)).toBe(true);
  });

  it('index 에 run 이 없으면 미수집이다', async () => {
    const result = await load({ [INDEX]: publicIndex() }, 'run-a');
    expect(result).toMatchObject({ status: 'missing', target: 'index' });
    expect(isNoData(result)).toBe(true);
  });

  it('JSON 이 아니면 invalid — dev 서버의 HTML fallback 을 데이터로 믿지 않는다', async () => {
    expect(await load({ [INDEX]: '<!doctype html><html></html>' }, 'run-a')).toMatchObject({
      status: 'invalid',
      target: 'index',
    });
  });

  it('schema 를 어기면 invalid 이고 이유를 준다', async () => {
    const result = await load({ [INDEX]: { version: 2, runs: [] } }, 'run-a');
    expect(result).toMatchObject({ status: 'invalid', target: 'index' });
    expect(result.status === 'invalid' && result.message.length).toBeGreaterThan(0);
  });

  it('JSON 을 요청하고 index 가 가리킨 경로만 읽는다', async () => {
    const { fetcher, calls } = fakeFetch({
      [INDEX]: publicIndex('run-a'),
      [run('run-a')]: publicArtifact('run-a'),
    });
    await createClient(fetcher, SHA).run('run-a');
    expect(calls).toEqual([
      { url: INDEX, accept: 'application/json' },
      { url: run('run-a'), accept: 'application/json' },
    ]);
  });

  it('요청 자체가 실패하면 unreachable', async () => {
    const failing: Fetcher = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await createClient(failing, SHA).run('run-a')).toMatchObject({
      status: 'unreachable',
    });
  });
});

describe('client.run — run', () => {
  const files = {
    [INDEX]: publicIndex('run-a', 'run-b'),
    [run('run-a')]: publicArtifact('run-a'),
    [run('run-b')]: publicArtifact('run-b'),
  };

  it('고른 run 을 읽는다', async () => {
    const result = await load(files, 'run-a');
    expect(result.status === 'ready' && result.value.metadata.runId).toBe('run-a');
  });

  it('index 에 없는 run 을 고르면 missing', async () => {
    expect(await load(files, 'run-z')).toMatchObject({ status: 'missing', target: 'run' });
  });

  it('index 가 가리킨 파일이 없으면 missing', async () => {
    expect(await load({ [INDEX]: publicIndex('run-a') }, 'run-a')).toMatchObject({
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
    expect(
      await load({ [INDEX]: publicIndex('run-a'), [run('run-a')]: broken }, 'run-a'),
    ).toMatchObject({ status: 'invalid', target: 'run' });
  });

  it('artifact 의 run id 가 index 와 다르면 다른 출처라 invalid', async () => {
    const result = await load(
      { [INDEX]: publicIndex('run-a'), [run('run-a')]: publicArtifact('run-b') },
      'run-a',
    );
    expect(result).toMatchObject({ status: 'invalid', target: 'run' });
  });
});

describe('verifiedRun', () => {
  const artifact = (metadata: Record<string, unknown> = {}) =>
    publicRunArtifactSchema.parse(publicArtifact('run-a', metadata));
  const client = (expectedSha: string) => createClient(fakeFetch({}).fetcher, expectedSha);

  it('partial run 도 보여 주되 partial 로 표시한다', () => {
    const partial = artifact({ state: 'partial' });
    expect(verifiedRun(partial, client(SHA).freshness(partial.metadata))).toMatchObject({
      runId: 'run-a',
      partial: true,
    });
  });

  it('source SHA 가 기준과 다르면 stale, 같으면 fresh', () => {
    const complete = artifact();
    expect(verifiedRun(complete, client(OTHER_SHA).freshness(complete.metadata))).toMatchObject({
      freshness: { status: 'stale' },
    });
    expect(verifiedRun(complete, client(SHA).freshness(complete.metadata))).toMatchObject({
      partial: false,
      freshness: { status: 'fresh' },
    });
  });
});

describe('불러오기 결과의 글', () => {
  const noIndex = {
    status: 'missing',
    target: 'index',
    message: 'index.json 파일이 없다',
  } as const;
  const invalid = { status: 'invalid', target: 'run', message: 'observations: 틀림' } as const;

  it('미수집은 검증된 run 이 없을 때만 문제가 아니다', () => {
    expect(problemOf(noIndex, false)).toBeNull();
    expect(problemOf(noIndex, true)).toBe(noIndex);
    expect(problemOf(invalid, false)).toBe(invalid);
    expect(problemOf(null, false)).toBeNull();
  });

  it('상태 알림은 불러오는 중 · 미수집 · 계약 위반 · 파일 없음 · 연결 실패를 구분한다', () => {
    expect(statusText(true, invalid)).toBe('실행 기록을 불러오는 중이다');
    expect(statusText(false, null)).toBe('');
    expect(statusText(false, noIndex)).toBe('공개된 실행 기록이 없다');
    expect(statusText(false, invalid)).toBe('실행 기록이 계약과 맞지 않는다');
    expect(statusText(false, { status: 'missing', target: 'run', message: '' })).toBe(
      '선택한 실행 파일이 없다',
    );
    expect(statusText(false, { status: 'unreachable', target: 'run', message: '' })).toBe(
      '실행 기록을 불러오지 못했다',
    );
  });
});
