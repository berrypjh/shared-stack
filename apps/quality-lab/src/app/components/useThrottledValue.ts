import { useEffect, useRef, useState } from 'react';

/**
 * 값이 자주 바뀌어도 `delayMs` 에 한 번만 보여준다. 첫 변화는 바로, 이후는 간격이 지난 뒤
 * 마지막 값 하나다. live region 이 연달아 읽히지 않게 한다.
 */
export const useThrottledValue = <T>(value: T, delayMs: number): T => {
  const [shown, setShown] = useState(value);
  const lastUpdate = useRef(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    if (Object.is(value, shown)) return undefined;
    const wait = Math.max(0, lastUpdate.current + delayMs - Date.now());
    const timer = setTimeout(() => {
      lastUpdate.current = Date.now();
      setShown(value);
    }, wait);
    return () => clearTimeout(timer);
  }, [value, shown, delayMs]);

  return shown;
};
