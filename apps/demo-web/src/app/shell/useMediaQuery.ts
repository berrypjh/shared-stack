import { useEffect, useState } from 'react';

/**
 * 미디어 쿼리 구독.
 *
 * Designer 의 세 region 을 breakpoint 마다 **CSS 로 두 벌 그리지 않기 위해** 쓴다. 두 벌을
 * 그리면 같은 landmark 와 접근 가능한 이름이 DOM 에 둘씩 생겨 보조 기술과 테스트가 어느
 * 쪽인지 알 수 없다. 한 벌만 mount 하려면 폭을 JS 가 알아야 한다.
 *
 * `matchMedia` 가 없는 환경(jsdom 기본)에서는 `fallback` 을 쓴다. Designer 는 wide 를 기본값으로
 * 주어 아무 region 도 숨지 않게 한다 — 알 수 없을 때 감추는 것보다 드러내는 쪽이 안전하다.
 */
export const useMediaQuery = (query: string, fallback: boolean): boolean => {
  const [matches, setMatches] = useState(() =>
    typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};
