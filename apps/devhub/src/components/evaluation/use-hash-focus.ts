import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

/**
 * 주소의 `#id` 가 가리키는 근거 행으로 스크롤하고 포커스를 옮긴다. 대상은 `tabIndex={-1}` 을
 * 가진 행이다. 데이터가 그려진 뒤(`ready`)에만 찾는다.
 */
export const useHashFocus = (ready: boolean) => {
  const { hash } = useLocation();
  useEffect(() => {
    if (!ready || !hash) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    target.scrollIntoView?.({ block: 'start' });
    target.focus({ preventScroll: true });
  }, [hash, ready]);
};

/** 근거 행이 포커스를 받을 때의 표시와 헤더 아래 여백. */
export const TARGET_ROW =
  'scroll-mt-[64px] focus-visible:outline-2 focus-visible:outline-stroke-primary';
