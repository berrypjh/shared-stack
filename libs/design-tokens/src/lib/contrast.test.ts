import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { compositeOver, contrastRatio, relativeLuminance, WCAG_AA } from '../../test/contrast';

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

/** 컴포넌트가 실제로 만드는 전경·배경 조합 (WCAG 1.4.3, 4.5:1) */
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
 * 장식용 구분선은 WCAG 1.4.11 대상이 아니라 3:1을 요구하지 않지만, 배경과 같은 값이면 보이지 않는다.
 * 실제로 `stroke.light`가 `background.default`와 같은 램프 단계라 light·sepia에서 대비가 1.00이었다.
 */
const DIVIDER_MIN = 1.2;

const DIVIDER_PAIRS: [string, string, string][] = [
  ['divider on page', 'color.stroke.light', 'color.background.default'],
  ['divider on surface', 'color.stroke.light', 'color.background.surface'],
  ['chrome border on page', 'color.stroke.default', 'color.background.default'],
  ['chrome border on surface', 'color.stroke.default', 'color.background.surface'],
];

/** Input이 실제로 올라앉는 표면 */
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

/** 필드 안에서 읽어야 하는 글자·아이콘 (WCAG 1.4.3, 4.5:1) */
const INPUT_TEXT = onEachSurface([
  ['value text', 'color.text.default'],
  ['adornment icon', 'color.icon.default'],
]);

/** 필드 경계와 상태 표시자 (WCAG 1.4.11, 3:1) */
const INPUT_BOUNDARIES = onEachSurface([
  ['resting border', 'color.field.border'],
  ['hover border', 'color.field.borderHover'],
  ['strong border', 'color.field.borderStrong'],
  ['error border', 'color.stroke.error'],
  ['focus border (primary)', 'border.primary.color'],
  ['focus border (secondary)', 'color.stroke.secondary'],
]);

/** disabled 필드의 값·테두리 (가시성 바닥만) */
const INPUT_DISABLED: [string, string, string][] = [
  ['disabled text on filled', 'color.text.disable', 'color.field.surface'],
  ['disabled text on subtle', 'color.text.disable', 'color.field.surfaceSubtle'],
  ['disabled border on page', 'border.disabled.color', 'color.background.default'],
  ['disabled border on subtle', 'border.disabled.color', 'color.field.surfaceSubtle'],
];

/** focus halo, 보조 장식이라 기준치 없이 보이는지만 검사 */
const INPUT_HALOS: [string, string, string][] = [
  ['primary halo on page', 'color.field.focusRingPrimary', 'color.background.default'],
  ['secondary halo on page', 'color.field.focusRing', 'color.background.default'],
  ['error halo on page', 'color.field.focusRingError', 'color.background.default'],
];

/**
 * AA에 못 미쳐 동결한 조합. 비어 있어야 정상이다.
 * 한때 placeholder·focus 테두리가 여기 있었지만, 원인이 light용 램프 단계를 다른 테마가 물려받은 것이라
 * 테마별 시맨틱 override로 해결했다. 새 팔레트가 기준에 못 미치면 여기 넣지 말고 그 테마의 시맨틱을 다시 잡는다.
 */
const BELOW_AA: [string, number, string, string][] = [];

/**
 * placeholder와 muted 아이콘 (WCAG 1.4.3, 4.5:1).
 * placeholder도 텍스트라 WCAG에 면제 조항이 없다. 값보다 흐려야 한다는 디자인 요구는 기준 완화 사유가 아니다.
 */
const PLACEHOLDER = onEachSurface([
  ['placeholder', 'color.text.placeholder'],
  ['muted icon', 'color.icon.placeholder'],
]);

/**
 * 라벨·헬퍼가 실제로 올라앉는 표면.
 * 둘은 입력 안이 아니라 위·아래에 있어 페이지나 카드가 인접색이다.
 * filled의 `field.surface`는 입력 상자의 표면이고 라벨이 그 위에 놓이지 않으므로 넣지 않는다.
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
 * 라벨·헬퍼가 상태별로 쓰는 색 (WCAG 1.4.3, 4.5:1).
 * `react-ui/input-label.scss`와 `react-native-ui/InputLabel.styles.ts`가 같은 순서
 * (disabled > error > focused > 평상시)로 고르며, 여기 있는 것이 그 분기의 전부다.
 * 필수 표시(`*`)는 라벨 색을 상속하므로(web `color: inherit`, RN 중첩 `Text`) 따로 검사하지 않는다.
 */
