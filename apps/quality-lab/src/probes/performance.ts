import {
  type BrowserSupport,
  MAX_KEPT_ENTRIES,
  PERFORMANCE_ENTRY_TYPES,
  PERFORMANCE_SCOPE_OF,
  type PerformanceEntrySample,
  type PerformanceEntryType,
  type RuntimePerformance,
} from '@berrypjh/observability-contracts';

import type { Dispose } from './capability';
import type { BrowserEnv, ObserverConstructor, ObserverLike } from './env';
import { attempt, peek } from './safe';

/**
 * PerformanceObserver entry 관측. 지원 목록을 먼저 확인하고 buffered 로 시작한다.
 * entry 는 개별 관측이다 — CLS 합계·INP 같은 Web Vitals 를 계산하지 않는다.
 */

export type PerformanceSnapshot = RuntimePerformance[];

const awaiting = (entryType: PerformanceEntryType): RuntimePerformance => ({
  entryType,
  scope: PERFORMANCE_SCOPE_OF[entryType],
  support: 'supported',
  state: 'awaiting-sample',
  timeOrigin: null,
  sampleTime: null,
  provisional: true,
  entries: [],
  totalEntries: 0,
  reason: null,
});

const notObserved = (
  entryType: PerformanceEntryType,
  support: Exclude<BrowserSupport, 'supported'>,
  reason: string,
  state: 'not-sampled' | 'error' = 'not-sampled',
): RuntimePerformance => ({ ...awaiting(entryType), support, state, provisional: false, reason });

const everyType = (make: (entryType: PerformanceEntryType) => RuntimePerformance) =>
  PERFORMANCE_ENTRY_TYPES.map(make);

/** 지원 판정. 목록이 없으면 추측하지 않고 관측도 시작하지 않는다. */
export const initialPerformance = (env: BrowserEnv): PerformanceSnapshot => {
  const constructor = attempt(() => env.PerformanceObserver);
  if (!constructor.ok) {
    return everyType((type) =>
      notObserved(type, 'unavailable', `읽는 중 오류 — ${constructor.error}`, 'error'),
    );
  }
  const Observer = constructor.value;
  if (typeof Observer !== 'function') {
    return everyType((type) => notObserved(type, 'unsupported', 'PerformanceObserver 가 없습니다'));
  }
  const listed = attempt(() => Observer.supportedEntryTypes);
  if (!listed.ok) {
    return everyType((type) =>
      notObserved(
        type,
        'unavailable',
        `supportedEntryTypes 를 읽는 중 오류 — ${listed.error}`,
        'error',
      ),
    );
  }
  const supported = listed.value;
  if (!Array.isArray(supported)) {
    return everyType((type) =>
      notObserved(
        type,
        'not-measured',
        'supportedEntryTypes 가 없어 지원을 확인할 수 없습니다 — 관측을 시작하지 않습니다',
      ),
    );
  }
  return everyType((type) =>
    supported.includes(type)
      ? awaiting(type)
      : notObserved(type, 'unsupported', `supportedEntryTypes 에 ${type} 이 없습니다`),
  );
};

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

const text = (value: unknown, max: number): string | null =>
  typeof value === 'string' && value.length > 0 ? value.slice(0, max) : null;

const urlOf = (value: unknown) => {
  const parsed = attempt(() => new URL(String(value)));
  return parsed.ok ? parsed.value : null;
};

type Raw = Record<string, unknown>;

