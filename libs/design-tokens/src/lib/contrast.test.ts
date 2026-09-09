/**
 * 토큰 기본값의 접근성 보장.
 *
 * 색을 바꿔 대비가 기준 아래로 내려가면 여기서 잡힌다.
 * 실제 컴포넌트가 만드는 조합만 검사한다 — 임의 조합이 아니다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { contrastRatio, relativeLuminance, WCAG_AA } from './contrast';

const CATALOG = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../dist/tokens.json',
);
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8')) as {
  themes: string[];
  tokens: Record<string, (string | number | null)[]>;
};

const value = (tokenPath: string, theme: string): string => {
  const row = catalog.tokens[tokenPath];
  if (!row) throw new Error(`token "${tokenPath}" not found`);
  return String(row[1 + catalog.themes.indexOf(theme)]);
};

/** 컴포넌트가 실제로 만드는 전경/배경 조합. */
const TEXT_PAIRS: [string, string, string][] = [
  ['body text', 'color.text.default', 'color.background.default'],
  ['secondary text', 'color.text.light', 'color.background.default'],
  ['link', 'color.text.link', 'color.background.default'],
  ['error text', 'color.text.error', 'color.background.default'],
  ['primary button label', 'color.text.contrastText', 'color.primaryBtn.default'],
  ['secondary button label', 'color.text.contrastText', 'color.secondaryBtn.default'],
  ['error button label', 'color.text.contrastText', 'color.errorBtn.default'],
];

/**
 * 구분선이 배경에 묻히지 않는 최소 대비.
 *
 * 순수 장식 구분선은 WCAG 1.4.11 대상이 아니라 3:1 을 요구하지 않는다. 다만 배경과 같은 값이면
 * 선을 그려도 보이지 않는다 — 실제로 `stroke.light` 가 `background.default` 와 같은 ramp 단계라
 * light·sepia 에서 대비가 1.00 이었다. 눈에 보이는 최소선을 가드로 고정한다.
 */
const DIVIDER_MIN = 1.2;

const DIVIDER_PAIRS: [string, string, string][] = [
  ['divider on page', 'color.stroke.light', 'color.background.default'],
  ['divider on surface', 'color.stroke.light', 'color.background.surface'],
  ['chrome border on page', 'color.stroke.default', 'color.background.default'],
  ['chrome border on surface', 'color.stroke.default', 'color.background.surface'],
];

/**
 * Input 이 실제로 올라앉는 표면.
 *
 * plain·boxed 는 배경이 투명해서 뒤에 있는 페이지나 카드가 그대로 인접색이 된다.
 * filled 만 자기 표면을 가진다. 세 가지 모두 실제 조합이라 전부 본다.
 */
const FIELD_SURFACES: [string, string][] = [
  ['page', 'color.background.default'],
  ['card', 'color.background.surface'],
  ['filled', 'color.field.surface'],
];

const onEachSurface = (rows: [string, string][]): [string, string, string][] =>
  rows.flatMap(([name, token]) =>
    FIELD_SURFACES.map(([surface, bg]): [string, string, string] => [
      `${name} on ${surface}`,
      token,
      bg,
    ]),
  );

/** 필드 안에서 읽어야 하는 것 (WCAG 1.4.3, 4.5:1). */
const INPUT_TEXT = onEachSurface([
  ['value text', 'color.text.default'],
  ['adornment icon', 'color.icon.default'],
]);

/**
 * 필드 경계와 상태 표시자 (WCAG 1.4.11, 3:1).
 *
 * focus 표시는 **테두리 색 변화**가 담당한다 — halo 는 그 위에 얹는 보조 장식이라 여기 없다.
 * WCAG 2.2 의 Focus Appearance(2.4.13)는 AAA 라서 halo 에 AA 기준을 적용하지 않는다.
 */
const INPUT_BOUNDARIES = onEachSurface([
  ['resting border', 'color.field.border'],
  ['hover border', 'color.field.borderHover'],
  ['strong border', 'color.field.borderStrong'],
  ['error border', 'color.stroke.error'],
]);

/**
 * disabled 필드.
 *
 * WCAG 1.4.3·1.4.11 은 비활성 컨트롤을 명시적으로 면제한다 — 여기를 AA 실패로 적으면
 * 기준을 잘못 인용하는 것이다. 다만 배경에 완전히 묻히면 필드가 있다는 사실 자체가 사라지므로
 * 구분선과 같은 가시성 바닥만 건다.
 */
