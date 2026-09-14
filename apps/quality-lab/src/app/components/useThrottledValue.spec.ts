import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useThrottledValue } from './useThrottledValue';

describe('useThrottledValue — 변화 알림을 몰아 보내지 않는다', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('첫 변화는 바로, 이후는 간격마다 마지막 값 하나만 보인다', () => {
    const { result, rerender } = renderHook(({ value }) => useThrottledValue(value, 1000), {
      initialProps: { value: 'a' },
    });
    expect(result.current).toBe('a');

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(0));
    expect(result.current).toBe('b');

    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(500));
    rerender({ value: 'd' });
    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toBe('b');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('d');
  });
});
