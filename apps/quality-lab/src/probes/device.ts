import {
  type Capability,
  type CapabilityBase,
  combine,
  failed,
  isBoolean,
  isCount,
  isText,
  listen,
  missing,
  NOOP_DISPOSE,
  readCapability,
  readPresence,
  sampled,
  type SyncProbe,
} from './capability';
import type { BrowserEnv } from './env';
import { attempt, peek } from './safe';

const base = (
  id: string,
  label: string,
  group: CapabilityBase['group'],
  { unit = null, approximate = false, limitation = null }: Partial<CapabilityBase> = {},
): CapabilityBase => ({ id, group, label, unit, approximate, limitation });

const numberOrNull = (value: unknown) => (isCount(value) ? value : null);

const connection = (env: BrowserEnv): Capability => {
  const item = base('network.connection', '연결 추정 (Network Information)', 'connectivity', {
    approximate: true,
    limitation:
      'effectiveType·downlink·rtt 는 최근 관측을 반올림한 추정값입니다 (Chromium 계열만 제공)',
  });
  const read = attempt(() => {
    const source = env.navigator?.connection;
    return source
      ? {
          effectiveType: source.effectiveType,
          downlink: source.downlink,
          rtt: source.rtt,
          saveData: source.saveData,
        }
      : undefined;
  });
  if (!read.ok) return failed(item, `읽는 중 오류 — ${read.error}`, env.now());
  if (!read.value) return missing(item, 'unsupported', 'Network Information API 가 없습니다');
  const { effectiveType, downlink, rtt, saveData } = read.value;
  if (!isText(effectiveType)) return failed(item, 'effectiveType 이 없습니다', env.now());
  return sampled(item, effectiveType, env.now(), [
    { name: 'downlink (Mbps)', value: numberOrNull(downlink) },
    { name: 'rtt (ms)', value: numberOrNull(rtt) },
    { name: 'saveData', value: isBoolean(saveData) ? saveData : null },
  ]);
};

/** online hint 와 Network Information. */
export const connectivityProbe: SyncProbe = {
  id: 'connectivity',
  detect: (env) => (peek(() => env.navigator) ? 'supported' : 'unsupported'),
  sample: (env) => [
    readCapability(
      base('network.online', '온라인 hint (navigator.onLine)', 'connectivity', {
        limitation: 'connectivity hint — true 여도 인터넷 연결을 보장하지 않습니다',
      }),
      () => env.navigator?.onLine,
      env,
      isBoolean,
    ),
    connection(env),
  ],
  subscribe: (env, onChange) =>
    combine([
      listen(() => env.window, 'online', onChange),
      listen(() => env.window, 'offline', onChange),
      listen(() => env.navigator?.connection, 'change', onChange),
    ]),
};

const jsHeap = (env: BrowserEnv): Capability => {
  const item = base('device.js-heap', 'JS heap 사용 (performance.memory)', 'device', {
    unit: 'bytes',
    approximate: true,
    limitation:
      'Chromium 의 비표준 legacy 진단값 — 양자화된 근사값이고 measureUserAgentSpecificMemory 는 호출하지 않습니다',
  });
  const read = attempt(() => {
    const memory = env.performance?.memory;
    return memory
      ? {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        }
      : undefined;
  });
  if (!read.ok) return failed(item, `읽는 중 오류 — ${read.error}`, env.now());
  if (!read.value)
    return missing(item, 'unsupported', 'performance.memory 가 없습니다 (Chromium 전용 legacy)');
  if (!isCount(read.value.used))
    return failed(item, 'usedJSHeapSize 가 숫자가 아닙니다', env.now());
  return sampled(item, read.value.used, env.now(), [
    { name: 'totalJSHeapSize (bytes)', value: numberOrNull(read.value.total) },
    { name: 'jsHeapSizeLimit (bytes)', value: numberOrNull(read.value.limit) },
  ]);
};

