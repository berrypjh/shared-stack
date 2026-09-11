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

import { compositeOver, contrastRatio, relativeLuminance, WCAG_AA } from './contrast';

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

/**
 * Button 계열이 실제로 만드는 색 조합.
 *
 * web 은 Button·IconButton·Fab 이 모두 `.ui-button` 을 상속해 상태 처리가 같다. `error` 는
 * 공개 `ButtonColor` 가 아니지만 `.ui-button--color-error` 클래스가 실제로 생성되므로 함께
 * 본다 — 토큰·CSS 가 있다는 것과 prop 을 여는 것은 다른 이야기다.
 */
const BUTTON_COLORS = ['primary', 'secondary', 'error'] as const;

/** 컨트롤 색과 같은 이름의 전경 토큰. IconButton 은 `icon.*`, 나머지는 `text.*` 를 쓴다. */
const onSurfaceToken = (color: string, kind: 'text' | 'icon') => `color.${kind}.${color}`;

/**
 * contained 라벨은 **hover 면 위에서도** 읽혀야 한다 (WCAG 1.4.3, 4.5:1).
 *
 * 평상시 면(`{c}Btn.default`)은 `TEXT_PAIRS` 가 이미 본다. 여기는 hover 로 면이 바뀐 뒤다.
 */
const BUTTON_CONTAINED_HOVER: [string, string, string][] = BUTTON_COLORS.map((c) => [
  `${c} contained label on hover surface`,
  'color.text.contrastText',
  `color.${c}Btn.hover`,
]);

/**
 * outlined·text 라벨과 IconButton 글리프는 **hover 틴트 위에서** 읽혀야 한다 (1.4.3, 4.5:1).
 *
 * 실제로 깨졌던 자리다. `outlinedHover` 는 light 램프의 가장 밝은 단계(`pr100`)라서, 전경
 * `text.*` 까지 밝아지는 어두운 테마에서 밝은 글자 위에 밝은 면이 됐다. 테마별 시맨틱
 * override 로 고쳤고 — 그 수정을 지키는 것은 이 표뿐이다.
 */
const BUTTON_HOVER_TINT: [string, string, string][] = [
  ...BUTTON_COLORS.map((c): [string, string, string] => [
    `${c} outlined/text label on hover tint`,
    onSurfaceToken(c, 'text'),
    `color.${c}Btn.outlinedHover`,
  ]),
  ...(['primary', 'secondary'] as const).map((c): [string, string, string] => [
    `${c} icon-button glyph on hover tint`,
    onSurfaceToken(c, 'icon'),
    `color.${c}Btn.outlinedHover`,
  ]),
];

/** IconButton 글리프가 평상시 올라앉는 면 (1.4.3, 4.5:1). IconButton 은 primary·secondary 뿐이다. */
const ICON_BUTTON_RESTING = onLabelSurface(
  (['primary', 'secondary'] as const).map((c): [string, string] => [
    `${c} icon-button glyph`,
    onSurfaceToken(c, 'icon'),
  ]),
);

/**
 * outlined 테두리이자 `:focus-visible` 링 (WCAG 1.4.11, 3:1).
 *
 * 두 역할이 같은 토큰을 쓴다 — `button-base.scss` 의 `outline-border` 와 `focus-ring` 이
 * 색마다 같은 값이다. 그래서 한 표로 둘을 함께 고정한다.
 *
 * 같은 토큰이 필드 테두리도 받치므로 `INPUT_BOUNDARIES` 와 겹친다. 겹치는 것이 맞다 —
 * `stroke.secondary` 를 건드리면 버튼과 필드가 **함께** 빨개져 영향 범위가 드러난다.
 */
const BUTTON_BOUNDARIES = onLabelSurface(
  BUTTON_COLORS.map((c): [string, string] => [
    `${c} outline border / focus ring`,
    c === 'primary' ? 'border.primary.color' : `color.stroke.${c}`,
  ]),
);

/**
 * contained 면이 배경에 완전히 묻히지 않는 바닥.
 *
 * **AA 요구가 아니다.** 라벨이 4.5:1 을 지키는 채워진 버튼은 테두리가 아니라 글자로 식별되므로
 * 1.4.11 의 3:1 을 면에 그대로 요구하는 것은 기준을 지어내는 것이다. 다만 면이 배경과 같은
 * 램프 단계로 미끄러지면 버튼이 사라지므로, 구분선과 같은 가시성 바닥만 건다.
 */
const BUTTON_SURFACES = onLabelSurface(
  BUTTON_COLORS.map((c): [string, string] => [`${c} contained surface`, `color.${c}Btn.default`]),
);

/**
 * 비활성 버튼.
 *
 * 라벨은 native `disabled` 인 컨트롤 **안**에 있어서 WCAG 1.4.3 의 Incidental 면제가 실제로
 * 닿는다 (필드 바깥의 형제 헬퍼와 다른 점이다 — `FIELD_DISABLED` 주석 참조). 그러므로 AA 가
 * 아니라 가시성 바닥만 본다.
 */
