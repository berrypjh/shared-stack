import type { TransformedToken } from 'style-dictionary/types';

/**
 * DTCG 토큰의 `$type` 추출.
 * 부모의 `$type`을 상속받는 자식 토큰은 SD가 leaf까지 전파한다.
 */
export const getTokenType = (t: TransformedToken): string | undefined =>
  t.$type ?? t.original.$type;

/** DTCG 토큰의 `$value` 추출 */
export const getTokenValue = (t: TransformedToken): unknown => t.$value;

/** camelCase·snake_case·공백 → kebab-case (`fontSize_lg` → `font-size-lg`) */
const toKebab = (s: string): string =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

/** 토큰 path → CSS 변수명, prefix는 선택 (`ds`, `['color', 'primary']` → `--ds-color-primary`) */
export const cssVarName = (prefix: string | undefined, path: readonly string[]): string => {
  const k = toKebab(path.join('-'));
  return prefix ? `--${prefix}-${k}` : `--${k}`;
};

/** HEX·`rgb()` 색상 → 채널 문자열, 그 외는 null (`#ff8000` → `'255 128 0'`) */
export const colorToRgbChannels = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (v.startsWith('#')) return rgbStr(parseHex(v));
  if (/^rgba?\(/i.test(v)) return rgbStr(parseRgbFn(v));
  return null;
};

/** RGB 튜플 → 채널 문자열, null은 그대로 (`[255, 128, 0]` → `'255 128 0'`) */
const rgbStr = (rgb: [number, number, number] | null) =>
  rgb ? `${rgb[0]} ${rgb[1]} ${rgb[2]}` : null;

/** `#RGB`·`#RRGGBB`·`#RRGGBBAA` → RGB 튜플, 알파는 무시 (`#f80` → `[255, 136, 0]`) */
const parseHex = (hex: string): [number, number, number] | null => {
  const h = hex.replace('#', '');
  if (![3, 6, 8].includes(h.length)) return null;
  const six =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.slice(0, 6);
  const r = parseInt(six.slice(0, 2), 16);
  const g = parseInt(six.slice(2, 4), 16);
  const b = parseInt(six.slice(4, 6), 16);
  return [r, g, b].some(Number.isNaN) ? null : [r, g, b];
};

/** `rgb()`·`rgba()` → RGB 튜플, 0~255로 클램프 (`rgb(300 0 0)` → `[255, 0, 0]`) */
const parseRgbFn = (fn: string): [number, number, number] | null => {
  const m = fn.match(/^rgba?\((.+)\)$/i);
  if (!m) return null;
  const parts = m[1]
    .split(/[,\s/]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 3) return null;
  const nums = parts.slice(0, 3).map(Number);
  if (nums.some(Number.isNaN)) return null;
  const clamp = (x: number) => Math.max(0, Math.min(255, x));
  return [clamp(nums[0]), clamp(nums[1]), clamp(nums[2])];
};

/** 토큰 head → 카테고리 접두 path (`primary` → `['color', 'primary']`) */
const HEAD_REWRITE: Record<string, readonly string[]> = {
  primary: ['color', 'primary'],
  secondary: ['color', 'secondary'],
  neutral: ['color', 'neutral'],
  success: ['color', 'success'],
  warning: ['color', 'warning'],
  error: ['color', 'error'],
  primaryBtn: ['color', 'primaryBtn'],
  secondaryBtn: ['color', 'secondaryBtn'],
  errorBtn: ['color', 'errorBtn'],
  field: ['color', 'field'],
  selectionControl: ['color', 'selectionControl'],
  text: ['color', 'text'],
  background: ['color', 'background'],
  icon: ['color', 'icon'],
  stroke: ['color', 'stroke'],

  fontFamilies: ['typography', 'fontFamilies'],
  fontWeight: ['typography', 'fontWeight'],
  fontSize: ['typography', 'fontSize'],
  lineHeight: ['typography', 'lineHeight'],
  letterSpacing: ['typography', 'letterSpacing'],
  display: ['typography', 'display'],
  heading: ['typography', 'heading'],
  body: ['typography', 'body'],
  paragraph: ['typography', 'paragraph'],
  caption: ['typography', 'caption'],

  primitiveBorder: ['borderWidth', 'primitive'],
  semanticBorder: ['borderWidth', 'semantic'],

  spacing: ['spacing'],
  radius: ['radius'],
  shadow: ['shadow'],
  elevation: ['elevation'],
  border: ['border'],
  component: ['component'],
  motion: ['motion'],
};

/**
 * 토큰 path의 head를 카테고리 접두 path로 치환 (`['primary', '500']` → `['color', 'primary', '500']`).
 * 미등록 head는 throw해서 새 토큰의 누락을 빌드에서 즉시 감지한다.
 */
export const classifyTokenPath = (path: readonly string[]): string[] => {
  const head = path[0];
  if (!head) throw new Error(`Invalid token path: ${path.join('.')}`);
  const rewrite = HEAD_REWRITE[head];
  if (!rewrite) {
    throw new Error(
      `Unmapped token head "${head}" (path=${path.join('.')}). Add it to HEAD_REWRITE in src/lib/tokens.ts`,
    );
  }
  return [...rewrite, ...path.slice(1)];
};

/** 토큰 카테고리 목록 (`classifyTokenPath` 결과의 첫 segment) */
export const TOKEN_CATEGORIES = [
  'color',
  'spacing',
  'radius',
  'borderWidth',
  'border',
  'typography',
  'shadow',
  'elevation',
  'component',
  'motion',
] as const;