const resource = (
  raw: Raw,
  time: { startTime: number; duration: number },
  origin: string | null,
) => {
  const url = urlOf(raw.name);
  if (!url) return null;
  const opaque = url.protocol === 'data:' || url.protocol === 'blob:';
  const crossOrigin = origin !== null && url.origin !== origin;
  // TAO 가 없으면 requestStart·responseStart 와 크기가 0 으로 가려진다.
  const restricted = crossOrigin && raw.requestStart === 0 && raw.responseStart === 0;
  const transferSize = count(raw.transferSize);
  return {
    entryType: 'resource' as const,
    name: opaque ? `${url.protocol}(내용 생략)` : `${url.origin}${url.pathname}`.slice(0, 300),
    initiatorType: text(raw.initiatorType, 40) ?? 'other',
    ...time,
    timingAllow: crossOrigin
      ? restricted
        ? ('cross-origin-restricted' as const)
        : ('cross-origin-exposed' as const)
      : ('same-origin' as const),
    transferSize,
    transferMeaning:
      transferSize === null
        ? ('absent' as const)
        : transferSize > 0
          ? ('measured' as const)
          : restricted
            ? ('zero-timing-restricted' as const)
            : ('zero-cache-or-local' as const),
    encodedBodySize: count(raw.encodedBodySize),
    decodedBodySize: count(raw.decodedBodySize),
  };
};

const fields = (
  type: PerformanceEntryType,
  raw: Raw,
  origin: string | null,
): PerformanceEntrySample | null => {
  if (raw.entryType !== type) return null;
  const startTime = count(raw.startTime);
  const duration = count(raw.duration);
  if (startTime === null || duration === null) return null;
  const time = { startTime, duration };
  switch (type) {
    case 'navigation': {
      const path = urlOf(raw.name)?.pathname ?? null;
      const navigationType = text(raw.type, 40);
      const responseStart = count(raw.responseStart);
      const domContentLoadedEventEnd = count(raw.domContentLoadedEventEnd);
      const loadEventEnd = count(raw.loadEventEnd);
      if (!path || !navigationType || responseStart === null) return null;
      if (domContentLoadedEventEnd === null || loadEventEnd === null) return null;
      return {
        entryType: 'navigation',
        name: path.slice(0, 300),
        ...time,
        navigationType,
        responseStart,
        domContentLoadedEventEnd,
        loadEventEnd,
        transferSize: count(raw.transferSize),
      };
    }
    case 'resource':
      return resource(raw, time, origin);
    case 'paint':
      return raw.name === 'first-paint' || raw.name === 'first-contentful-paint'
        ? { entryType: 'paint', name: raw.name, ...time }
        : null;
    case 'largest-contentful-paint': {
      const size = count(raw.size);
      const renderTime = count(raw.renderTime);
      const loadTime = count(raw.loadTime);
      if (size === null || renderTime === null || loadTime === null) return null;
      return { entryType: 'largest-contentful-paint', ...time, size, renderTime, loadTime };
    }
    case 'layout-shift': {
      const value = count(raw.value);
      if (value === null || typeof raw.hadRecentInput !== 'boolean') return null;
      return { entryType: 'layout-shift', ...time, value, hadRecentInput: raw.hadRecentInput };
    }
    case 'longtask':
      return { entryType: 'longtask', ...time };
    case 'event':
    case 'first-input': {
      const name = text(raw.name, 40);
      const interactionId = count(raw.interactionId);
      if (!name || interactionId === null || !Number.isInteger(interactionId)) return null;
      return { entryType: type, name, ...time, interactionId };
    }
  }
};

/** entry 하나를 공개해도 되는 field 만으로. 형식이 틀리면 0 으로 채우지 않고 버린다. */
export const normalizeEntry = (
  type: PerformanceEntryType,
  raw: unknown,
  origin: string | null,
): PerformanceEntrySample | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const result = attempt(() => fields(type, raw as Raw, origin));
  return result.ok ? result.value : null;
};

/** navigation 은 같은 문서의 entry 가 갱신되어 다시 온다. 나머지는 내용 전체가 정체다. */
const identity = (sample: PerformanceEntrySample) =>
  sample.entryType === 'navigation'
    ? `navigation|${sample.name}|${sample.startTime}`
    : JSON.stringify(sample);

