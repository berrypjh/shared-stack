import { ReactNode, useEffect, useState } from 'react';

import { ThemeName, themes } from '@berrypjh/react-ui';

import { createPortal } from 'react-dom';

/**
 * 모든 테마를 **동시에** 측정한다.
 *
 * 토큰 CSS 의 selector 는 `[data-theme="dark"]` 처럼 한 요소에 대한 attribute 선택자다.
 * 그래서 ThemeProvider 바깥(document.body)에 attribute 를 직접 단 probe 를 심으면
 * 화면 테마를 바꾸지 않고도 여러 테마의 값을 함께 읽을 수 있다.
 */

export const PROBE_THEMES = themes.map((t) => t.name as ThemeName);

const HIDDEN: React.CSSProperties = {
  position: 'fixed',
  left: -9999,
  top: 0,
  width: 1,
  height: 1,
  overflow: 'hidden',
  pointerEvents: 'none',
};

export const probeRootId = (theme: ThemeName) => `probe-root-${theme}`;

/** 화면 밖이지만 실제로 렌더되고 스타일이 계산되는 측정 트리. */
export const ProbeTrees = ({ children }: { children?: (theme: ThemeName) => ReactNode }) => (
  <>
    {PROBE_THEMES.map((theme) =>
      createPortal(
        <div key={theme} style={HIDDEN} data-theme={theme} id={probeRootId(theme)} aria-hidden>
          {children?.(theme)}
        </div>,
        document.body,
        theme,
      ),
    )}
  </>
);

export type ProbeValues = Record<string, Record<string, string>>;

/** 각 테마에서 같은 CSS 변수 목록을 읽는다. */
export const useProbeValues = (names: readonly string[]): ProbeValues | null => {
  const [values, setValues] = useState<ProbeValues | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const entries = PROBE_THEMES.map((theme) => {
        const el = document.getElementById(probeRootId(theme));
        if (!el) return null;
        const style = getComputedStyle(el);
        return [theme, Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()]))];
      });
      setValues(entries.every(Boolean) ? Object.fromEntries(entries as [string, never][]) : null);
    });
    return () => cancelAnimationFrame(raf);
  }, [names]);

  return values;
};
