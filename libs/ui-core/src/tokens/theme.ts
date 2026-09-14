import type { ThemeName } from '@berrypjh/design-tokens';

import type { Theme } from './types';

export const createTheme = <T>(options: { mode: ThemeName; tokens: T }): Theme<T> => {
  return {
    mode: options.mode,
    tokens: options.tokens,
  };
};
