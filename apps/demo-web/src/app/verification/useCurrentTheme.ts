import { useEffect, useState } from 'react';

import { ThemeName } from '@berrypjh/react-ui';

/**
 * ThemeProvider 가 단 `data-theme` 을 DOM 에서 읽는다.
 *
 * Layout 의 state 를 prop 으로 내리는 대신 DOM 을 관찰한다 — 페이지가 Route children 으로
 * 렌더되므로 prop drilling 을 만들지 않기 위함이고, 검증 대상이 "실제로 적용된 값" 이라는
 * 이 영역의 성격과도 맞는다.
 */
export const useCurrentTheme = (): ThemeName => {
  const [theme, setTheme] = useState<ThemeName>('light');

  useEffect(() => {
    const root = document.querySelector('[data-theme]');
    if (!root) return;

    const read = () => setTheme((root.getAttribute('data-theme') as ThemeName) ?? 'light');
    read();

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return theme;
};
