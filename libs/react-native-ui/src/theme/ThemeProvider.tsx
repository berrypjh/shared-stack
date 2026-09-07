import { createContext, useContext, useMemo } from 'react';

import type { RNTokens, Theme, ThemeName } from '@berrypjh/ui-core';
import { createTheme, Native } from '@berrypjh/ui-core';

const ThemeContext = createContext<Theme<RNTokens> | null>(null);

/**
 * `Native`의 namespace 키는 capitalize(`Light`/`Dark`/`Sepia`…)이므로 소문자 `ThemeName`으로 매핑한다.
 *
 * `satisfies`라서 design-tokens에 테마가 추가되면 **여기서 컴파일이 깨진다**. 그게 의도다 —
 * 빠진 테마는 `mode`로 선택될 수 있고, 그러면 `tokens`가 `undefined`가 되어 화면에서 터진다.
 * `Partial`이나 `Record<string, …>`로 넓혀서 에러를 지우지 말 것.
 */
const DEFAULT_TOKENS_BY_MODE = {
  light: Native.Light.tokens,
  dark: Native.Dark.tokens,
  sepia: Native.Sepia.tokens,
  amber: Native.Amber.tokens,
  ember: Native.Ember.tokens,
  frost: Native.Frost.tokens,
  midnight: Native.Midnight.tokens,
} satisfies Record<ThemeName, RNTokens>;

export interface ThemeProviderProps {
  mode?: ThemeName;
  tokensByMode?: Record<ThemeName, RNTokens>;
  children: React.ReactNode;
}

export const ThemeProvider = ({
  mode = 'light',
  tokensByMode = DEFAULT_TOKENS_BY_MODE,
  children,
}: ThemeProviderProps) => {
  const theme = useMemo(() => {
    const tokens = tokensByMode[mode];
    return createTheme({ mode, tokens });
  }, [mode, tokensByMode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = (): Theme<RNTokens> | null => {
  return useContext(ThemeContext);
};
