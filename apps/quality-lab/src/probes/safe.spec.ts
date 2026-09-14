import { describe, expect, it } from 'vitest';

import { attempt, attemptAsync, isPermissionName, peek } from './safe';

describe('attempt — 모든 읽기는 던질 수 있다', () => {
  it('getter 가 던지면 오류 글과 이름으로 돌려주고, 0 은 값이다', () => {
    const source = Object.defineProperty({}, 'value', {
      get: () => {
        throw new TypeError('boom');
      },
    }) as { value: number };
    expect(attempt(() => source.value)).toEqual({
      ok: false,
      error: 'TypeError: boom',
      name: 'TypeError',
    });
    expect(peek(() => source.value)).toBeUndefined();
    expect(attempt(() => 0)).toEqual({ ok: true, value: 0 });
  });

  it('promise 가 거절되거나 호출 자체가 던져도 오류다', async () => {
    expect(await attemptAsync(() => Promise.reject(new Error('denied')))).toEqual({
      ok: false,
      error: 'Error: denied',
      name: 'Error',
    });
    expect(
      await attemptAsync(() => {
        throw new Error('sync');
      }),
    ).toEqual({ ok: false, error: 'Error: sync', name: 'Error' });
  });

  it('권한 거절 이름만 permission 으로 본다', () => {
    expect(isPermissionName('NotAllowedError')).toBe(true);
    expect(isPermissionName('SecurityError')).toBe(true);
    expect(isPermissionName('TypeError')).toBe(false);
    expect(isPermissionName(null)).toBe(false);
  });
});