/** 제한·근사값인 기기 hint. */
export const deviceProbe: SyncProbe = {
  id: 'device',
  detect: (env) => (peek(() => env.navigator) ? 'supported' : 'unsupported'),
  sample: (env) => [
    readCapability(
      base('device.memory', '기기 메모리 (deviceMemory)', 'device', {
        unit: 'GiB',
        approximate: true,
        limitation: '2의 거듭제곱으로 반올림하고 상·하한으로 자른 근사값입니다',
      }),
      () => env.navigator?.deviceMemory,
      env,
      isCount,
    ),
    readCapability(
      base('device.cores', '논리 프로세서 (hardwareConcurrency)', 'device', {
        unit: 'count',
        approximate: true,
        limitation: '브라우저가 실제보다 줄여 보고할 수 있습니다',
      }),
      () => env.navigator?.hardwareConcurrency,
      env,
      isCount,
    ),
    readCapability(
      base('device.cookie-enabled', '쿠키 허용 hint (cookieEnabled)', 'device', {
        limitation: '일반 hint — 쿠키 내용은 읽지 않습니다',
      }),
      () => env.navigator?.cookieEnabled,
      env,
      isBoolean,
    ),
    jsHeap(env),
  ],
  subscribe: () => NOOP_DISPOSE,
};

const ISOLATION_LIMIT = 'COOP·COEP header 는 이 앱이 바꾸지 않습니다 — 상태만 표시합니다';

/** secure context·cross-origin isolation·SharedArrayBuffer 표시만. */
export const isolationProbe: SyncProbe = {
  id: 'isolation',
  detect: (env) => (peek(() => env.window) ? 'supported' : 'unsupported'),
  sample: (env) => [
    readCapability(
      base('isolation.secure-context', 'secure context', 'isolation'),
      () => env.window?.isSecureContext,
      env,
      isBoolean,
    ),
    readCapability(
      base('isolation.cross-origin-isolated', 'cross-origin isolated', 'isolation', {
        limitation: ISOLATION_LIMIT,
      }),
      () => env.window?.crossOriginIsolated,
      env,
      isBoolean,
    ),
    readPresence(
      base('isolation.shared-array-buffer', 'SharedArrayBuffer 전역', 'isolation', {
        limitation: ISOLATION_LIMIT,
      }),
      () => typeof env.globals?.SharedArrayBuffer === 'function',
      env,
      'SharedArrayBuffer 전역이 없습니다 — cross-origin isolated 가 아닌 문서에서는 숨겨집니다',
    ),
  ],
  subscribe: () => NOOP_DISPOSE,
};

const isFunction = (env: BrowserEnv, name: string) => typeof env.globals?.[name] === 'function';

const API_ALLOWLIST: {
  id: string;
  label: string;
  present: (env: BrowserEnv) => boolean;
  limitation?: string;
}[] = [
  {
    id: 'api.service-worker',
    label: 'Service Worker',
    present: (env) => Boolean(env.navigator && 'serviceWorker' in env.navigator),
    limitation: '존재만 확인합니다 — 등록하지 않습니다',
  },
  { id: 'api.worker', label: 'Worker', present: (env) => isFunction(env, 'Worker') },
  {
    id: 'api.shared-worker',
    label: 'SharedWorker',
    present: (env) => isFunction(env, 'SharedWorker'),
  },
  {
    id: 'api.webassembly',
    label: 'WebAssembly',
    present: (env) =>
      typeof (env.globals?.WebAssembly as { validate?: unknown } | undefined)?.validate ===
      'function',
  },
  {
    id: 'api.intersection-observer',
    label: 'IntersectionObserver',
    present: (env) => isFunction(env, 'IntersectionObserver'),
  },
  {
    id: 'api.resize-observer',
    label: 'ResizeObserver',
    present: (env) => isFunction(env, 'ResizeObserver'),
  },
  {
    id: 'api.mutation-observer',
    label: 'MutationObserver',
    present: (env) => isFunction(env, 'MutationObserver'),
  },
  {
    id: 'api.performance-observer',
    label: 'PerformanceObserver',
    present: (env) => isFunction(env, 'PerformanceObserver'),
  },
];