const FIELD_TEXT = onLabelSurface([
  ['default label', 'color.text.default'],
  ['focused label (primary)', 'color.text.primary'],
  ['focused label (secondary)', 'color.text.secondary'],
  ['error label / helper', 'color.text.error'],
  ['helper', 'color.text.light'],
]);

/**
 * 비활성 라벨·헬퍼 (WCAG 1.4.3, 4.5:1).
 * 1.4.3의 Incidental 면제는 비활성임이 드러나는 텍스트에만 닿는데, 입력의 형제인 라벨·헬퍼는 그 사실을 전달할 수단이 없다.
 * axe도 `<label for>`는 면제하지만 `aria-describedby`로만 이어진 헬퍼 `<p>`에는 4.5:1을 요구한다.
 * 입력 안의 값 텍스트는 native `disabled` 안이라 `INPUT_DISABLED`가 가시성 바닥만 검사한다.
 */
const FIELD_DISABLED = onLabelSurface([['disabled label / helper', 'color.text.disable']]);

/**
 * Button 계열의 색 역할.
 * web의 Button·IconButton·Fab은 모두 `.ui-button`을 상속해 상태 처리가 같다.
 * `error`는 공개 `ButtonColor`가 아니지만 `.ui-button--color-error` 클래스가 생성되므로 함께 검사한다.
 */
const BUTTON_COLORS = ['primary', 'secondary', 'error'] as const;

/** 컨트롤 색과 같은 이름의 전경 토큰 (`primary`, `icon` → `color.icon.primary`) */
const onSurfaceToken = (color: string, kind: 'text' | 'icon') => `color.${kind}.${color}`;

/**
 * hover 면 위의 contained 라벨 (WCAG 1.4.3, 4.5:1).
 * 평상시 면(`{c}Btn.default`)은 `TEXT_PAIRS`가 검사한다.
 */
const BUTTON_CONTAINED_HOVER: [string, string, string][] = BUTTON_COLORS.map((c) => [
  `${c} contained label on hover surface`,
  'color.text.contrastText',
  `color.${c}Btn.hover`,
]);

/**
 * hover 틴트 위의 outlined·text 라벨과 IconButton 글리프 (WCAG 1.4.3, 4.5:1).
 * 실제로 깨졌던 조합이다. `outlinedHover`가 light 램프의 가장 밝은 단계(`pr100`)라 전경까지 밝아지는
 * 어두운 테마에서 밝은 글자 위에 밝은 면이 됐다. 테마별 시맨틱 override로 고쳤고, 그 수정을 지키는 것은 이 표뿐이다.
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

/** 평상시 IconButton 글리프 (WCAG 1.4.3, 4.5:1), IconButton은 primary·secondary만 있다 */
const ICON_BUTTON_RESTING = onLabelSurface(
  (['primary', 'secondary'] as const).map((c): [string, string] => [
    `${c} icon-button glyph`,
    onSurfaceToken(c, 'icon'),
  ]),
);

/**
 * outlined 테두리이자 `:focus-visible` 링 (WCAG 1.4.11, 3:1).
 * `button-base.scss`의 `outline-border`와 `focus-ring`이 색마다 같은 토큰이라 한 표로 함께 검사한다.
 * 필드 테두리와 토큰이 같아 `INPUT_BOUNDARIES`와 겹치지만, 그 덕에 토큰을 바꾸면 버튼과 필드가 함께 실패해 영향 범위가 드러난다.
 */
const BUTTON_BOUNDARIES = onLabelSurface(
  BUTTON_COLORS.map((c): [string, string] => [
    `${c} outline border / focus ring`,
    c === 'primary' ? 'border.primary.color' : `color.stroke.${c}`,
  ]),
);

/**
 * contained 면 (가시성 바닥만, AA 요구 아님).
 * 라벨이 4.5:1을 지키는 채워진 버튼은 글자로 식별되므로 면에 1.4.11의 3:1을 요구하지 않는다.
 * 다만 면이 배경과 같은 램프 단계가 되면 버튼이 사라지므로 구분선과 같은 바닥을 건다.
 */
