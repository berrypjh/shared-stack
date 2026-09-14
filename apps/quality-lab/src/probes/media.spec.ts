import { browserCapabilitySchema } from '@berrypjh/observability-contracts';

import { describe, expect, it, vi } from 'vitest';

import { fakeEnv, fakeMatchMedia } from '../test/browser';

import { mediaProbe } from './media';

const read = (queries: Record<string, boolean | 'not all'>) => {
  const items = mediaProbe.sample(fakeEnv({ matchMedia: fakeMatchMedia(queries).matchMedia }));
  for (const item of items) browserCapabilitySchema.parse(item);
  return Object.fromEntries(items.map((item) => [item.id, item]));
};

describe('mediaProbe — false 와 지원 안 함을 구분한다', () => {
  it('맞는 keyword 가 값이고 나머지 query 결과도 detail 로 남긴다', () => {
    const items = read({
      '(prefers-reduced-motion: reduce)': true,
      '(forced-colors: none)': true,
    });
    expect(items['media.prefers-reduced-motion']).toMatchObject({
      group: 'preference',
      support: 'supported',
      state: 'sampled',
      value: 'reduce',
    });
    expect(items['media.forced-colors']).toMatchObject({
      value: 'none',
      detail: [
        { name: '(forced-colors: none)', value: true },
        { name: '(forced-colors: active)', value: false },
      ],
    });
  });

  it('모든 keyword 가 false 면 값 false 가 아니라 해석하지 못한 feature 다', () => {
    const items = read({});
    expect(items['media.prefers-contrast']).toMatchObject({
      support: 'unsupported',
      state: 'not-sampled',
      value: null,
    });
    expect(items['media.prefers-contrast'].reason).toContain('모든 keyword 가 false');
  });

  it("브라우저가 'not all' 로 바꾼 query 는 지원 안 함이다", () => {
    const items = read({
      '(prefers-contrast: more)': 'not all',
      '(prefers-contrast: no-preference)': 'not all',
    });
    expect(items['media.prefers-contrast']).toMatchObject({ support: 'unsupported' });
  });

  it('any-pointer 는 여러 keyword 가 동시에 맞을 수 있다', () => {
    const items = read({
      '(any-pointer: coarse)': true,
      '(any-pointer: fine)': true,
      '(pointer: fine)': true,
    });
    expect(items['media.any-pointer']).toMatchObject({ group: 'input', value: ['coarse', 'fine'] });
    expect(items['media.pointer']).toMatchObject({ value: 'fine' });
  });

  it('matchMedia 가 없으면 지원 안 함, 던지면 오류다', () => {
    const absent = mediaProbe.sample(fakeEnv({ matchMedia: undefined }));
    expect(absent.every((item) => item.support === 'unsupported')).toBe(true);
    const throws = mediaProbe.sample(
      fakeEnv({
        matchMedia: () => {
          throw new Error('matchMedia 실패');
        },
      }),
    );
    expect(throws[0]).toMatchObject({ support: 'unavailable', state: 'error' });
  });

  it('media 변화를 구독하고 dispose 하면 listener 를 모두 뗀다', () => {
    for (const legacy of [false, true]) {
      const media = fakeMatchMedia({ '(prefers-color-scheme: light)': true }, { legacy });
      const onChange = vi.fn();
      const dispose = mediaProbe.subscribe(fakeEnv({ matchMedia: media.matchMedia }), onChange);
      media.set('(prefers-color-scheme: dark)', true);
      expect(onChange).toHaveBeenCalled();
      dispose();
      expect(media.listenerCount()).toBe(0);
    }
  });
});
