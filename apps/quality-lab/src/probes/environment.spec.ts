import { browserCapabilitySchema } from '@berrypjh/observability-contracts';

import { describe, expect, it, vi } from 'vitest';

import { fakeEnv, fakeTarget, NOW } from '../test/browser';

import { environmentProbe } from './environment';

const byId = (items: { id: string }[], id: string) => {
  const found = items.find((item) => item.id === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
};

describe('environmentProbe', () => {
  it('viewport·screen·DPR·orientation·locale·timezone 을 단위와 측정 시각으로 읽는다', () => {
    const items = environmentProbe.sample(fakeEnv());
    for (const item of items) browserCapabilitySchema.parse(item);
    expect(byId(items, 'viewport.width')).toMatchObject({
      support: 'supported',
      state: 'sampled',
      value: 1280,
      unit: 'css-px',
      sampleTime: NOW,
    });
    expect(byId(items, 'viewport.dpr')).toMatchObject({ value: 2, unit: 'ratio' });
    expect(byId(items, 'screen.orientation')).toMatchObject({ value: 'landscape-primary' });
    expect(byId(items, 'locale.languages')).toMatchObject({ value: ['ko-KR', 'en-US'] });
    expect(byId(items, 'locale.timezone')).toMatchObject({ value: 'Asia/Seoul' });
  });

  it('screen getter 가 던지면 그 항목만 오류이고 나머지는 읽는다', () => {
    const env = fakeEnv();
    Object.defineProperty(env, 'screen', {
      get: () => {
        throw new Error('screen 차단');
      },
    });
    const items = environmentProbe.sample(env);
    expect(byId(items, 'screen.width')).toMatchObject({
      support: 'unavailable',
      state: 'error',
      value: null,
      reason: '읽는 중 오류 — Error: screen 차단',
    });
    expect(byId(items, 'viewport.width')).toMatchObject({ state: 'sampled', value: 1280 });
  });

  it('없는 API 는 false·0 이 아니라 지원 안 함이다', () => {
    const items = environmentProbe.sample(
      fakeEnv({ screen: { width: 800, height: 600 }, timeZone: undefined }),
    );
    expect(byId(items, 'screen.orientation')).toMatchObject({
      support: 'unsupported',
      state: 'not-sampled',
      value: null,
    });
    expect(byId(items, 'locale.timezone')).toMatchObject({ support: 'unsupported' });
  });

  it('resize·orientation·language 변화를 구독하고 dispose 하면 listener 가 남지 않는다', () => {
    const window = Object.assign(fakeTarget(), { innerWidth: 1280, innerHeight: 720 });
    const orientation = Object.assign(fakeTarget(), { type: 'portrait-primary' });
    const env = fakeEnv({ window, screen: { width: 1, height: 1, orientation } });
    const onChange = vi.fn();
    const dispose = environmentProbe.subscribe(env, onChange);
    window.dispatch('resize');
    orientation.dispatch('change');
    window.dispatch('languagechange');
    expect(onChange).toHaveBeenCalledTimes(3);
    dispose();
    expect(window.count() + orientation.count()).toBe(0);
  });
});
