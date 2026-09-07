import { describe, expect, it } from 'vitest';

import {
  hasDisplayValue,
  isOptionSelected,
  isValueEqual,
  stringifyValue,
} from './Select.selection';

describe('stringifyValue', () => {
  it('null·undefined 는 빈 문자열', () => {
    expect(stringifyValue(null)).toBe('');
    expect(stringifyValue(undefined)).toBe('');
  });

  it('숫자 0 과 false 를 빈 문자열로 뭉개지 않는다', () => {
    expect(stringifyValue(0)).toBe('0');
    expect(stringifyValue(false)).toBe('false');
  });

  it('배열은 쉼표로 잇는다', () => {
    expect(stringifyValue(['a', 'b'])).toBe('a,b');
    expect(stringifyValue([])).toBe('');
  });
});

describe('isValueEqual', () => {
  it('원시값은 문자열로 정규화해 비교한다', () => {
    expect(isValueEqual(1, '1')).toBe(true);
    expect(isValueEqual(0, '0')).toBe(true);
    expect(isValueEqual(false, 'false')).toBe(true);
  });

  it('null 과 undefined 는 둘 다 빈 문자열이라 같다고 본다', () => {
    // 문자열 정규화의 알려진 결과다. `''` 도 같은 부류로 취급된다.
    expect(isValueEqual(null, undefined)).toBe(true);
    expect(isValueEqual(null, '')).toBe(true);
  });

  it('객체는 참조 동일성으로만 비교한다', () => {
    const value = { id: 1 };

    expect(isValueEqual(value, value)).toBe(true);
    expect(isValueEqual({ id: 1 }, { id: 1 })).toBe(false);
  });

  it('배열·Date 도 객체라 참조로 비교한다', () => {
    const list = ['a'];
    const date = new Date(0);

    expect(isValueEqual(list, list)).toBe(true);
    expect(isValueEqual(['a'], ['a'])).toBe(false);
    expect(isValueEqual(date, new Date(0))).toBe(false);
  });

  it('객체와 원시값을 문자열로 뭉개 비교하지 않는다', () => {
    // 둘 다 `stringifyValue` 로 넘기면 '[object Object]' 끼리 같아져 버린다.
    expect(isValueEqual({}, '[object Object]')).toBe(false);
  });
});

describe('isOptionSelected', () => {
  it('단일 모드는 값 하나와 비교한다', () => {
    expect(isOptionSelected('a', 'a', false)).toBe(true);
    expect(isOptionSelected('a', 'b', false)).toBe(false);
  });

  it('multiple 모드는 배열 포함 여부를 본다', () => {
    expect(isOptionSelected('a', ['a', 'b'], true)).toBe(true);
    expect(isOptionSelected('c', ['a', 'b'], true)).toBe(false);
  });

  it('multiple 인데 배열이 아니면 선택으로 보지 않는다', () => {
    expect(isOptionSelected('a', 'a', true)).toBe(false);
    expect(isOptionSelected('a', undefined, true)).toBe(false);
  });

  it('빈 배열이면 아무것도 선택되지 않는다', () => {
    expect(isOptionSelected('a', [], true)).toBe(false);
  });
});

describe('hasDisplayValue', () => {
  it('단일 모드에서 빈 문자열·null·undefined 만 비어 있다', () => {
    expect(hasDisplayValue('a', false)).toBe(true);
    expect(hasDisplayValue(0, false)).toBe(true);
    expect(hasDisplayValue(false, false)).toBe(true);
    expect(hasDisplayValue('', false)).toBe(false);
    expect(hasDisplayValue(null, false)).toBe(false);
    expect(hasDisplayValue(undefined, false)).toBe(false);
  });

  it('multiple 모드는 비어 있지 않은 배열만 표시 가능하다', () => {
    expect(hasDisplayValue(['a'], true)).toBe(true);
    expect(hasDisplayValue([], true)).toBe(false);
    expect(hasDisplayValue('a', true)).toBe(false);
  });
});
