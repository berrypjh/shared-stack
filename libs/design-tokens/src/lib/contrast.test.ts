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
  ['focus border (primary)', 'border.primary.color'],
  ['focus border (secondary)', 'color.stroke.secondary'],
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
 * **비어 있어야 정상이다.**
 *
 * 한때 placeholder·focus 테두리가 여기 얼어 있었다. 원인은 전부 "light 테마용 램프 단계를
 * 다른 테마가 그대로 물려받았다" 였고, 테마별 시맨틱 override 로 해결했다. 새 팔레트가
 * 기준에 못 미치면 여기 넣어 동결하지 말고 **그 테마의 시맨틱을 다시 잡는다** — 동결은
 * 기준을 낮추는 것이지 지키는 것이 아니다.
 */
const BELOW_AA: [string, number, string, string][] = [];

/**
 * placeholder 도 그냥 텍스트다 — WCAG 에 면제 조항이 없다.
 *
 * 값 텍스트보다 흐려야 한다는 것은 디자인 요구이지 기준 완화 사유가 아니라서, 세 표면
 * 모두에서 다른 텍스트와 같은 4.5:1 을 건다.
 */
const PLACEHOLDER = onEachSurface([
  ['placeholder', 'color.text.placeholder'],
  ['muted icon', 'color.icon.placeholder'],
]);

/**
 * 라벨과 헬퍼가 실제로 올라앉는 표면.
 *
 * 둘은 입력 **안**이 아니라 입력 위·아래에 있다 — 뒤에 있는 페이지나 카드가 인접색이다.
 * `field.surface` 는 여기 없다: filled variant 의 표면은 입력 상자의 것이고 라벨이 그 위에
 * 놓이지 않는다. 없는 조합을 검사하면 기준을 지어내는 것이다.
 */
const LABEL_SURFACES: [string, string][] = [
  ['page', 'color.background.default'],
  ['card', 'color.background.surface'],
];

const onLabelSurface = (rows: [string, string][]): [string, string, string][] =>
  rows.flatMap(([name, token]) =>
    LABEL_SURFACES.map(([surface, bg]): [string, string, string] => [
      `${name} on ${surface}`,
      token,
      bg,
    ]),
  );

/**
 * 라벨·헬퍼가 각 상태에서 실제로 쓰는 색 (WCAG 1.4.3, 4.5:1).
 *
 * 상태별 색은 `react-ui/input-label.scss` 와 `react-native-ui/InputLabel.styles.ts` 가 같은
 * 순서(disabled > error > focused > 평상시)로 고른다. 여기 있는 것이 그 분기의 전부다.
 *
 * 필수 표시(`*`)는 라벨 색을 그대로 상속한다 (`.ui-input-label__asterisk { color: inherit }`,
 * RN 은 중첩 `Text`). 자기 색이 없으므로 따로 검사할 조합도, 새 토큰도 없다.
 */
const FIELD_TEXT = onLabelSurface([
  ['default label', 'color.text.default'],
  ['focused label (primary)', 'color.text.primary'],
  ['focused label (secondary)', 'color.text.secondary'],
  ['error label / helper', 'color.text.error'],
  ['helper', 'color.text.light'],
]);

/**
 * 비활성 라벨·헬퍼는 **AA 를 실제로 지켜야 한다.**
 *
 * WCAG 2.2 의 1.4.3 은 비활성 컨트롤에 속한 텍스트를 Incidental 로 면제하지만, 그 면제는
 * **비활성이라는 사실이 드러나는 텍스트**에만 닿는다. 라벨과 헬퍼는 입력의 형제일 뿐이라
 * 그 사실을 프로그래밍적으로 말하는 수단이 없다 — 실제로 axe 는 `<label for>` 이 비활성
 * 컨트롤을 가리키면 면제하지만, `aria-describedby` 로만 이어진 헬퍼 `<p>` 는 면제하지 않고
 * 4.5:1 을 요구한다. 사람 눈에도 마찬가지다: 옆 입력이 비활성이라는 것을 알기 전까지 그
 * 문단은 그냥 읽어야 하는 글이다.
 *
 * 입력 **안**의 값 텍스트는 다르다 — native `disabled` 안에 있어서 도구도 사람도 비활성임을
 * 알 수 있다. 그쪽은 `INPUT_DISABLED` 가 가시성 바닥만 건다.
 */
const FIELD_DISABLED = onLabelSurface([['disabled label / helper', 'color.text.disable']]);

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
  it.each([...INPUT_TEXT, ...PLACEHOLDER])('%s reaches 4.5:1', (_label, fg, bg) => {
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

  it('carries no frozen sub-AA debt', () => {
    expect(BELOW_AA).toEqual([]);
  });
});

describe.each(catalog.themes)('Field label and helper — %s theme', (theme) => {
  it.each(FIELD_TEXT)('%s reaches 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(WCAG_AA.text);
  });

  it.each(FIELD_DISABLED)('%s reaches 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(WCAG_AA.text);
  });
});