const BUTTON_DISABLED: [string, string, string][] = BUTTON_COLORS.map((c) => [
  `${c} disabled label on disabled surface`,
  'color.text.disable',
  `color.${c}Btn.disabled`,
]);

/**
 * `:focus-visible` halo (`focusRipple`·`outlinedFocusRipple`).
 *
 * 포커스 **표시**는 outline 테두리가 담당하고(`BUTTON_BOUNDARIES`), halo 는 그 위의 보조
 * 장식이다. halo 두께·대비를 규정하는 WCAG 2.2 Focus Appearance(2.4.13)는 **AAA** 라서
 * AA 기준을 적용하지 않는다. 여기서는 "보이기는 하는가"만 본다.
 */
const BUTTON_HALOS = onLabelSurface(
  BUTTON_COLORS.flatMap((c): [string, string][] => [
    [`${c} solid focus halo`, `color.${c}Btn.focusRipple`],
    [`${c} outlined focus halo`, `color.${c}Btn.outlinedFocusRipple`],
  ]),
);

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

describe.each(catalog.themes)('Button family — %s theme', (theme) => {
  it.each([...BUTTON_CONTAINED_HOVER, ...BUTTON_HOVER_TINT, ...ICON_BUTTON_RESTING])(
    '%s reaches 4.5:1',
    (_label, fg, bg) => {
      expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(
        WCAG_AA.text,
      );
    },
  );

  it.each(BUTTON_BOUNDARIES)('%s reaches 3:1', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(
      WCAG_AA.nonText,
    );
  });

  it.each([...BUTTON_SURFACES, ...BUTTON_DISABLED])('%s stays visible', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(DIVIDER_MIN);
  });

  it.each(BUTTON_HALOS)('%s stays visible', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThan(1);
  });
});

describe('compositeOver', () => {
  it('blends a translucent colour over an opaque background', () => {
    expect(compositeOver('#00000080', '#FFFFFF')).toBe('#7f7f7f');
  });

  it('returns an opaque colour unchanged', () => {
    expect(compositeOver('#123456', '#FFFFFF')).toBe('#123456');
  });
});

/**
 * 선택된 목록 행 위의 글자 (WCAG 1.4.3, 4.5:1).
 *
 * `background.selected` 는 반투명 틴트(`#RRGGBBAA`)라서 **올라앉은 표면과 합성한 뒤** 잰다 —
 * `contrastRatio` 는 알파를 무시하므로 그대로 넣으면 틴트 원색과 재는 셈이 된다.
 * 목록 패널은 web·RN Select 와 RN SearchField 모두 `background.surface` 다. 행 라벨은
 * `text.default`, RN SearchField 제안의 보조 설명은 `text.light` 다.
 */
const SELECTED_ROW_TEXT: [string, string][] = [
  ['selected row label', 'color.text.default'],
  ['selected row description', 'color.text.light'],
];

describe.each(catalog.themes)('Selected list row — %s theme', (theme) => {
  const row = compositeOver(
    value('color.background.selected', theme),
    value('color.background.surface', theme),
  );

  it.each(SELECTED_ROW_TEXT)('%s reaches 4.5:1', (_label, fg) => {
    expect(contrastRatio(value(fg, theme), row)).toBeGreaterThanOrEqual(WCAG_AA.text);
  });
});

/**
 * SkipLink 가 포커스를 받아 드러났을 때의 조합.
 *
 * 이 컴포넌트는 포커스 전까지 숨어 있다가 포커스에서만 나타난다 — 드러난 그 순간이
 * 유일한 노출이라 모든 테마에서 읽혀야 한다. 전용 토큰을 만들지 않고 시맨틱
 * `background.primary` / `text.contrastText` 쌍을 그대로 쓰므로, 그 쌍이 실제로 기준을
 * 넘는지 여기서 못박는다. 링은 버튼 포커스 링과 같은 토큰이고 페이지 배경 위에 그려진다.
 */
describe.each(catalog.themes)('SkipLink — %s theme', (theme) => {
  it('드러난 라벨이 4.5:1 을 넘는다', () => {
    expect(
      contrastRatio(
        value('color.text.contrastText', theme),
        value('color.background.primary', theme),
      ),
    ).toBeGreaterThanOrEqual(WCAG_AA.text);
  });

  it('포커스 링이 페이지 배경 위에서 3:1 을 넘는다', () => {
    expect(
      contrastRatio(value('border.primary.color', theme), value('color.background.default', theme)),
    ).toBeGreaterThanOrEqual(WCAG_AA.nonText);
  });
});

