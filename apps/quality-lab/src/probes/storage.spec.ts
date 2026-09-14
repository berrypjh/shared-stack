import { browserCapabilitySchema } from '@berrypjh/observability-contracts';

import { describe, expect, it, vi } from 'vitest';

import { fakeEnv } from '../test/browser';

import type { BrowserEnv } from './env';
import { initialStorage, storageProbe } from './storage';

const withStorage = (storage: unknown) =>
  fakeEnv({ navigator: { ...fakeEnv().navigator, storage } as BrowserEnv['navigator'] });

const sample = async (storage: unknown) => {
  const items = await storageProbe.sample(withStorage(storage));
  for (const item of items) browserCapabilitySchema.parse(item);
  return Object.fromEntries(items.map((item) => [item.id, item]));
};

describe('storageProbe — origin 추정 quota·usage', () => {
  it('처음에는 읽지 않은 상태다', () => {
    expect(initialStorage(fakeEnv()).map((item) => item.state)).toEqual([
      'not-sampled',
      'not-sampled',
    ]);
  });

  it('usage 0 은 실제 0 이고 둘 다 근사값이다 — persist 는 요청하지 않는다', async () => {
    const persist = vi.fn();
    const items = await sample({ estimate: async () => ({ usage: 0, quota: 1000 }), persist });
    expect(items['storage.usage']).toMatchObject({
      state: 'sampled',
      value: 0,
      unit: 'bytes',
      approximate: true,
    });
    expect(items['storage.quota']).toMatchObject({ value: 1000 });
    expect(persist).not.toHaveBeenCalled();
  });

  it('estimate 가 없으면 지원 안 함이다', async () => {
    expect((await sample({}))['storage.usage']).toMatchObject({ support: 'unsupported' });
    expect((await sample(undefined))['storage.quota']).toMatchObject({ support: 'unsupported' });
  });

  it('거절은 오류, 권한 거절은 권한 필요다', async () => {
    const rejected = await sample({
      estimate: () => Promise.reject(new TypeError('opaque origin')),
    });
    expect(rejected['storage.usage']).toMatchObject({ support: 'unavailable', state: 'error' });
    const denied = await sample({
      estimate: () => Promise.reject(Object.assign(new Error('no'), { name: 'NotAllowedError' })),
    });
    expect(denied['storage.usage']).toMatchObject({
      support: 'permission-required',
      state: 'error',
    });
  });

  it('빈 표본은 0 이 아니라 오류다', async () => {
    const empty = await sample({ estimate: async () => ({}) });
    expect(empty['storage.usage']).toMatchObject({ state: 'error', value: null });
    expect(empty['storage.usage'].reason).toContain('usage 가 없습니다');
  });
});
