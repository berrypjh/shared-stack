import { browserCapabilitySchema } from '@berrypjh/observability-contracts';

import { describe, expect, it, vi } from 'vitest';

import { fakeEnv, fakeTarget } from '../test/browser';

import { apiProbe, connectivityProbe, deviceProbe, isolationProbe, webglProbe } from './device';
import type { BrowserEnv } from './env';

type Item = {
  id: string;
  support: string;
  state: string;
  value: unknown;
  reason: string | null;
  limitation: string | null;
};

const index = (items: Item[]) => {
  for (const item of items) browserCapabilitySchema.parse(item);
  return Object.fromEntries(items.map((item) => [item.id, item]));
};

const navigatorWith = (patch: Record<string, unknown>) =>
  ({ ...fakeEnv().navigator, ...patch }) as BrowserEnv['navigator'];

describe('connectivityProbe', () => {
  it('offline 은 실제 false 이고 연결 보장이 아닌 hint 라고 적는다', () => {
    const items = index(
      connectivityProbe.sample(fakeEnv({ navigator: navigatorWith({ onLine: false }) })),
    );
    expect(items['network.online']).toMatchObject({ support: 'supported', value: false });
    expect(items['network.online']).toHaveProperty(
      'limitation',
      'connectivity hint — true 여도 인터넷 연결을 보장하지 않습니다',
    );
  });

  it('Network Information 이 없으면 지원 안 함, 있으면 반올림 근사값이다', () => {
    const absent = index(
      connectivityProbe.sample(fakeEnv({ navigator: navigatorWith({ connection: undefined }) })),
    );
    expect(absent['network.connection']).toMatchObject({ support: 'unsupported', value: null });
    const present = index(connectivityProbe.sample(fakeEnv()));
    expect(present['network.connection']).toMatchObject({
      value: '4g',
      approximate: true,
      detail: [
        { name: 'downlink (Mbps)', value: 10 },
        { name: 'rtt (ms)', value: 50 },
        { name: 'saveData', value: false },
      ],
    });
  });

  it('online·offline·connection 변화를 구독하고 정리한다', () => {
    const window = fakeTarget();
    const connection = Object.assign(fakeTarget(), { effectiveType: '3g' });
    const env = fakeEnv({ window, navigator: navigatorWith({ connection }) });
    const onChange = vi.fn();
    const dispose = connectivityProbe.subscribe(env, onChange);
    window.dispatch('offline');
    connection.dispatch('change');
    expect(onChange).toHaveBeenCalledTimes(2);
    dispose();
    expect(window.count() + connection.count()).toBe(0);
  });
});

describe('deviceProbe', () => {
  it('deviceMemory·코어 수는 제한된 근사값이고 쿠키는 내용 없이 hint 만 읽는다', () => {
    const items = index(
      deviceProbe.sample(fakeEnv({ navigator: navigatorWith({ cookieEnabled: false }) })),
    );
    expect(items['device.memory']).toMatchObject({ value: 8, unit: 'GiB', approximate: true });
    expect(items['device.cores']).toMatchObject({ value: 8, unit: 'count' });
    expect(items['device.cookie-enabled']).toMatchObject({ state: 'sampled', value: false });
  });

  it('JS heap 은 legacy 진단일 때만 있고 없으면 지원 안 함이다', () => {
    expect(index(deviceProbe.sample(fakeEnv()))['device.js-heap']).toMatchObject({
      support: 'unsupported',
    });
    const heap = index(
      deviceProbe.sample(
        fakeEnv({
          performance: {
            timeOrigin: 1,
            memory: { usedJSHeapSize: 1000, totalJSHeapSize: 2000, jsHeapSizeLimit: 4000 },
          },
        }),
      ),
    )['device.js-heap'];
    expect(heap).toMatchObject({ value: 1000, unit: 'bytes', approximate: true });
    expect((heap as { limitation: string }).limitation).toContain('legacy');
  });
});

describe('isolationProbe', () => {
  it('crossOriginIsolated false 는 측정값이고 SharedArrayBuffer 전역 부재는 지원 안 함이다', () => {
    const items = index(isolationProbe.sample(fakeEnv()));
    expect(items['isolation.cross-origin-isolated']).toMatchObject({ value: false });
    expect(items['isolation.shared-array-buffer']).toMatchObject({ support: 'unsupported' });
    expect(items['isolation.shared-array-buffer'].reason).toContain('cross-origin isolated');
  });
});

describe('apiProbe — capability allowlist', () => {
  it('있는 API 는 지원, 없는 API 는 지원 안 함이다', () => {
    const items = index(apiProbe.sample(fakeEnv()));
    expect(items['api.webassembly']).toMatchObject({ support: 'supported', value: true });
    expect(items['api.shared-worker']).toMatchObject({ support: 'unsupported', value: null });
    expect(items['api.service-worker']).toMatchObject({ support: 'supported' });
  });

  it('CSS.supports 가 없으면 측정 안 함, false 면 지원 안 함, 던지면 오류다', () => {
    expect(index(apiProbe.sample(fakeEnv({ css: undefined })))['css.has']).toMatchObject({
      support: 'not-measured',
    });
    expect(
      index(apiProbe.sample(fakeEnv({ css: { supports: () => false } })))['css.has'],
    ).toMatchObject({ support: 'unsupported', state: 'not-sampled' });
    expect(
      index(
        apiProbe.sample(
          fakeEnv({
            css: {
              supports: () => {
                throw new SyntaxError('bad');
              },
            },
          }),
        ),
      )['css.has'],
    ).toMatchObject({ support: 'unavailable', state: 'error' });
  });
});

describe('webglProbe — context 가용성만', () => {
  it('context 를 만들면 종류만 적고 renderer 정보를 읽지 않은 채 정리한다', () => {
    const loseContext = vi.fn();
    const getParameter = vi.fn();
    const getContext = vi.fn((id: string) =>
      id === 'webgl' ? { getParameter, getExtension: () => ({ loseContext }) } : null,
    );
    const [item] = webglProbe.sample(fakeEnv({ createCanvas: () => ({ getContext }) }));
    browserCapabilitySchema.parse(item);
    expect(item).toMatchObject({ id: 'api.webgl', support: 'supported', value: 'webgl' });
    expect(loseContext).toHaveBeenCalled();
    expect(getParameter).not.toHaveBeenCalled();
  });

  it('context 를 만들 수 없으면 사용 불가, canvas 가 없으면 지원 안 함이다', () => {
    const [none] = webglProbe.sample(fakeEnv({ createCanvas: () => ({ getContext: () => null }) }));
    expect(none).toMatchObject({ support: 'unavailable', state: 'not-sampled' });
    const [absent] = webglProbe.sample(fakeEnv({ createCanvas: undefined }));
    expect(absent).toMatchObject({ support: 'unsupported' });
  });
});
