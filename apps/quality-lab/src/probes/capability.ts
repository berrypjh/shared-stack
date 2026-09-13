import type { BrowserCapability, BrowserSupport } from '@berrypjh/observability-contracts';

import type { BrowserEnv, EventTargetLike, Listener } from './env';
import { attempt, peek } from './safe';

export type Capability = BrowserCapability;
export type CapabilityBase = Pick<
  Capability,
  'id' | 'group' | 'label' | 'unit' | 'approximate' | 'limitation'
>;
type Value = NonNullable<Capability['value']>;

export type Dispose = () => void;

/**
 * probe 한 벌. `detect` 는 주 API 가 있는지, `sample` 은 지금 값, `subscribe` 는 바뀔 때 알림을
 * 등록하고 떼는 함수를 돌려준다.
 */
export type SyncProbe = {
  id: string;
  detect: (env: BrowserEnv) => BrowserSupport;
  sample: (env: BrowserEnv) => Capability[];
  subscribe: (env: BrowserEnv, onChange: () => void) => Dispose;
};

export const ABSENT = '이 브라우저에 없는 속성입니다';

export const sampled = (
  base: CapabilityBase,
  value: Value,
  now: number,
  detail: Capability['detail'] = null,
): Capability => ({
  ...base,
  support: 'supported',
  state: 'sampled',
  value,
  reason: null,
  detail,
  sampleTime: now,
});

/** 지원되지만 아직 읽지 않았다. */
export const pending = (base: CapabilityBase): Capability => ({
  ...base,
  support: 'supported',
  state: 'not-sampled',
  value: null,
  reason: null,
  detail: null,
  sampleTime: null,
});

export const missing = (
  base: CapabilityBase,
  support: Exclude<BrowserSupport, 'supported'>,
  reason: string,
): Capability => ({
  ...base,
  support,
  state: 'not-sampled',
  value: null,
  reason,
  detail: null,
  sampleTime: null,
});

export const failed = (
  base: CapabilityBase,
  reason: string,
  now: number,
  support: Exclude<BrowserSupport, 'supported'> = 'unavailable',
): Capability => ({
  ...base,
  support,
  state: 'error',
  value: null,
  reason,
  detail: null,
  sampleTime: now,
});

export const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
export const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isTextList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/** 한 속성을 읽는다. 던지면 오류, 없으면 지원 안 함, 형식이 다르면 오류다 — false·0 은 값이다. */
export const readCapability = (
  base: CapabilityBase,
  read: () => unknown,
  env: BrowserEnv,
  accept: (value: unknown) => value is Value,
  absentReason = ABSENT,
): Capability => {
  const result = attempt(read);
  const now = env.now();
  if (!result.ok) return failed(base, `읽는 중 오류 — ${result.error}`, now);
  if (result.value === undefined || result.value === null) {
    return missing(base, 'unsupported', absentReason);
  }
  if (!accept(result.value)) {
    return failed(base, `예상과 다른 형식입니다 (${typeof result.value})`, now);
  }
  const value = Array.isArray(result.value) ? result.value.slice(0, 20) : result.value;
  return sampled(base, value, now);
};

/** `true` 면 지원·값 true, `false` 면 지원 안 함. allowlist capability 용이다. */
export const readPresence = (
  base: CapabilityBase,
  read: () => boolean,
  env: BrowserEnv,
  absentReason: string,
): Capability => {
  const result = attempt(read);
  if (!result.ok) return failed(base, `읽는 중 오류 — ${result.error}`, env.now());
  return result.value ? sampled(base, true, env.now()) : missing(base, 'unsupported', absentReason);
};

const noop: Dispose = () => undefined;

/** 대상이 이벤트를 받을 수 있을 때만 등록한다. 등록·해제 오류는 삼킨다. */
export const listen = (
  target: () => Partial<EventTargetLike> | undefined,
  type: string,
  listener: Listener,
): Dispose => {
  const resolved = peek(target);
  if (!resolved || typeof resolved.addEventListener !== 'function') return noop;
  const added = attempt(() => resolved.addEventListener?.(type, listener));
  if (!added.ok) return noop;
  return () => {
    attempt(() => resolved.removeEventListener?.(type, listener));
  };
};

export const combine =
  (disposers: Dispose[]): Dispose =>
  () => {
    for (const dispose of disposers) dispose();
  };

export const NOOP_DISPOSE = noop;