const provisionalOf = (type: PerformanceEntryType, entries: PerformanceEntrySample[]) => {
  if (type === 'navigation') {
    return entries.some((entry) => entry.entryType === 'navigation' && entry.loadEventEnd === 0);
  }
  return type !== 'paint' && type !== 'first-input';
};

/**
 * 지원된 type 마다 observer 하나로 buffered 관측을 시작한다. 구독마다 상태가 새로 시작되므로
 * StrictMode 의 재구독에서 buffered entry 를 두 번 세지 않고, dispose 뒤의 callback 은 무시한다.
 */
export const observePerformance = (
  env: BrowserEnv,
  onUpdate: (snapshot: PerformanceSnapshot) => void,
): Dispose => {
  let snapshot = initialPerformance(env);
  let disposed = false;
  const observers: ObserverLike[] = [];
  const seen = new Map<PerformanceEntryType, Set<string>>();
  const origin = text(
    peek(() => env.window?.location?.origin),
    300,
  );
  const timeOrigin = count(peek(() => env.performance?.timeOrigin));

  const replace = (next: RuntimePerformance) => {
    snapshot = snapshot.map((item) => (item.entryType === next.entryType ? next : item));
    onUpdate(snapshot);
  };

  const receive = (type: PerformanceEntryType, raw: unknown[]) => {
    if (disposed) return;
    const current = snapshot.find((item) => item.entryType === type);
    if (!current || current.support !== 'supported') return;
    const keys = seen.get(type) ?? new Set<string>();
    seen.set(type, keys);
    let entries = [...current.entries];
    let total = current.totalEntries;
    let changed = false;
    for (const item of raw) {
      const sample = normalizeEntry(type, item, origin);
      if (!sample) continue;
      const key = identity(sample);
      if (keys.has(key)) {
        if (sample.entryType !== 'navigation') continue;
        entries = entries.map((entry) => (identity(entry) === key ? sample : entry));
      } else {
        keys.add(key);
        entries.push(sample);
        total += 1;
      }
      changed = true;
    }
    if (!changed) return;
    if (timeOrigin === null) {
      replace({
        ...current,
        support: 'unavailable',
        state: 'error',
        provisional: false,
        entries: [],
        totalEntries: 0,
        reason: 'performance.timeOrigin 을 읽을 수 없어 entry 시간을 해석할 수 없습니다',
      });
      return;
    }
    const kept = entries.slice(-MAX_KEPT_ENTRIES);
    replace({
      ...current,
      state: 'sampled',
      entries: kept,
      totalEntries: total,
      timeOrigin,
      sampleTime: env.now(),
      provisional: provisionalOf(type, kept),
    });
  };

  const Observer = peek(() => env.PerformanceObserver) as ObserverConstructor | undefined;
  for (const item of snapshot) {
    if (item.support !== 'supported' || typeof Observer !== 'function') continue;
    const type = item.entryType;
    const created = attempt(
      () =>
        new Observer((list) => {
          const entries = attempt(() => list.getEntries());
          receive(type, entries.ok && Array.isArray(entries.value) ? entries.value : []);
        }),
    );
    if (!created.ok) {
      snapshot = snapshot.map((entry) =>
        entry.entryType === type
          ? notObserved(type, 'unavailable', `observer 생성 오류 — ${created.error}`, 'error')
          : entry,
      );
      continue;
    }
    observers.push(created.value);
    const started = attempt(() =>
      created.value.observe({
        type,
        buffered: true,
        ...(type === 'event' ? { durationThreshold: 16 } : {}),
      }),
    );
    if (!started.ok) {
      attempt(() => created.value.disconnect());
      snapshot = snapshot.map((entry) =>
        entry.entryType === type
          ? notObserved(type, 'unavailable', `observe 오류 — ${started.error}`, 'error')
          : entry,
      );
    }
  }
  onUpdate(snapshot);

  return () => {
    disposed = true;
    for (const observer of observers) attempt(() => observer.disconnect());
  };
};
