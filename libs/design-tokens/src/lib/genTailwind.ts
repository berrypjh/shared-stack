import fs from 'node:fs/promises';
import path from 'node:path';

import type { TransformedToken } from 'style-dictionary/types';

import { baseTheme } from '../themes.js';

import type { ThemeBuild } from './sd.js';
import { cssVarName, getTokenType } from './tokens.js';

const PREFIX = 'ds';

/** Tailwind alpha 유틸용 색상 표현식 (`--x-rgb` → `rgb(var(--x-rgb) / <alpha-value>)`) */
const twAlphaColor = (rgbVar: string) => `rgb(var(${rgbVar}) / <alpha-value>)`;

/** CSS 변수 참조식 (`--x` → `var(--x)`) */
const twVar = (cssVar: string) => `var(${cssVar})`;

type Flat = {
  path: string[];
  type: string;
  cssVar: string;
};

/** SD 토큰 → preset 생성에 필요한 최소 필드 (path/type/cssVar) */
const toFlat = (t: TransformedToken): Flat => ({
  path: t.path,
  type: getTokenType(t) ?? 'unknown',
  cssVar: cssVarName(PREFIX, t.path),
});

type Rec = Record<string, unknown>;

/** 배열·null이 아닌 일반 객체인지 검사 */
const isRec = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);

/** path를 따라 중첩 객체에 값 설정, 중간 노드가 객체가 아니면 새 객체로 교체 */
const setDeep = (obj: Rec, p: string[], value: unknown) => {
  let cur = obj;
  for (let i = 0; i < p.length - 1; i++) {
    const k = p[i];
    if (!k) return;
    const existing = cur[k];
    const child: Rec = isRec(existing) ? existing : {};
    cur[k] = child;
    cur = child;
  }
  const last = p[p.length - 1];
  if (last) cur[last] = value;
};

/** color 토큰 → path 트리, 값은 alpha 유틸용 색상 표현식 */
const buildColors = (tokens: Flat[]): Rec => {
  const out: Rec = {};
  for (const t of tokens) {
    if (t.type !== 'color') continue;
    setDeep(out, t.path, twAlphaColor(`${t.cssVar}-rgb`));
  }
  return out;
};

type SimpleMap = Record<string, string>;

/**
 * path[0]이 `heads`인 토큰 → 평탄 map (값은 `var(--x)`).
 * - `dropFirst`: head를 키에서 제거 (`spacing-sm` → `sm`)
 * - `topLevelOnly`: path 길이가 정확히 2인 토큰만 (typography composite 제외)
 */
const collect = (
  tokens: Flat[],
  heads: string | string[],
  dropFirst: boolean,
  topLevelOnly = false,
): SimpleMap => {
  const set = new Set(Array.isArray(heads) ? heads : [heads]);
  const out: SimpleMap = {};
  for (const t of tokens) {
    if (!set.has(t.path[0])) continue;
    if (topLevelOnly && t.path.length !== 2) continue;
    const key = (dropFirst ? t.path.slice(1) : t.path).join('-');
    out[key] = twVar(t.cssVar);
  }
  return out;
};

/**
 * shadow/elevation 토큰 → boxShadow map (`shadow.lg` → `var(--ds-shadow-lg)`).
 * 레이어 자식으로 분해되지만 `genCss`가 합성 변수를 함께 만들므로, 값을 굽지 않고 그 변수를 가리킨다.
 */
const collectShadows = (tokens: Flat[], head: string): SimpleMap => {
  const out: SimpleMap = {};
  for (const t of tokens) {
    if (t.path[0] !== head || t.path.length < 2) continue;
    const name = t.path.slice(0, 2);
    out[name[1]] = twVar(cssVarName(PREFIX, name));
  }
  return out;
};

/** preset 파일의 상수 선언 문자열 (`colors` → `const colors = {...} as const;`) */
const tsConst = (name: string, obj: unknown) =>
  `const ${name} = ${JSON.stringify(obj, null, 2)} as const;\n\n`;

/**
 * Tailwind preset 생성 (`.generated/tailwind/preset.ts`).
 * 모든 값이 CSS 변수 참조라 테마와 무관하므로 base 사전만 사용한다.
 * boxShadow는 `genCss`가 만드는 합성 변수(`--ds-shadow-lg` 등)를 가리킨다.
 */
export const writeTailwindPreset = async (
  builds: ThemeBuild[],
  outFileAbs: string,
): Promise<void> => {
  const base = builds.find((b) => b.theme === baseTheme.name);
  if (!base) throw new Error(`base theme "${baseTheme.name}" not found in builds`);
  const tokens = base.web.allTokens.map(toFlat);

  const sections = {
    colors: buildColors(tokens),
    spacing: collect(tokens, 'spacing', true),
    borderRadius: collect(tokens, 'radius', true),
    borderWidth: collect(tokens, ['primitiveBorder', 'semanticBorder'], false),
    boxShadow: { ...collectShadows(tokens, 'shadow'), ...collectShadows(tokens, 'elevation') },
    fontFamily: collect(tokens, 'fontFamilies', true, true),
    fontWeight: collect(tokens, ['fontWeight', 'fontWeights'], true, true),
    fontSize: collect(tokens, ['fontSize', 'fontSizes'], true, true),
    lineHeight: collect(tokens, ['lineHeight', 'lineHeights'], true, true),
    letterSpacing: collect(tokens, 'letterSpacing', true, true),
  };

  const decls = Object.entries(sections)
    .map(([name, obj]) => tsConst(name, obj))
    .join('');

  const presetTs = `/* eslint-disable */
// AUTO-GENERATED Tailwind preset (uses CSS variables from variables.css)

import type { Config } from 'tailwindcss';

${decls}export const preset = {
  content: [],
  theme: {
    extend: {
      colors,
      spacing,
      borderRadius,
      borderWidth,
      boxShadow,
      fontFamily,
      fontWeight,
      fontSize,
      lineHeight,
      letterSpacing
    }
  }
} satisfies Config;

export default preset;
`;

  await fs.mkdir(path.dirname(outFileAbs), { recursive: true });
  await fs.writeFile(outFileAbs, presetTs, 'utf8');
};
