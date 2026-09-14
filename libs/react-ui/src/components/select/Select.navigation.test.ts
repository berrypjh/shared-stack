import { describe, expect, it } from 'vitest';

import {
  getFirstEnabledIndex,
  getInitialHighlightedIndex,
  getLastEnabledIndex,
  getNextEnabledIndex,
} from './Select.navigation';

type Option = { id: string; disabled?: boolean; selected?: boolean };

const options = (spec: string): Option[] =>
  [...spec].map((c, i) => ({
    id: `o${i}`,
    disabled: c === 'x' || c === 'X',
    selected: c === 'S' || c === 'X',
  }));

const isDisabled = (o: Option) => o.disabled === true;
const isSelected = (o: Option) => o.selected === true;

describe('getFirstEnabledIndex', () => {
  it('비활성 옵션을 건너뛴다', () => {
    expect(getFirstEnabledIndex(options('xxo o'.replace(' ', '')), isDisabled)).toBe(2);
  });

  it('옵션이 비면 -1', () => {
    expect(getFirstEnabledIndex([], isDisabled)).toBe(-1);
  });

  it('전부 비활성이면 -1', () => {
    expect(getFirstEnabledIndex(options('xxx'), isDisabled)).toBe(-1);
  });
});

describe('getLastEnabledIndex', () => {
  it('뒤에서부터 비활성을 건너뛴다', () => {
    expect(getLastEnabledIndex(options('ooxx'), isDisabled)).toBe(1);
  });

  it('옵션이 비면 -1', () => {
    expect(getLastEnabledIndex([], isDisabled)).toBe(-1);
  });

  it('전부 비활성이면 -1', () => {
    expect(getLastEnabledIndex(options('xxx'), isDisabled)).toBe(-1);
  });
});

describe('getInitialHighlightedIndex', () => {
  it('선택된 옵션이 있으면 그 인덱스', () => {
    expect(getInitialHighlightedIndex(options('ooSo'), isDisabled, isSelected)).toBe(2);
  });

  it('선택이 없으면 첫 활성 옵션', () => {
    expect(getInitialHighlightedIndex(options('xoo'), isDisabled, isSelected)).toBe(1);
  });

  it('선택된 옵션이 비활성이어도 그 인덱스를 쓴다', () => {
    // 선택 상태가 활성 여부보다 우선한다 — 열었을 때 현재 값이 보여야 하기 때문.
    expect(getInitialHighlightedIndex(options('oXo'), isDisabled, isSelected)).toBe(1);
  });

  it('선택도 활성도 없으면 -1', () => {
    expect(getInitialHighlightedIndex(options('xx'), isDisabled, isSelected)).toBe(-1);
  });

  it('옵션이 비면 -1', () => {
    expect(getInitialHighlightedIndex([], isDisabled, isSelected)).toBe(-1);
  });
});

describe('getNextEnabledIndex', () => {
  it('아래로 이동하며 비활성을 건너뛴다', () => {
    expect(getNextEnabledIndex(options('ooxo'), 1, 1, isDisabled)).toBe(3);
  });

  it('위로 이동하며 비활성을 건너뛴다', () => {
    expect(getNextEnabledIndex(options('oxoo'), 2, -1, isDisabled)).toBe(0);
  });

  it('끝에서 처음으로 순환한다', () => {
    expect(getNextEnabledIndex(options('ooo'), 2, 1, isDisabled)).toBe(0);
  });

  it('처음에서 끝으로 순환한다', () => {
    expect(getNextEnabledIndex(options('ooo'), 0, -1, isDisabled)).toBe(2);
  });

  it('활성 옵션이 하나뿐이면 자기 자신으로 돌아온다', () => {
    expect(getNextEnabledIndex(options('xox'), 1, 1, isDisabled)).toBe(1);
  });

  it('전부 비활성이면 무한 순환하지 않고 -1', () => {
    expect(getNextEnabledIndex(options('xxx'), 0, 1, isDisabled)).toBe(-1);
  });

  it('옵션이 비면 -1', () => {
    expect(getNextEnabledIndex([], 0, 1, isDisabled)).toBe(-1);
  });

  it('시작 인덱스가 범위를 벗어나도 순환 계산이 깨지지 않는다', () => {
    expect(getNextEnabledIndex(options('ooo'), -1, 1, isDisabled)).toBe(0);
  });
});
