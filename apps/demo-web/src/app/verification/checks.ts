/**
 * Runtime verification — 토큰이 테마별로 최종 UI까지 도달했는지 판정한다.
 *
 * 검사 단위는 **토큰 하나**가 아니라 **integration contract** 다. 토큰 값 자체의 정합성은
 * design-tokens 의 테스트가, 브라우저 최종 결과의 회귀는 Playwright 가
 * 담당한다. 여기서는 개발자가 "지금 이 실행 환경에서 무엇이 살아 있고 무엇이 끊겼는지"를
 * 몇 초 안에 판단하도록 돕는 것이 목적이다.
 */

export type Status = 'pass' | 'fail' | 'unknown';

export type CheckResult = {
  readonly id: string;
  readonly label: string;
  /** 실패 시 어느 경계를 의심해야 하는지. */
  readonly boundary: string;
  readonly status: Status;
  readonly expected?: string;
  readonly actual?: string;
};

/** 한 테마에서 실제로 계산된 값. */
export type Probe = {
  /** CSS 변수 이름 → 계산된 값. */
  readonly vars: Readonly<Record<string, string>>;
  /** 실제 React UI Button 의 배경색. */
  readonly buttonBg: string;
  /** Shared Tailwind 유틸리티가 적용된 요소의 배경색. */
  readonly tailwindBg: string;
};

/** 테마마다 값이 달라야 하는 토큰. */
const THEMED = '--ds-background-primary';
/** 테마와 무관하게 같아야 하는 토큰 — 상태색은 세 테마에서 동일하다. */
const SHARED = '--ds-background-error';
const DERIVED = '--ds-background-primary-rgb';
const BUTTON = '--ds-primary-btn-default';

/** `#RRGGBB` / `rgb(...)` 를 `"R G B"` 채널 문자열로. 판정 불가면 null. */
export const toChannels = (color: string): string | null => {
  const v = color.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(v);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
  }
  const fn = /^rgba?\(([^)]+)\)/i.exec(v);
  if (!fn) return null;
  const parts = fn[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map(Number);
  return parts.length >= 3 ? parts.slice(0, 3).join(' ') : null;
};

/** 두 색이 표기와 무관하게 같은 색인가. */
export const sameColor = (a: string, b: string): boolean => {
  const [ca, cb] = [toChannels(a), toChannels(b)];
  return ca !== null && cb !== null && ca === cb;
};

const measured = (...values: string[]) => values.every((v) => v.trim().length > 0);

const result = (
  id: string,
  label: string,
  boundary: string,
  ok: boolean,
  known: boolean,
  expected?: string,
  actual?: string,
): CheckResult => ({
  id,
  label,
  boundary,
  status: !known ? 'unknown' : ok ? 'pass' : 'fail',
  ...(expected !== undefined ? { expected } : {}),
  ...(actual !== undefined ? { actual } : {}),
});

/**
 * 두 테마를 비교해 계약별 상태를 낸다.
 * 값을 읽지 못하면 `fail` 이 아니라 `unknown` 이다 — 측정 실패를 회귀로 오인하지 않기 위함.
 */
export const runChecks = (base: Probe, other: Probe): CheckResult[] => [
  result(
    'themed',
    '테마를 바꾸면 CSS 변수가 함께 바뀝니다',
    'tokens/<theme> → 테마별 CSS 블록',
    !sameColor(base.vars[THEMED] ?? '', other.vars[THEMED] ?? ''),
    measured(base.vars[THEMED] ?? '', other.vars[THEMED] ?? ''),
    `${base.vars[THEMED]} 와 달라야 함`,
    other.vars[THEMED],
  ),
  result(
    'shared',
    '테마가 덮어쓰지 않은 토큰은 base 값을 유지합니다',
    'light 풀세트 → 테마별 deep-merge',
    sameColor(base.vars[SHARED] ?? '', other.vars[SHARED] ?? ''),
    measured(base.vars[SHARED] ?? '', other.vars[SHARED] ?? ''),
    base.vars[SHARED],
    other.vars[SHARED],
  ),
  result(
    'derived',
    '파생 RGB 채널이 색을 따릅니다',
    'genCss RGB 파생',
    (other.vars[DERIVED] ?? '').trim() === toChannels(other.vars[THEMED] ?? ''),
    measured(other.vars[DERIVED] ?? '', other.vars[THEMED] ?? ''),
    toChannels(other.vars[THEMED] ?? '') ?? '',
    other.vars[DERIVED],
  ),
  result(
    'react-ui',
    '실제 React UI 컴포넌트가 토큰을 소비합니다',
    'CSS variable → react-ui SCSS → rendered element',
    sameColor(other.buttonBg, other.vars[BUTTON] ?? ''),
    measured(other.buttonBg, other.vars[BUTTON] ?? ''),
    other.vars[BUTTON],
    other.buttonBg,
  ),
  result(
    'tailwind',
    'Shared Tailwind 유틸리티가 토큰을 따릅니다',
    'RGB 채널 변수 → Tailwind preset → utility class',
    sameColor(other.tailwindBg, other.vars[THEMED] ?? ''),
    measured(other.tailwindBg, other.vars[THEMED] ?? ''),
    other.vars[THEMED],
    other.tailwindBg,
  ),
];

/** 요약 한 줄. */
export const summarize = (results: CheckResult[]) => ({
  pass: results.filter((r) => r.status === 'pass').length,
  fail: results.filter((r) => r.status === 'fail').length,
  unknown: results.filter((r) => r.status === 'unknown').length,
  total: results.length,
});

/** probe 에서 읽어야 하는 CSS 변수 목록. */
export const PROBE_VARS = [THEMED, SHARED, DERIVED, BUTTON] as const;
