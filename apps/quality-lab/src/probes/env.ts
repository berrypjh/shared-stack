/**
 * probe 가 읽는 브라우저 표면. 실제 전역은 getter 로 늦게 읽어서 접근 자체가 던져도 probe 의
 * `attempt` 안에서 잡힌다. test 는 같은 모양의 가짜를 넣는다 — polyfill 을 두지 않는다.
 */

export type Listener = (event?: unknown) => void;

export type EventTargetLike = {
  addEventListener: (type: string, listener: Listener) => void;
  removeEventListener: (type: string, listener: Listener) => void;
};

export type MediaQueryListLike = {
  media?: string;
  matches: boolean;
  addEventListener?: (type: string, listener: Listener) => void;
  removeEventListener?: (type: string, listener: Listener) => void;
  addListener?: (listener: Listener) => void;
  removeListener?: (listener: Listener) => void;
};

export type ObserveOptions = { type: string; buffered?: boolean; durationThreshold?: number };

export type ObserverLike = { observe: (options: ObserveOptions) => void; disconnect: () => void };

export type ObserverConstructor = {
  new (callback: (list: { getEntries: () => unknown[] }) => void): ObserverLike;
  readonly supportedEntryTypes?: readonly string[];
};

export type BrowserEnv = {
  /** 측정 시각. epoch ms. */
  now: () => number;
  window?: Partial<EventTargetLike> & {
    innerWidth?: number;
    innerHeight?: number;
    devicePixelRatio?: number;
    crossOriginIsolated?: boolean;
    isSecureContext?: boolean;
    location?: { origin?: string };
  };
  screen?: {
    width?: number;
    height?: number;
    orientation?: Partial<EventTargetLike> & { type?: string };
  };
  navigator?: {
    language?: string;
    languages?: readonly string[];
    onLine?: boolean;
    cookieEnabled?: boolean;
    hardwareConcurrency?: number;
    deviceMemory?: number;
    connection?: Partial<EventTargetLike> & {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
    storage?: { estimate?: () => Promise<{ quota?: number; usage?: number }> };
    serviceWorker?: unknown;
  };
  timeZone?: () => string | undefined;
  matchMedia?: (query: string) => MediaQueryListLike;
  performance?: {
    timeOrigin?: number;
    memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number };
  };
  PerformanceObserver?: ObserverConstructor;
  /** capability allowlist 가 `typeof` 로만 확인하는 전역. */
  globals?: Record<string, unknown>;
  css?: { supports?: (condition: string) => boolean };
  createCanvas?: () => { getContext: (id: string) => unknown };
};

type Scope = Record<string, unknown> & {
  matchMedia?: (query: string) => MediaQueryListLike;
  document?: { createElement: (tag: string) => unknown };
};

/** 실제 브라우저 전역. 속성은 읽는 순간에 가져온다. */
export const realBrowserEnv = (): BrowserEnv => {
  const scope = globalThis as unknown as Scope;
  return {
    now: () => Date.now(),
    get window() {
      return scope.window as BrowserEnv['window'];
    },
    get screen() {
      return scope.screen as BrowserEnv['screen'];
    },
    get navigator() {
      return scope.navigator as BrowserEnv['navigator'];
    },
    timeZone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    get matchMedia() {
      return typeof scope.matchMedia === 'function'
        ? (query: string) =>
            (scope.matchMedia as (query: string) => MediaQueryListLike).call(scope, query)
        : undefined;
    },
    get performance() {
      return scope.performance as BrowserEnv['performance'];
    },
    get PerformanceObserver() {
      return scope.PerformanceObserver as BrowserEnv['PerformanceObserver'];
    },
    globals: scope,
    get css() {
      return scope.CSS as BrowserEnv['css'];
    },
    get createCanvas() {
      const document = scope.document;
      return document
        ? () =>
            document.createElement('canvas') as ReturnType<NonNullable<BrowserEnv['createCanvas']>>
        : undefined;
    },
  };
};
