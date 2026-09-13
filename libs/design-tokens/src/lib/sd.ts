import path from 'node:path';

import {
  expandTypesMap,
  getTransforms,
  register as registerTokensStudio,
} from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';
import type { Dictionary, Transform, TransformedToken } from 'style-dictionary/types';

import type { ThemeDef } from '../themes.js';

import { toRnNumeric, toWebDuration, toWebFontStack, toWebRem } from './platformValue.js';
import { getTokenType, getTokenValue } from './tokens.js';

export type ThemeBuild = {
  theme: string;
  selector: string;
  web: Dictionary;
  rn: Dictionary;
};

const RN_NUMERIC_TYPES = new Set([
  'dimension',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'fontWeight',
  'duration',
]);

/**
 * Web px → rem 변환 대상 타입.
 * spacing/radius/borderWidth는 전처리에서 `dimension`으로 합쳐지므로 `dimension`에 포함된다.
 */
const WEB_REM_TYPES = new Set(['dimension', 'fontSize', 'lineHeight']);

/** RN: 숫자 문자열 → number (`'16'` → `16`) */
const rnNumberTransform: Transform = {
  name: 'ds/rn/number',
  type: 'value',
  transitive: true,
  filter: (t) => {
    const type = getTokenType(t);
    return typeof type === 'string' && RN_NUMERIC_TYPES.has(type);
  },
  transform: (t: TransformedToken) => toRnNumeric(getTokenValue(t)),
};

/** Web: px → rem (`16` → `1rem`) */
const webRemTransform: Transform = {
  name: 'ds/web/rem',
  type: 'value',
  transitive: true,
  filter: (t) => {
    const type = getTokenType(t);
    return typeof type === 'string' && WEB_REM_TYPES.has(type);
  },
  transform: (t: TransformedToken) => toWebRem(getTokenValue(t)),
};

/** Web: 숫자 → ms (`140` → `140ms`) */
const webDurationTransform: Transform = {
  name: 'ds/web/duration',
  type: 'value',
  transitive: true,
  filter: (t) => getTokenType(t) === 'duration',
  transform: (t: TransformedToken) => toWebDuration(getTokenValue(t)),
};

/** Web: 서체 이름 → fallback 스택 (`Pretendard` → `Pretendard, 'Apple SD Gothic Neo', ...`) */
const webFontFamilyTransform: Transform = {
  name: 'ds/web/fontFamily',
  type: 'value',
  transitive: true,
  filter: (t) => getTokenType(t) === 'fontFamily',
  transform: (t: TransformedToken) => toWebFontStack(getTokenValue(t)),
};

let registered = false;

/** SD에 transform 등록 (최초 1회만) */
const registerOnce = () => {
  if (registered) return;
  registered = true;
  registerTokensStudio(StyleDictionary);
  StyleDictionary.registerTransform(rnNumberTransform);
  StyleDictionary.registerTransform(webRemTransform);
  StyleDictionary.registerTransform(webDurationTransform);
  StyleDictionary.registerTransform(webFontFamilyTransform);
};

/** 배열에서 특정 항목 제외 */
const without = (arr: string[], rm: string[]) => {
  const set = new Set(rm);
  return arr.filter((x) => !set.has(x));
};

const baseTransforms = getTransforms({ platform: 'css' })
  .filter((t): t is string => typeof t === 'string')
  .filter((t) => !t.startsWith('name/'));

const WEB_TRANSFORMS = [
  ...without(baseTransforms, ['ts/color/css/hexrgba', 'ts/size/px']),
  'ds/web/rem',
  'ds/web/duration',
  'ds/web/fontFamily',
  'name/kebab',
];

const RN_TRANSFORMS = [
  ...without(baseTransforms, ['ts/size/px', 'ts/size/css/letterspacing', 'ts/color/css/hexrgba']),
  'ds/rn/number',
  'name/kebab',
];

/** 테마별 web/rn 토큰 사전 빌드 (in-memory) */
export const buildThemeDictionaries = async (
  themes: readonly ThemeDef[],
  tokensDirAbs: string,
): Promise<ThemeBuild[]> => {
  registerOnce();

  const builds: ThemeBuild[] = [];
  for (const theme of themes) {
    const source = theme.sourceDirs.map((d) => path.join(tokensDirAbs, d, '*.json'));

    const sd = new StyleDictionary({
      log: { warnings: 'disabled', verbosity: 'silent' },
      preprocessors: ['tokens-studio'],
      expand: { typesMap: expandTypesMap },
      source,
      platforms: {
        web: { transforms: WEB_TRANSFORMS },
        rn: { transforms: RN_TRANSFORMS },
      },
    });

    builds.push({
      theme: theme.name,
      selector: theme.selector,
      web: await sd.getPlatformTokens('web'),
      rn: await sd.getPlatformTokens('rn'),
    });
  }
  return builds;
};