const INPUT_DISABLED: [string, string, string][] = [
  ['disabled text on filled', 'color.text.disable', 'color.field.surface'],
  ['disabled text on subtle', 'color.text.disable', 'color.field.surfaceSubtle'],
  ['disabled border on page', 'border.disabled.color', 'color.background.default'],
  ['disabled border on subtle', 'border.disabled.color', 'color.field.surfaceSubtle'],
];

/** focus halo. 보조 장식이라 기준치가 아니라 "보이는가"만 본다. */
const INPUT_HALOS: [string, string, string][] = [
  ['primary halo on page', 'color.field.focusRingPrimary', 'color.background.default'],
  ['secondary halo on page', 'color.field.focusRing', 'color.background.default'],
  ['error halo on page', 'color.field.focusRingError', 'color.background.default'],
];

/**
 * 아직 AA 에 못 미치는 조합. **면제가 아니라 미해결 결함이다.**
 *
 * 원인이 전부 field 밖 토큰이라 여기서 고치면 버튼·링크까지 같이 움직인다:
 * - `text.placeholder`·`icon.placeholder` = `{neutral.ne500}` — frost 램프 간격이 좁다
 * - `border.primary.color` — amber primary 램프
 * - `stroke.secondary` — light 계열 secondary 램프
 *
 * 값을 지어내지 않고, 대신 **현재 값을 바닥으로 못 박아** 더 나빠지는 것만 막는다.
 * 기준을 올려 고치면 이 목록에서 빼야 한다.
 */
const BELOW_AA: [string, number, string, string][] = [
  ['placeholder on page', 4.2, 'color.text.placeholder', 'color.background.default'],
  ['placeholder on filled', 3.8, 'color.text.placeholder', 'color.field.surface'],
  ['muted icon on page', 4.2, 'color.icon.placeholder', 'color.background.default'],
  ['muted icon on filled', 3.8, 'color.icon.placeholder', 'color.field.surface'],
  ['primary focus border on page', 2.8, 'border.primary.color', 'color.background.default'],
  ['primary focus border on filled', 2.6, 'border.primary.color', 'color.field.surface'],
  ['secondary focus border on page', 2.8, 'color.stroke.secondary', 'color.background.default'],
  ['secondary focus border on filled', 2.6, 'color.stroke.secondary', 'color.field.surface'],
];

/** placeholder 는 카드 위에서는 AA 를 넘긴다 — 회귀 방지로 남긴다. */
const INPUT_TEXT_ON_CARD: [string, string, string][] = [
  ['placeholder on card', 'color.text.placeholder', 'color.background.surface'],
  ['muted icon on card', 'color.icon.placeholder', 'color.background.surface'],
];

describe('contrastRatio', () => {
  it('matches the WCAG reference extremes', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 2);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('is order independent', () => {
    expect(contrastRatio('#047857', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#047857'), 9);
  });

  it('ignores the alpha channel of an 8-digit hex', () => {
    expect(relativeLuminance('#10B98114')).toBeCloseTo(relativeLuminance('#10B981'), 9);
  });

  it('expands 3-digit hex', () => {
    expect(relativeLuminance('#FFF')).toBeCloseTo(relativeLuminance('#FFFFFF'), 9);
  });
});

describe.each(catalog.themes)('WCAG AA — %s theme', (theme) => {
  it.each(TEXT_PAIRS)('%s reaches 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(WCAG_AA.text);
  });

  it.each(DIVIDER_PAIRS)('%s stays visible', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(DIVIDER_MIN);
  });
});

describe.each(catalog.themes)('Input surfaces — %s theme', (theme) => {
  it.each([...INPUT_TEXT, ...INPUT_TEXT_ON_CARD])('%s reaches 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(WCAG_AA.text);
  });

  it.each(INPUT_BOUNDARIES)('%s reaches 3:1', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(
      WCAG_AA.nonText,
    );
  });

  it.each(INPUT_DISABLED)('%s stays visible', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(DIVIDER_MIN);
  });

  it.each(INPUT_HALOS)('%s stays visible', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThan(1);
  });

  it.each(BELOW_AA)('%s holds at %s:1 (still below AA)', (_label, floor, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(floor);
  });
});