/**
 * Checkbox·Radio·Switch 가 만드는 조합 (WCAG 1.4.11, 3:1).
 *
 * 컨트롤은 입력 옆 라벨처럼 페이지나 카드 위에 놓인다 — 자기 배경이 없으므로 그 두 표면이
 * 인접색이다. 경계·선택된 면·off 트랙은 "컴포넌트와 상태를 식별하는 시각 정보"라 3:1 이다.
 * 체크 글리프·라디오 점·스위치 thumb 은 글자가 아니라 그래픽이라 4.5 가 아니라 3:1 이고,
 * 올라앉는 면(선택된 면, off 트랙) 위에서 잰다. thumb 은 위치로 상태를 말하므로 트랙과
 * 구분되지 않으면 on/off 가 사라진다.
 *
 * 경계·hover·error·focus 는 기존 시맨틱을 그대로 쓰므로 `INPUT_BOUNDARIES`·
 * `BUTTON_BOUNDARIES` 와 겹친다. 겹치는 것이 맞다 — 그 토큰을 건드리면 컨트롤도 함께 빨개진다.
 */
const CONTROL_BOUNDARIES = onLabelSurface([
  ['unchecked boundary', 'color.field.border'],
  ['unchecked boundary on hover', 'color.field.borderHover'],
  ['error boundary', 'color.stroke.error'],
  ['focus-visible ring', 'border.primary.color'],
  ['checked surface', 'color.selectionControl.checked'],
  ['switch off track', 'color.selectionControl.trackOff'],
]);

const CONTROL_INDICATORS: [string, string, string][] = [
  [
    'check glyph / radio dot / thumb on checked surface',
    'color.selectionControl.indicator',
    'color.selectionControl.checked',
  ],
  ['thumb on off track', 'color.selectionControl.indicator', 'color.selectionControl.trackOff'],
];

/**
 * 컨트롤 라벨과 그룹 라벨 (WCAG 1.4.3, 4.5:1).
 *
 * 라벨은 컨트롤 옆 글자라 `FIELD_TEXT` 와 같은 토큰이다. 선택 컨트롤이 실제로 쓰는 글자 조합을
 * 이 표에 한 번 더 모아 둔다 — 라벨 색을 바꾸면 여기와 필드 표가 함께 빨개진다.
 * 비활성 라벨은 `FIELD_DISABLED` 가 이미 본다. 면제를 여기서 따로 다루지 않는다.
 */
const CONTROL_LABELS = onLabelSurface([
  ['control label', 'color.text.default'],
  ['radio group label (error)', 'color.text.error'],
]);

/**
 * 비활성 컨트롤.
 *
 * native `disabled` 인 컨트롤 자체라 1.4.11 의 비활성 면제가 닿는다. 기준치가 아니라
 * 필드·버튼과 같은 가시성 바닥만 본다 — 기준에 맞추려고 비활성 색을 왜곡하지 않는다.
 */
const CONTROL_DISABLED: [string, string, string][] = [
  ...onLabelSurface([
    ['disabled boundary', 'border.disabled.color'],
    ['disabled checked surface / track', 'color.background.disable'],
  ]),
  ['indicator on disabled surface', 'color.selectionControl.indicator', 'color.background.disable'],
];

describe.each(catalog.themes)('Selection control — %s theme', (theme) => {
  it.each([...CONTROL_BOUNDARIES, ...CONTROL_INDICATORS])('%s reaches 3:1', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(
      WCAG_AA.nonText,
    );
  });

  it.each(CONTROL_LABELS)('%s reaches 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(WCAG_AA.text);
  });

  it.each(CONTROL_DISABLED)('%s stays visible', (_label, fg, bg) => {
    expect(contrastRatio(value(fg, theme), value(bg, theme))).toBeGreaterThanOrEqual(DIVIDER_MIN);
  });
});

/**
 * pressed 의 정본 표현.
 *
 * 이 디자인 시스템에서 pressed 는 **색이 아니라 위치**다. web `.ui-button:active` 는 색을
 * 그대로 두고 `translateY` 만 주고, Fab 만 그 위에 elevation 을 얹는다(`shadow.lg` → `xl`).
 * 그래서 `*Btn.pressed` **색** 토큰을 만들면 web 에 없는 시각을 RN 에 지어내는 셈이 된다.
 *
 * 대신 눌림 깊이를 토큰이 갖는다 — web 이 `button-base.scss` 에 하드코딩하던 자리이자,
 * RN Button·IconButton 이 아직 갖지 못한 값이다.
 */
describe('pressed 상태 어휘', () => {
  it('눌림 깊이를 토큰이 소유한다', () => {
    expect(catalog.tokens['component.pressedOffset']).toBeDefined();
  });

  it('테마를 타지 않는다 — 눌림 깊이는 팔레트가 아니라 제스처다', () => {
    const [, ...values] = catalog.tokens['component.pressedOffset'];

    expect(values).toHaveLength(catalog.themes.length);
    expect(new Set(values).size).toBe(1);
  });

  it('pressed 를 색 토큰으로 표현하지 않는다', () => {
    // 나중에 `primaryBtn.pressed` 를 더하려는 사람이 이 결정을 다시 읽게 만든다.
    expect(Object.keys(catalog.tokens).filter((p) => /^color\..*[Pp]ressed/.test(p))).toEqual([]);
  });
});
