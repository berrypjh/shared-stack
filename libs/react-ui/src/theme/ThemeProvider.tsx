import { cx } from '../utils';

import { themeProviderClasses } from './ThemeProvider.constants';
import type { ThemeProviderProps } from './ThemeProvider.types';

export const ThemeProvider = ({
  mode = 'light',
  className,
  children,
  ref,
  ...rest
}: ThemeProviderProps) => {
  return (
    <div {...rest} ref={ref} data-theme={mode} className={cx(themeProviderClasses.root, className)}>
      {children}
    </div>
  );
};

ThemeProvider.displayName = 'ThemeProvider';
