import { runtimePerformanceSchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { fakeEnv, fakeObserver, NOW, ORIGIN, TIME_ORIGIN } from '../test/browser';

import { initialPerformance, normalizeEntry, observePerformance } from './performance';

type Snapshot = ReturnType<typeof initialPerformance>;

const byType = (snapshot: Snapshot, type: string) => {
  const found = snapshot.find((item) => item.entryType === type);
  if (!found) throw new Error(`no ${type}`);
  return found;
};

const ALL = [
  'navigation',
  'resource',
  'paint',
  'largest-contentful-paint',
  'layout-shift',
  'longtask',
  'event',
  'first-input',
];

const watch = (fake: ReturnType<typeof fakeObserver>) => {
  const snapshots: Snapshot[] = [];
  const env = fakeEnv({ PerformanceObserver: fake.Observer });
  const dispose = observePerformance(env, (next) => snapshots.push(next));
  return { snapshots, dispose, last: () => snapshots[snapshots.length - 1] };
};

const shift = (value: number, startTime = 10) => ({
  entryType: 'layout-shift',
  name: '',
  startTime,
  duration: 0,
  value,
  hadRecentInput: false,
});

describe('initialPerformance — 지원 확인이 먼저다', () => {
  it('PerformanceObserver 가 없으면 모두 지원 안 함이다', () => {
    const snapshot = initialPerformance(fakeEnv());
    expect(snapshot.map((item) => item.support)).toEqual(ALL.map(() => 'unsupported'));
    for (const item of snapshot) runtimePerformanceSchema.parse(item);
  });

  it('supportedEntryTypes 가 없으면 지원을 모르므로 측정 안 함이고 관측하지 않는다', () => {
    const fake = fakeObserver({ supported: 'absent' });
    const { last } = watch(fake);
    expect(last().every((item) => item.support === 'not-measured')).toBe(true);
    expect(fake.instances).toHaveLength(0);
  });

  it('supportedEntryTypes getter 가 던지면 사용 불가 오류다', () => {
    const snapshot = initialPerformance(
      fakeEnv({ PerformanceObserver: fakeObserver({ supported: 'throws' }).Observer }),
    );
    expect(byType(snapshot, 'paint')).toMatchObject({ support: 'unavailable', state: 'error' });
  });

  it('목록에 없는 type 은 지원 안 함, 있는 type 은 buffered 관측을 시작해 표본을 기다린다', () => {
    const fake = fakeObserver({ supported: ['paint', 'layout-shift', 'event'] });
    const { last } = watch(fake);
    expect(byType(last(), 'longtask')).toMatchObject({
      support: 'unsupported',
      state: 'not-sampled',
    });
    expect(byType(last(), 'paint')).toMatchObject({
      support: 'supported',
      state: 'awaiting-sample',
      totalEntries: 0,
      entries: [],
    });
    const options = fake.instances.flatMap((instance) => instance.options);
    expect(options.map((item) => item.type).sort()).toEqual(['event', 'layout-shift', 'paint']);
    expect(options.every((item) => item.buffered === true)).toBe(true);
    for (const item of last()) runtimePerformanceSchema.parse(item);
  });
});

describe('observePerformance', () => {
  it('빈 표본은 표본 대기로 남고 실제 0 값 entry 는 측정됨이다', () => {
    const fake = fakeObserver({ supported: ['layout-shift'] });
    const { last } = watch(fake);
    fake.emit('layout-shift', []);
    expect(byType(last(), 'layout-shift').state).toBe('awaiting-sample');
    fake.emit('layout-shift', [shift(0)]);
    const sampled = byType(last(), 'layout-shift');
    expect(sampled).toMatchObject({
      state: 'sampled',
      totalEntries: 1,
      timeOrigin: TIME_ORIGIN,
      sampleTime: NOW,
      provisional: true,
      scope: 'document-lifetime',
    });
    expect(sampled.entries[0]).toMatchObject({ value: 0 });
    runtimePerformanceSchema.parse(sampled);
  });

  it('observe 가 던진 type 만 오류다', () => {
    const fake = fakeObserver({ supported: ['paint', 'longtask'], throwsOn: ['longtask'] });
    const { last } = watch(fake);
    expect(byType(last(), 'longtask')).toMatchObject({ support: 'unavailable', state: 'error' });
    expect(byType(last(), 'paint').state).toBe('awaiting-sample');
  });

  it('navigation 은 load 끝 전까지 provisional 이다', () => {
    const fake = fakeObserver({ supported: ['navigation'] });
    const { last } = watch(fake);
    const nav = {
      entryType: 'navigation',
      name: `${ORIGIN}/browser?panel=x`,
      startTime: 0,
      duration: 0,
      type: 'navigate',
      responseStart: 40,
      domContentLoadedEventEnd: 0,
      loadEventEnd: 0,
      transferSize: 300,
    };
    fake.emit('navigation', [nav]);
    expect(byType(last(), 'navigation')).toMatchObject({
      provisional: true,
      scope: 'hard-navigation',
    });
    fake.emit('navigation', [
      { ...nav, duration: 500, loadEventEnd: 500, domContentLoadedEventEnd: 300 },
    ]);
    const done = byType(last(), 'navigation');
    expect(done.provisional).toBe(false);
    expect(done.entries).toHaveLength(1);
    expect(done.entries[0]).toMatchObject({ name: '/browser', loadEventEnd: 500 });
  });

  it('dispose 는 모든 observer 를 끊고 늦게 온 callback 을 무시한다', () => {
    const fake = fakeObserver({ supported: ['paint', 'layout-shift'] });
    const { dispose, snapshots } = watch(fake);
    dispose();
    expect(fake.instances.every((instance) => instance.disconnected)).toBe(true);
    const before = snapshots.length;
    fake.instances[0].callback({ getEntries: () => [shift(0.1)] });
    expect(snapshots).toHaveLength(before);
  });

  it('StrictMode 재구독에서 buffered entry 를 두 번 세지 않는다', () => {
    const fake = fakeObserver({
      supported: ['layout-shift'],
      buffered: { 'layout-shift': [shift(0.1, 5), shift(0.2, 9)] },
    });
    const first = watch(fake);
    first.dispose();
    const second = watch(fake);
    fake.flush();
    fake.emit('layout-shift', [shift(0.2, 9)]);
    expect(byType(second.last(), 'layout-shift').totalEntries).toBe(2);
    expect(fake.instances.filter((instance) => !instance.disconnected)).toHaveLength(1);
  });
});

describe('normalizeEntry — resource 의 0 은 여러 뜻이다', () => {
  const base = {
    entryType: 'resource',
    initiatorType: 'script',
    startTime: 10,
    duration: 20,
    requestStart: 12,
    responseStart: 15,
    transferSize: 0,
    encodedBodySize: 0,
    decodedBodySize: 0,
  };

  it('cross-origin 에서 TAO 가 없으면 크기·세부 시간이 가려진 0 이다', () => {
    expect(
      normalizeEntry(
        'resource',
        {
          ...base,
          name: 'https://cdn.example.com/lib.js?token=secret#x',
          requestStart: 0,
          responseStart: 0,
        },
        ORIGIN,
      ),
    ).toEqual({
      entryType: 'resource',
      name: 'https://cdn.example.com/lib.js',
      initiatorType: 'script',
      startTime: 10,
      duration: 20,
      timingAllow: 'cross-origin-restricted',
      transferSize: 0,
      transferMeaning: 'zero-timing-restricted',
      encodedBodySize: 0,
      decodedBodySize: 0,
    });
  });

  it('같은 origin 의 transferSize 0 은 캐시·로컬 응답이고, 값이 있으면 측정 bytes 다', () => {
    expect(
      normalizeEntry('resource', { ...base, name: `${ORIGIN}/assets/a.js` }, ORIGIN),
    ).toMatchObject({ timingAllow: 'same-origin', transferMeaning: 'zero-cache-or-local' });
    expect(
      normalizeEntry(
        'resource',
        { ...base, name: 'https://cdn.example.com/b.js', transferSize: 512 },
        ORIGIN,
      ),
    ).toMatchObject({ timingAllow: 'cross-origin-exposed', transferMeaning: 'measured' });
    expect(
      normalizeEntry(
        'resource',
        { ...base, name: `${ORIGIN}/c.js`, transferSize: undefined },
        ORIGIN,
      ),
    ).toMatchObject({ transferSize: null, transferMeaning: 'absent' });
  });

  it('숫자가 아닌 필드를 0 으로 채우지 않고 entry 를 버린다', () => {
    expect(
      normalizeEntry('longtask', { entryType: 'longtask', startTime: 'x', duration: 60 }, ORIGIN),
    ).toBeNull();
    expect(
      normalizeEntry(
        'paint',
        { entryType: 'paint', name: 'other', startTime: 1, duration: 0 },
        ORIGIN,
      ),
    ).toBeNull();
  });
});