const BUTTON_SURFACES = onLabelSurface(
  BUTTON_COLORS.map((c): [string, string] => [`${c} contained surface`, `color.${c}Btn.default`]),
);

/**
 * 비활성 버튼 라벨 (가시성 바닥만).
 * 라벨이 native `disabled` 컨트롤 안에 있어 WCAG 1.4.3의 Incidental 면제가 닿는다 (`FIELD_DISABLED`와 다른 점).
 */
const BUTTON_DISABLED: [string, string, string][] = BUTTON_COLORS.map((c) => [
  `${c} disabled label on disabled surface`,
  'color.text.disable',
  `color.${c}Btn.disabled`,
]);

/**
 * `:focus-visible` halo (`focusRipple`·`outlinedFocusRipple`), 보이는지만 검사.
 * 포커스 표시는 outline 테두리(`BUTTON_BOUNDARIES`)가 담당하고 halo는 그 위의 보조 장식이다.
 * halo를 규정하는 WCAG 2.2 Focus Appearance(2.4.13)는 AAA라 AA 기준을 적용하지 않는다.
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
 * `background.selected`는 반투명 틴트이고 `contrastRatio`는 알파를 무시하므로, 목록 패널 표면과 합성한 뒤 잰다.
 * 목록 패널은 web·RN Select와 RN SearchField 모두 `background.surface`다.
 * 행 라벨은 `text.default`, RN SearchField 제안의 보조 설명은 `text.light`를 쓴다.
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
 * 포커스로 드러난 SkipLink의 조합.
 * 포커스를 받은 순간이 유일한 노출이라 모든 테마에서 읽혀야 한다.
 * 전용 토큰 없이 시맨틱 `background.primary`·`text.contrastText` 쌍을 쓰고,
 * 링은 버튼 포커스 링과 같은 토큰으로 페이지 배경 위에 그려진다.
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
 * Checkbox·Radio·Switch의 경계와 선택 상태 면 (WCAG 1.4.11, 3:1).
 * 컨트롤은 자기 배경 없이 페이지나 카드 위에 놓이므로 그 두 표면에서 잰다.
 * 경계·hover·error·focus는 기존 시맨틱이라 `INPUT_BOUNDARIES`·`BUTTON_BOUNDARIES`와 겹치며,
 * 그 토큰을 바꾸면 컨트롤도 함께 실패한다.
 */
const CONTROL_BOUNDARIES = onLabelSurface([
  ['unchecked boundary', 'color.field.border'],
  ['unchecked boundary on hover', 'color.field.borderHover'],
  ['error boundary', 'color.stroke.error'],
  ['focus-visible ring', 'border.primary.color'],
  ['checked surface', 'color.selectionControl.checked'],
  ['switch off track', 'color.selectionControl.trackOff'],
]);

/**
 * 체크 글리프·라디오 점·스위치 thumb (WCAG 1.4.11, 3:1).
 * 글자가 아닌 그래픽이라 3:1이고, 올라앉는 면(선택된 면, off 트랙) 위에서 잰다.
 * thumb은 위치로 상태를 말하므로 트랙과 구분되지 않으면 on/off가 사라진다.
 */
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
 * `FIELD_TEXT`와 같은 토큰이지만 선택 컨트롤이 쓰는 조합을 한 번 더 모아 둔다.
 * 비활성 라벨은 `FIELD_DISABLED`가 검사한다.
 */
const CONTROL_LABELS = onLabelSurface([
  ['control label', 'color.text.default'],
  ['radio group label (error)', 'color.text.error'],
]);

/**
 * 비활성 컨트롤 (가시성 바닥만).
 * native `disabled` 컨트롤이라 1.4.11의 비활성 면제가 닿는다. 기준에 맞추려고 비활성 색을 왜곡하지 않는다.
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
 * pressed의 정본 표현.
 * pressed는 색이 아니라 위치다. web·RN 모두 색을 그대로 둔 채 `component.pressedOffset`만큼 내리고,
 * Fab만 그 위에 elevation을 얹는다(`shadow.lg` → `xl`). 그래서 `*Btn.pressed` 같은 색 토큰은 만들지 않는다.
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
    // `primaryBtn.pressed`를 추가하려 할 때 위 결정을 다시 읽게 한다.
    expect(Object.keys(catalog.tokens).filter((p) => /^color\..*[Pp]ressed/.test(p))).toEqual([]);
  });
});
