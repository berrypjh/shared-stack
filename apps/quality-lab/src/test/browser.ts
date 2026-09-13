/** test 전용 가짜 브라우저 API. 실제 수치를 흉내 내지 않고 분기만 결정적으로 만든다. */
import type { BrowserEnv } from '../probes/env';

type Listener = (event?: unknown) => void;

/** addEventListener·removeEventListener 만 가진 대상. 남은 listener 수를 센다. */
export const fakeTarget = () => {
  const listeners = new Map<string, Set<Listener>>();
  return {
    addEventListener: (type: string, listener: Listener) => {
      listeners.set(type, (listeners.get(type) ?? new Set()).add(listener));
    },
    removeEventListener: (type: string, listener: Listener) => {
      listeners.get(type)?.delete(listener);
    },
    dispatch: (type: string) => listeners.get(type)?.forEach((listener) => listener()),
    count: () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0),
  };
};

type FakeList = {
  media: string;
  matches: boolean;
  listeners: Set<Listener>;
  addEventListener?: (type: string, listener: Listener) => void;
  removeEventListener?: (type: string, listener: Listener) => void;
  addListener?: (listener: Listener) => void;
  removeListener?: (listener: Listener) => void;
};

/**
 * query → matches. 값이 없으면 false, `'not all'` 은 브라우저가 해석하지 못한 query 다.
 * `legacy` 는 addListener 만 있는 오래된 MediaQueryList 다.
 */
export const fakeMatchMedia = (
  initial: Record<string, boolean | 'not all'> = {},
  { legacy = false }: { legacy?: boolean } = {},
) => {
  const matches = { ...initial };
  const lists: FakeList[] = [];
  const matchMedia = (query: string) => {
    const value = matches[query];
    const list: FakeList = {
      media: value === 'not all' ? 'not all' : query,
      matches: value === true,
      listeners: new Set(),
    };
    if (legacy) {
      list.addListener = (listener) => list.listeners.add(listener);
      list.removeListener = (listener) => list.listeners.delete(listener);
    } else {
      list.addEventListener = (_type, listener) => list.listeners.add(listener);
      list.removeEventListener = (_type, listener) => list.listeners.delete(listener);
    }
    lists.push(list);
    return list;
  };
  return {
    matchMedia,
    set: (query: string, value: boolean) => {
      matches[query] = value;
      for (const list of lists.filter((item) => item.media === query)) {
        list.matches = value;
        list.listeners.forEach((listener) => listener({ matches: value }));
      }
    },
    listenerCount: () => lists.reduce((sum, list) => sum + list.listeners.size, 0),
  };
};

type ObserveOptions = { type: string; buffered?: boolean; durationThreshold?: number };
type Callback = (list: { getEntries: () => unknown[] }) => void;

/**
 * PerformanceObserver 대역. `supported` 가 `'absent'` 면 supportedEntryTypes 가 없고
 * `'throws'` 면 getter 가 던진다. buffered entry 는 `flush` 할 때만 전달한다.
 */
export const fakeObserver = ({
  supported,
  buffered = {},
  throwsOn = [],
}: {
  supported: readonly string[] | 'absent' | 'throws';
  buffered?: Record<string, unknown[]>;
  throwsOn?: string[];
}) => {
  const instances: {
    callback: Callback;
    options: ObserveOptions[];
    disconnected: boolean;
  }[] = [];

  class Observer {
    private readonly record: (typeof instances)[number];
    constructor(callback: Callback) {
      this.record = { callback, options: [], disconnected: false };
      instances.push(this.record);
    }
    observe(options: ObserveOptions) {
      if (throwsOn.includes(options.type)) throw new TypeError(`${options.type} 관측 실패`);
      this.record.options.push(options);
    }
    disconnect() {
      this.record.disconnected = true;
    }
  }

  if (supported === 'throws') {
    Object.defineProperty(Observer, 'supportedEntryTypes', {
      get: () => {
        throw new Error('supportedEntryTypes getter 실패');
      },
    });
  } else if (supported !== 'absent') {
    Object.defineProperty(Observer, 'supportedEntryTypes', { value: supported });
  }

  const deliver = (type: string, entries: unknown[]) => {
    for (const instance of instances) {
      if (instance.disconnected) continue;
      if (instance.options.some((options) => options.type === type)) {
        instance.callback({ getEntries: () => entries });
      }
    }
  };

  return {
    Observer: Observer as unknown as NonNullable<BrowserEnv['PerformanceObserver']>,
    instances,
    emit: deliver,
    flush: () => {
      for (const [type, entries] of Object.entries(buffered)) deliver(type, entries);
    },
  };
};

export const NOW = 1_700_000_000_000;
export const TIME_ORIGIN = 1_699_999_999_000;
export const ORIGIN = 'http://localhost:4300';

/** 기능이 다 있는 가짜 환경. test 마다 필요한 부분만 덮어쓴다. */
export const fakeEnv = (overrides: Partial<BrowserEnv> = {}): BrowserEnv => ({
  now: () => NOW,
  window: Object.assign(fakeTarget(), {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 2,
    crossOriginIsolated: false,
    isSecureContext: true,
    location: { origin: ORIGIN },
  }),
  screen: {
    width: 1512,
    height: 982,
    orientation: Object.assign(fakeTarget(), { type: 'landscape-primary' }),
  },
  navigator: {
    language: 'ko-KR',
    languages: ['ko-KR', 'en-US'],
    onLine: true,
    cookieEnabled: true,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    connection: Object.assign(fakeTarget(), {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    }),
    storage: { estimate: async () => ({ usage: 0, quota: 1_000_000 }) },
    serviceWorker: {},
  },
  timeZone: () => 'Asia/Seoul',
  matchMedia: fakeMatchMedia().matchMedia,
  performance: { timeOrigin: TIME_ORIGIN },
  PerformanceObserver: undefined,
  globals: {
    Worker: () => undefined,
    WebAssembly: { validate: () => true },
    IntersectionObserver: () => undefined,
    ResizeObserver: () => undefined,
    MutationObserver: () => undefined,
    PerformanceObserver: () => undefined,
  },
  css: { supports: () => true },
  createCanvas: undefined,
  ...overrides,
});
