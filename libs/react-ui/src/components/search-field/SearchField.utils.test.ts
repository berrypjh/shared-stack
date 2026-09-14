import { describe, expect, it } from 'vitest';

import { toInputString } from './SearchField.utils';

describe('toInputString', () => {
  it('null·undefined 는 빈 문자열', () => {
    expect(toInputString(null)).toBe('');
    expect(toInputString(undefined)).toBe('');
  });

  it('숫자 0 과 false 를 빈 문자열로 뭉개지 않는다', () => {
    expect(toInputString(0)).toBe('0');
    expect(toInputString(false)).toBe('false');
  });

  it('배열은 빈 문자열 — SearchField 는 단일 값만 다룬다', () => {
    expect(toInputString(['a', 'b'])).toBe('');
    expect(toInputString([])).toBe('');
  });

  it('문자열은 그대로 둔다', () => {
    expect(toInputString('  keep  ')).toBe('  keep  ');
  });
});
