export type ThemeDef = {
  name: string;
  selector: string;
  sourceDirs: string[];
};

export const themes = [
  { name: 'light', selector: ':root', sourceDirs: ['light'] },
  { name: 'dark', selector: '[data-theme="dark"], .theme-dark', sourceDirs: ['light', 'dark'] },
  { name: 'sepia', selector: '[data-theme="sepia"], .theme-sepia', sourceDirs: ['light', 'sepia'] },
  { name: 'amber', selector: '[data-theme="amber"], .theme-amber', sourceDirs: ['light', 'amber'] },
  {
    name: 'ember',
    selector: '[data-theme="ember"], .theme-ember',
    sourceDirs: ['light', 'dark', 'ember'],
  },
  { name: 'frost', selector: '[data-theme="frost"], .theme-frost', sourceDirs: ['light', 'frost'] },
  {
    name: 'midnight',
    selector: '[data-theme="midnight"], .theme-midnight',
    sourceDirs: ['light', 'dark', 'midnight'],
  },
] as const satisfies readonly ThemeDef[];

export type ThemeName = (typeof themes)[number]['name'];

export const baseTheme = themes[0];