const CSS_ALLOWLIST = [
  { id: 'css.grid', condition: 'display: grid' },
  { id: 'css.container-queries', condition: 'container-type: inline-size' },
  { id: 'css.has', condition: 'selector(:has(*))' },
  { id: 'css.oklch', condition: 'color: oklch(0.5 0.1 200)' },
];

const cssCapability = (env: BrowserEnv, id: string, condition: string): Capability => {
  const item = base(id, `CSS.supports("${condition}")`, 'api');
  const supports = attempt(() => env.css?.supports);
  if (!supports.ok) return failed(item, `읽는 중 오류 — ${supports.error}`, env.now());
  if (typeof supports.value !== 'function') {
    return missing(item, 'not-measured', 'CSS.supports 가 없어 확인할 수 없습니다');
  }
  const result = attempt(() => env.css?.supports?.(condition));
  if (!result.ok) return failed(item, `CSS.supports 오류 — ${result.error}`, env.now());
  return result.value === true
    ? sampled(item, true, env.now())
    : missing(item, 'unsupported', 'CSS.supports 가 false 를 돌려줬습니다');
};

/** 정해진 API·CSS 조건만 확인한다. 목록 밖은 보지 않는다. */
export const apiProbe: SyncProbe = {
  id: 'api',
  detect: () => 'supported',
  sample: (env) => [
    ...API_ALLOWLIST.map((api) =>
      readPresence(
        base(api.id, api.label, 'api', { limitation: api.limitation ?? null }),
        () => api.present(env),
        env,
        `${api.label} 가 없습니다`,
      ),
    ),
    ...CSS_ALLOWLIST.map(({ id, condition }) => cssCapability(env, id, condition)),
  ],
  subscribe: () => NOOP_DISPOSE,
};

export const WEBGL_BASE = base('api.webgl', 'WebGL context 가용성', 'api', {
  limitation: 'context 를 만들 수 있는지만 봅니다 — renderer·vendor 정보는 읽지 않습니다',
});

/** 누르기 전 상태. context 를 만들지 않았다. */
export const initialWebgl = (): Capability =>
  missing(WEBGL_BASE, 'not-measured', '선택 확인입니다 — 버튼을 눌러야 context 를 만들어 봅니다');

const release = (context: unknown) =>
  attempt(() => {
    const extension = (
      context as { getExtension?: (name: string) => { loseContext?: () => void } | null }
    ).getExtension?.('WEBGL_lose_context');
    extension?.loseContext?.();
  });

/** 사용자가 요청할 때만 쓴다. 만든 context 는 바로 놓는다. */
export const webglProbe = {
  id: 'webgl',
  sample: (env: BrowserEnv): Capability[] => {
    const create = attempt(() => env.createCanvas);
    if (!create.ok) return [failed(WEBGL_BASE, `읽는 중 오류 — ${create.error}`, env.now())];
    const createCanvas = create.value;
    if (typeof createCanvas !== 'function') {
      return [missing(WEBGL_BASE, 'unsupported', 'canvas 를 만들 수 없는 환경입니다')];
    }
    const canvas = attempt(() => createCanvas());
    if (!canvas.ok) return [failed(WEBGL_BASE, `canvas 오류 — ${canvas.error}`, env.now())];
    for (const kind of ['webgl2', 'webgl']) {
      const context = attempt(() => canvas.value.getContext(kind));
      if (!context.ok) return [failed(WEBGL_BASE, `getContext 오류 — ${context.error}`, env.now())];
      if (context.value) {
        release(context.value);
        return [sampled(WEBGL_BASE, kind, env.now())];
      }
    }
    return [
      missing(
        WEBGL_BASE,
        'unavailable',
        'webgl2·webgl context 를 만들 수 없습니다 (GPU 차단·비활성)',
      ),
    ];
  },
};
