/** rem 변환 기준 px (CSS 기본 `16px`) */
const REM_BASE_PX = 16;

/** 배열이 아닌 일반 객체인지 검사 */
const isPlainObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

/** 숫자·숫자 문자열 → number, 단위가 붙으면 null (`'16'` → `16`, `'16px'` → `null`) */
const toNumeric = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** 소수점 6자리까지 표기하고 trailing 0 제거 (`0.125` → `'0.125'`, `1` → `'1'`) */
const stripTrailingZeros = (n: number): string => {
  const s = n.toFixed(6);
  return s.replace(/\.?0+$/, '');
};

/**
 * RN: 숫자 문자열 → number (`'16'` → `16`).
 * 객체·배열은 재귀 적용하고, 그 외 값은 그대로 둔다.
 */
export const toRnNumeric = (v: unknown): unknown => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const s = v.trim();
    return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : v;
  }
  if (Array.isArray(v)) return v.map(toRnNumeric);
  if (isPlainObj(v)) {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) o[k] = toRnNumeric(x);
    return o;
  }
  return v;
};

/** Web: 숫자 → ms (`140` → `140ms`), 단위가 붙은 값은 그대로 */
export const toWebDuration = (v: unknown): unknown => {
  const n = toNumeric(v);
  return n === null ? v : `${n}ms`;
};

/**
 * Web fallback 서체.
 * 웹폰트가 늦거나 실패해도 한글이 기본 명조로 떨어지지 않도록
 * macOS/Windows의 기본 한글 고딕을 차례로 두고 마지막에 generic을 둔다.
 */
const WEB_FONT_FALLBACK = ["'Apple SD Gothic Neo'", "'Malgun Gothic'", 'system-ui', 'sans-serif'];

/**
 * Web: 서체 이름 → fallback 스택 (`Pretendard` → `Pretendard, 'Apple SD Gothic Neo', ...`).
 * RN은 등록된 서체 이름 하나만 받으므로 토큰에는 이름 하나만 두고, fallback은 Web 출력에서만 붙인다.
 * transitive transform이라 composite의 해석된 값에서 다시 실행되므로, 이미 스택이면 그대로 둔다.
 */
export const toWebFontStack = (v: unknown): unknown => {
  if (typeof v !== 'string' || v.trim() === '') return v;
  const name = v.trim();
  if (name.includes(',')) return name;
  const primary = /^[A-Za-z][\w-]*$/.test(name) ? name : `'${name}'`;
  return [primary, ...WEB_FONT_FALLBACK].join(', ');
};

/** Web: px → rem (`16` → `1rem`), 단위가 붙은 값은 그대로 */
export const toWebRem = (v: unknown): unknown => {
  const n = toNumeric(v);
  if (n === null) return v;
  return `${stripTrailingZeros(n / REM_BASE_PX)}rem`;
};
