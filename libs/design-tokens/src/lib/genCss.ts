import fs from 'node:fs/promises';
import path from 'node:path';

import type { TransformedToken } from 'style-dictionary/types';

import { baseTheme } from '../themes.js';

import type { ThemeBuild } from './sd.js';
import { colorToRgbChannels, cssVarName, getTokenType, getTokenValue } from './tokens.js';

const PREFIX = 'ds';

/** 토큰 값 → CSS 선언 값 문자열, 객체·배열은 JSON (`16` → `'16'`) */
const stringify = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return JSON.stringify(v);
};

export type Decl = { name: string; value: string };

/**
 * 토큰 값 reader.
 * 기본은 사전에 담긴 값이고, Consumer compiler는 합성된 값을 돌려주는 reader를 넘긴다.
 */
export type ReadValue = (token: TransformedToken) => unknown;

/**
 * 한 테마 dict → 정렬된 CSS 선언 목록 (`--ds-...: value;`).
 * color는 `-rgb` 채널 선언을 함께 만든다.
 * Shared 빌드와 Consumer delta가 같은 구현을 써서 RGB 파생도 한 곳에서만 일어난다.
 */
export const declsFromDict = (
  tokens: TransformedToken[],
  readValue: ReadValue = getTokenValue,
): Decl[] => {
  const decls: Decl[] = [];
  for (const t of tokens) {
    const name = cssVarName(PREFIX, t.path);
    const v = readValue(t);
    decls.push({ name, value: stringify(v) });

    if (getTokenType(t) === 'color') {
      const channels = colorToRgbChannels(v);
      if (channels) decls.push({ name: `${name}-rgb`, value: channels });
    }
  }
  decls.push(...composedShadowDecls(tokens));
  return decls.sort((a, b) => a.name.localeCompare(b.name));
};

/** 합성 shadow 변수를 만드는 카테고리 */
const SHADOW_HEADS = new Set(['shadow', 'elevation']);

/** shadow 레이어 하나를 이루는 자식 토큰 이름 */
const SHADOW_PARTS = ['offsetX', 'offsetY', 'blur', 'spread', 'color', 'type'] as const;

type ShadowLayer = Partial<Record<(typeof SHADOW_PARTS)[number], string>>;

/** shadow 레이어 → box-shadow 조각, 빠진 값이 있으면 null (innerShadow는 `inset` 접두) */
const shadowLayerCss = (layer: ShadowLayer): string | null => {
  const { offsetX, offsetY, blur, spread, color, type } = layer;
  if (!offsetX || !offsetY || !blur || !spread || !color) return null;
  const inset = type === 'innerShadow' ? 'inset ' : '';
  return `${inset}${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
};

/**
 * 분해된 shadow 자식 → 합성 선언 (`shadow.lg.1.blur` … → `--ds-shadow-lg`).
 * sd-transforms가 boxShadow를 레이어별 자식 변수로 분해해 바로 쓸 수 있는 단일 변수가 없으므로,
 * 소비자가 자식을 손으로 조합하지 않도록 합성본을 함께 만든다.
 * 그룹 경로는 `[카테고리, 이름]`(+ 선택적 레이어)이고, 레이어는 번호 순으로 `, ` 결합한다.
 */
const composedShadowDecls = (tokens: TransformedToken[]): Decl[] => {
  const groups = new Map<string, { path: string[]; layers: Map<string, ShadowLayer> }>();

  for (const t of tokens) {
    const part = t.path[t.path.length - 1] as (typeof SHADOW_PARTS)[number];
    if (!SHADOW_HEADS.has(t.path[0]) || !SHADOW_PARTS.includes(part)) continue;

    const rest = t.path.slice(0, -1);
    const name = rest.slice(0, 2);
    const layer = rest[2] ?? '1';
    const key = name.join('.');

    if (!groups.has(key)) groups.set(key, { path: name, layers: new Map() });
    const group = groups.get(key);
    if (!group) continue;
    if (!group.layers.has(layer)) group.layers.set(layer, {});
    (group.layers.get(layer) as ShadowLayer)[part] = stringify(getTokenValue(t));
  }

  const decls: Decl[] = [];
  for (const { path, layers } of groups.values()) {
    const ordered = [...layers.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([, layer]) => shadowLayerCss(layer));
    if (ordered.some((l) => l === null)) continue;
    decls.push({ name: cssVarName(PREFIX, path), value: ordered.join(', ') });
  }
  return decls;
};

/** selector와 선언 목록 → CSS 룰 블록 (`:root { --x: y; ... }`) */
export const block = (selector: string, decls: Decl[]): string => {
  const lines = decls.map((d) => `  ${d.name}: ${d.value};`).join('\n');
  return `${selector} {\n${lines}\n}\n`;
};

/**
 * 테마별 in-memory dictionary → CSS 변수 파일.
 * - `variables.{theme}.css`: 테마별 단일 파일 (base는 풀세트, 그 외는 override-only)
 * - `variables.css`: base + 다른 테마 override 병합본 (단일 import용)
 * - `index.d.ts`: side-effect import용 빈 d.ts
 */
export const writeCss = async (builds: ThemeBuild[], distCssDirAbs: string): Promise<void> => {
  await fs.mkdir(distCssDirAbs, { recursive: true });

  const baseBuild = builds.find((b) => b.theme === baseTheme.name);
  if (!baseBuild) throw new Error(`base theme "${baseTheme.name}" not found in builds`);
  const baseDecls = declsFromDict([...baseBuild.web.allTokens]);
  const baseByName = new Map(baseDecls.map((d) => [d.name, d.value]));

  const baseCss = block(baseBuild.selector, baseDecls);
  await fs.writeFile(path.join(distCssDirAbs, `variables.${baseTheme.name}.css`), baseCss, 'utf8');

  const overrides: string[] = [];
  for (const b of builds) {
    if (b.theme === baseTheme.name) continue;

    const themeDecls = declsFromDict([...b.web.allTokens]).filter(
      (d) => baseByName.get(d.name) !== d.value,
    );
    const overrideCss = block(b.selector, themeDecls);

    await fs.writeFile(path.join(distCssDirAbs, `variables.${b.theme}.css`), overrideCss, 'utf8');
    overrides.push(overrideCss);
  }

  await fs.writeFile(
    path.join(distCssDirAbs, 'variables.css'),
    `${baseCss}\n${overrides.join('\n')}`,
    'utf8',
  );

  await fs.writeFile(
    path.join(distCssDirAbs, 'index.d.ts'),
    `// AUTO-GENERATED\nexport {};\n`,
    'utf8',
  );
};
