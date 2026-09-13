import type { BrowserSupport } from '@berrypjh/observability-contracts';

import {
  type Capability,
  type CapabilityBase,
  failed,
  isCount,
  missing,
  pending,
  sampled,
} from './capability';
import type { BrowserEnv } from './env';
import { attempt, attemptAsync, isPermissionName } from './safe';

const LIMITATION =
  'origin 단위 추정값 — 압축·중복 제거·보안 목적 padding 으로 정확하지 않습니다. persist 는 요청하지 않습니다';

const USAGE: CapabilityBase = {
  id: 'storage.usage',
  group: 'storage',
  label: '사용량 추정 (storage.estimate)',
  unit: 'bytes',
  approximate: true,
  limitation: LIMITATION,
};

const QUOTA: CapabilityBase = {
  ...USAGE,
  id: 'storage.quota',
  label: 'quota 추정 (storage.estimate)',
};

const ABSENT = 'navigator.storage.estimate 가 없습니다 (secure context 가 아니거나 미지원)';

type Storage = NonNullable<NonNullable<BrowserEnv['navigator']>['storage']>;

const readStorage = (env: BrowserEnv) => attempt(() => env.navigator?.storage);

const both = (make: (base: CapabilityBase) => Capability) => [make(USAGE), make(QUOTA)];

const hasEstimate = (storage: Storage | undefined): storage is Required<Storage> =>
  typeof storage?.estimate === 'function';

/** 첫 렌더 값. estimate 가 있으면 아직 읽지 않은 상태다. */
export const initialStorage = (env: BrowserEnv): Capability[] => {
  const storage = readStorage(env);
  if (!storage.ok)
    return both((item) => failed(item, `읽는 중 오류 — ${storage.error}`, env.now()));
  return hasEstimate(storage.value)
    ? both(pending)
    : both((item) => missing(item, 'unsupported', ABSENT));
};

export const storageProbe = {
  id: 'storage',
  detect: (env: BrowserEnv): BrowserSupport => {
    const storage = readStorage(env);
    return storage.ok && hasEstimate(storage.value) ? 'supported' : 'unsupported';
  },
  sample: async (env: BrowserEnv): Promise<Capability[]> => {
    const storage = readStorage(env);
    if (!storage.ok) return initialStorage(env);
    const source = storage.value;
    if (!hasEstimate(source)) return both((item) => missing(item, 'unsupported', ABSENT));
    const result = await attemptAsync(() => source.estimate());
    const now = env.now();
    if (!result.ok) {
      const support = isPermissionName(result.name) ? 'permission-required' : 'unavailable';
      return both((item) => failed(item, `estimate 거절 — ${result.error}`, now, support));
    }
    const estimate = result.value ?? {};
    return [
      isCount(estimate.usage)
        ? sampled(USAGE, estimate.usage, now)
        : failed(USAGE, 'estimate 결과에 usage 가 없습니다', now),
      isCount(estimate.quota)
        ? sampled(QUOTA, estimate.quota, now)
        : failed(QUOTA, 'estimate 결과에 quota 가 없습니다', now),
    ];
  },
};
