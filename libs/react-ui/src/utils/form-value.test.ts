import { describe, expect, it } from 'vitest';

import { hasFormValue } from './form-value';

describe('hasFormValue', () => {
  it('빈 문자열·null·undefined 는 값이 없는 것으로 본다', () => {
    expect(hasFormValue('')).toBe(false);
    expect(hasFormValue(null)).toBe(false);
    expect(hasFormValue(undefined)).toBe(false);
  });

  it('숫자 0 과 false 는 값이 있는 것으로 본다', () => {
    // label float 판정이라 falsy 여부가 아니라 "입력이 있는가"가 기준이다.
    expect(hasFormValue(0)).toBe(true);
    expect(hasFormValue(false)).toBe(true);
  });

  it('배열은 비어 있지 않을 때만 값이 있다', () => {
    expect(hasFormValue(['a'])).toBe(true);
    expect(hasFormValue([])).toBe(false);
  });

  it('객체는 값이 있는 것으로 본다', () => {
    expect(hasFormValue({})).toBe(true);
  });
});
