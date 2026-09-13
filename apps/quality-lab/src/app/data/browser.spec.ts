import {
  browserCapabilitySchema,
  runtimePerformanceSchema,
} from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import {
  capabilityValueText,
  entrySummary,
  filterBySupport,
  resourceTransferText,
} from './browser';

const capability = (overrides: Record<string, unknown> = {}) =>
  browserCapabilitySchema.parse({
    id: 'device.cookie-enabled',
    group: 'device',
    label: '쿠키 허용 hint',
    support: 'supported',
    state: 'sampled',
    value: true,
    unit: null,
    approximate: false,
    limitation: null,
    reason: null,
    detail: null,
    sampleTime: 1_700_000_000_000,
    ...overrides,
  });

const empty = { value: null, sampleTime: null };

describe('capabilityValueText', () => {
  it('실제 false·0 은 측정값 글이고 단위·근사 표시를 붙인다', () => {
    expect(capabilityValueText(capability({ value: false }))).toBe('false (측정값)');
    expect(capabilityValueText(capability({ value: 0, unit: 'bytes', approximate: true }))).toBe(
      '0 B (근사)',
    );
    expect(capabilityValueText(capability({ value: 1280, unit: 'css-px' }))).toBe('1,280 CSS px');
    expect(capabilityValueText(capability({ value: 8, unit: 'count', approximate: true }))).toBe(
      '8개 (근사)',
    );
    expect(capabilityValueText(capability({ value: ['coarse', 'fine'] }))).toBe('coarse, fine');
  });

  it('지원 안 함·오류·대기·읽지 않음은 값 글을 만들지 않는다', () => {
    expect(
      capabilityValueText(
        capability({ ...empty, support: 'unsupported', state: 'not-sampled', reason: '없다' }),
      ),
    ).toBe('값 없음 — 지원 안 함');
    expect(
      capabilityValueText(
        capability({ value: null, support: 'unavailable', state: 'error', reason: 'boom' }),
      ),
    ).toBe('값 없음 — 오류');
    expect(capabilityValueText(capability({ ...empty, state: 'not-sampled' }))).toBe(
      '아직 읽지 않음',
    );
    expect(capabilityValueText(capability({ ...empty, state: 'awaiting-sample' }))).toBe(
      '표본 대기 — 아직 값이 없음 (0 아님)',
    );
  });

  it('필터는 지원 상태만 보고, 없으면 전체다', () => {
    const items = [
      capability(),
      capability({ ...empty, support: 'unsupported', state: 'not-sampled', reason: '없다' }),
    ];
    expect(filterBySupport(items, 'unsupported')).toHaveLength(1);
    expect(filterBySupport(items, undefined)).toHaveLength(2);
  });
});

const perf = (overrides: Record<string, unknown>) =>
  runtimePerformanceSchema.parse({
    entryType: 'layout-shift',
    scope: 'document-lifetime',
    support: 'supported',
    state: 'awaiting-sample',
    timeOrigin: null,
    sampleTime: null,
    provisional: true,
    entries: [],
    totalEntries: 0,
    reason: null,
    ...overrides,
  });

const sampledPerf = (entryType: string, scope: string, entry: Record<string, unknown>) =>
  perf({
    entryType,
    scope,
    state: 'sampled',
    timeOrigin: 1,
    sampleTime: 2,
    entries: [entry],
    totalEntries: 1,
  });

describe('entrySummary', () => {
  it('entry 가 없으면 표본 대기, 지원이 없으면 이유다 — 숫자를 만들지 않는다', () => {
    expect(entrySummary(perf({}))).toBe('표본 대기 — entry 가 아직 없음 (0 아님)');
    expect(
      entrySummary(
        perf({
          support: 'unsupported',
          state: 'not-sampled',
          provisional: false,
          reason: 'supportedEntryTypes 에 longtask 이 없습니다',
        }),
      ),
    ).toBe('지원 안 함 — supportedEntryTypes 에 longtask 이 없습니다');
  });

  it('실제 0 을 포함한 마지막 entry 를 ms 와 함께 쓴다', () => {
    expect(
      entrySummary(
        sampledPerf('layout-shift', 'document-lifetime', {
          entryType: 'layout-shift',
          startTime: 10,
          duration: 0,
          value: 0,
          hadRecentInput: false,
        }),
      ),
    ).toBe('value 0 · startTime 10.0 ms');
    expect(
      entrySummary(
        sampledPerf('paint', 'document-lifetime', {
          entryType: 'paint',
          name: 'first-contentful-paint',
          startTime: 120,
          duration: 0,
        }),
      ),
    ).toBe('first-contentful-paint · startTime 120.0 ms');
  });
});

describe('resourceTransferText — 0 의 뜻을 보존한다', () => {
  const resource = (overrides: Record<string, unknown>) => ({
    entryType: 'resource' as const,
    name: 'https://cdn.example.com/a.js',
    initiatorType: 'script',
    startTime: 1,
    duration: 2,
    timingAllow: 'same-origin' as const,
    transferSize: 0,
    transferMeaning: 'zero-cache-or-local' as const,
    encodedBodySize: 0,
    decodedBodySize: 0,
    ...overrides,
  });

  it('TAO 제한·캐시·측정·미제공을 다른 글로 쓴다', () => {
    expect(
      resourceTransferText(
        resource({
          timingAllow: 'cross-origin-restricted',
          transferMeaning: 'zero-timing-restricted',
        }),
      ),
    ).toBe('0 — TAO 로 가려짐 (크기 아님)');
    expect(resourceTransferText(resource({}))).toBe('0 B — 캐시·로컬 응답일 수 있음');
    expect(resourceTransferText(resource({ transferSize: 512, transferMeaning: 'measured' }))).toBe(
      '512 B (0.51 KB)',
    );
    expect(resourceTransferText(resource({ transferSize: null, transferMeaning: 'absent' }))).toBe(
      '제공 안 함',
    );
  });
});
