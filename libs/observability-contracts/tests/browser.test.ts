import { describe, expect, it } from 'vitest';

import {
  browserCapabilitySchema,
  browserSessionSchema,
  PERFORMANCE_SCOPE_OF,
  runtimePerformanceSchema,
} from '../src/index.js';

const capability = (overrides: Record<string, unknown> = {}) => ({
  id: 'network.online',
  group: 'connectivity',
  label: '온라인 hint',
  support: 'supported',
  state: 'sampled',
  value: true,
  unit: null,
  approximate: false,
  limitation: 'connectivity hint — 인터넷 연결을 보장하지 않는다',
  reason: null,
  detail: null,
  sampleTime: 1_700_000_000_000,
  ...overrides,
});

const okCapability = (overrides: Record<string, unknown>) =>
  browserCapabilitySchema.safeParse(capability(overrides)).success;

const notSampled = { state: 'not-sampled', value: null, sampleTime: null };

describe('BrowserCapability — 지원 상태와 값 상태는 다른 축이다', () => {
  it('실제 false·0 은 측정한 값이다', () => {
    expect(okCapability({ value: false })).toBe(true);
    expect(okCapability({ id: 'storage.usage', group: 'storage', value: 0, unit: 'bytes' })).toBe(
      true,
    );
  });

  it('측정됨인데 값이나 측정 시각이 없으면 거부한다', () => {
    expect(okCapability({ value: null })).toBe(false);
    expect(okCapability({ sampleTime: null })).toBe(false);
  });

  it('지원 안 함은 값 없이 이유를 가진다 — false 값으로 바꾸지 않는다', () => {
    expect(okCapability({ support: 'unsupported', ...notSampled, reason: 'API 가 없다' })).toBe(
      true,
    );
    expect(
      okCapability({ support: 'unsupported', ...notSampled, value: false, reason: 'API 가 없다' }),
    ).toBe(false);
    expect(okCapability({ support: 'unsupported', ...notSampled })).toBe(false);
    expect(okCapability({ support: 'unsupported', reason: 'API 가 없다' })).toBe(false);
  });

  it('표본 대기는 지원될 때만이고 값이 없다', () => {
    expect(okCapability({ state: 'awaiting-sample', value: null, sampleTime: null })).toBe(true);
    expect(
      okCapability({
        support: 'not-measured',
        state: 'awaiting-sample',
        value: null,
        sampleTime: null,
        reason: '지원을 확인할 수 없다',
      }),
    ).toBe(false);
  });

  it('오류는 이유를 가진다', () => {
    const error = { support: 'unavailable', state: 'error', value: null };
    expect(okCapability(error)).toBe(false);
    expect(okCapability({ ...error, reason: 'TypeError: boom' })).toBe(true);
  });
});

const shift = {
  entryType: 'layout-shift',
  startTime: 120.5,
  duration: 0,
  value: 0,
  hadRecentInput: false,
};

const perf = (overrides: Record<string, unknown> = {}) => ({
  entryType: 'layout-shift',
  scope: 'document-lifetime',
  support: 'supported',
  state: 'sampled',
  timeOrigin: 1_699_999_999_000,
  sampleTime: 1_700_000_000_000,
  provisional: true,
  entries: [shift],
  totalEntries: 1,
  reason: null,
  ...overrides,
});

const okPerf = (overrides: Record<string, unknown>) =>
  runtimePerformanceSchema.safeParse(perf(overrides)).success;

const resource = (overrides: Record<string, unknown> = {}) => ({
  entryType: 'resource',
  name: 'https://cdn.example.com/a.js',
  initiatorType: 'script',
  startTime: 1,
  duration: 2,
  timingAllow: 'cross-origin-restricted',
  transferSize: 0,
  transferMeaning: 'zero-timing-restricted',
  encodedBodySize: 0,
  decodedBodySize: 0,
  ...overrides,
});

const resourcePerf = (entry: Record<string, unknown>) =>
  runtimePerformanceSchema.safeParse(
    perf({ entryType: 'resource', scope: 'document-lifetime', entries: [entry] }),
  ).success;

describe('RuntimePerformance — entry 관측이지 Web Vitals 가 아니다', () => {
  it('관측한 0 은 sampled 다', () => {
    expect(okPerf({})).toBe(true);
  });

  it('entry 가 없으면 sampled 가 아니라 awaiting-sample 이다', () => {
    expect(okPerf({ entries: [], totalEntries: 0 })).toBe(false);
    expect(
      okPerf({ state: 'awaiting-sample', entries: [], totalEntries: 0, sampleTime: null }),
    ).toBe(true);
    expect(okPerf({ state: 'awaiting-sample' })).toBe(false);
  });

  it('지원 안 함은 entry 없이 이유를 가진다', () => {
    const unsupported = {
      support: 'unsupported',
      state: 'not-sampled',
      entries: [],
      totalEntries: 0,
      sampleTime: null,
      provisional: false,
    };
    expect(okPerf({ ...unsupported, reason: 'supportedEntryTypes 에 없다' })).toBe(true);
    expect(okPerf(unsupported)).toBe(false);
    expect(okPerf({ ...unsupported, entries: [shift], totalEntries: 1, reason: 'x' })).toBe(false);
  });

  it('scope 는 entryType 이 정한다 — navigation 은 hard navigation 이다', () => {
    expect(PERFORMANCE_SCOPE_OF.navigation).toBe('hard-navigation');
    expect(PERFORMANCE_SCOPE_OF.event).toBe('interaction');
    expect(okPerf({ scope: 'hard-navigation' })).toBe(false);
  });

  it('한 묶음에 다른 entry 종류가 섞이지 않고, 전체 수는 보존한 수 이상이다', () => {
    expect(okPerf({ entries: [{ entryType: 'longtask', startTime: 1, duration: 60 }] })).toBe(
      false,
    );
    expect(okPerf({ entries: [shift, shift], totalEntries: 1 })).toBe(false);
  });

  it('TAO 로 가려진 resource 의 0 은 크기가 아니다', () => {
    expect(resourcePerf(resource())).toBe(true);
    expect(resourcePerf(resource({ transferMeaning: 'measured' }))).toBe(false);
    expect(
      resourcePerf(
        resource({ timingAllow: 'same-origin', transferMeaning: 'measured', transferSize: 0 }),
      ),
    ).toBe(false);
    expect(
      resourcePerf(
        resource({ timingAllow: 'same-origin', transferMeaning: 'zero-cache-or-local' }),
      ),
    ).toBe(true);
    expect(resourcePerf(resource({ transferSize: null, transferMeaning: 'absent' }))).toBe(true);
  });
});

describe('BrowserSession', () => {
  it('세션 값은 저장하지도 전송하지도 않는다', () => {
    const session = {
      kind: 'browser-session',
      startedAt: '2026-09-13T12:00:00.000Z',
      timeOrigin: 1_699_999_999_000,
      persisted: false,
      transmitted: false,
    };
    expect(browserSessionSchema.safeParse(session).success).toBe(true);
    expect(browserSessionSchema.safeParse({ ...session, persisted: true }).success).toBe(false);
  });
});
