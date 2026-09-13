import type { DesignSystemSignal, SourceRef } from '@berrypjh/observability-contracts';

/**
 * 한정된 상태 셀. Button 계열·field·selection control 의 pressed·focus·size·reduced-motion 만 다룬다.
 * 전체 상태를 자동으로 덮지 않고, 공개 컴포넌트 수를 분모로 쓰지 않는다.
 *
 * 셀은 **위치**를 찾을 뿐이다. 소비 패턴이 source 에 있다는 것은 behavior 통과가 아니고,
 * test 위치는 실행 결과 없이 `not-run` 으로 싣는다.
 */

type Platform = DesignSystemSignal['platform'];
type State = DesignSystemSignal['state'];
type Locator = { path: string; pattern: string };
type TestLocator = Locator & { evidenceKind: 'behavior-assertion' | 'source-assertion' };

export type CellSpec = {
  component: string;
  platform: Platform;
  state: State;
  token: string | null;
  /** 색이 아닌 텍스트 설명. */
  label: string;
  consumed?: Locator;
  /** 소비가 다른 컴포넌트를 거치는 연결. */
  via?: Locator;
  test?: TestLocator;
  /** 이 token 이 아닌 다른 방식으로 표현하는 상태. */
  notApplicable?: string;
  /** 근거를 찾지 못한 셀의 이유. */
  unknownReason?: string;
};

const UI = 'libs/react-ui/src/components';
const RN = 'libs/react-native-ui/src/components';

const PRESSED = 'component.pressedOffset';
const HEIGHT_SM = 'component.field.height.sm';
const HEIGHT_MD = 'component.field.height.md';
const FOCUS_RING = 'component.field.focusRingWidth';

const PRESSED_LABEL = '눌림: 색은 그대로, pressedOffset 만큼 아래로 이동';
const FAB_PRESSED_LABEL = '눌림: 오프셋 대신 그림자(elevation) 상승';
const FAB_REASON =
  'Fab 은 눌림을 pressedOffset 이 아니라 elevation(shadow.lg → shadow.xl)으로 표현한다';
const REDUCED_LABEL = '동작 줄이기: 전환을 끄고 포커스 표시는 유지';
const REDUCED_TITLE = "it('reduced-motion 은 전환만 끄고 포커스 표시는 건드리지 않는다'";
const RN_FOCUS_UNKNOWN = 'RN source 에서 선택 컨트롤의 포커스 표현 근거를 찾지 못했다';
const RN_REDUCED_UNKNOWN = 'RN source 에서 reduced-motion 처리 근거를 찾지 못했다';

const sizeCells = (component: string, web: string, rn: string, rnTest?: TestLocator): CellSpec[] =>
  (
    [
      ['size-sm', HEIGHT_SM, 'sm'],
      ['size-md', HEIGHT_MD, 'md'],
    ] as const
  ).flatMap(([state, token, size]) => [
    {
      component,
      platform: 'web',
      state,
      token,
      label: `${size} 크기: 필드 최소 높이 field.height.${size}`,
      consumed: { path: web, pattern: `min-height: var(--ds-component-field-height-${size})` },
    },
    {
      component,
      platform: 'react-native',
      state,
      token,
      label: `${size} 크기: 필드 최소 높이 field.height.${size}`,
      consumed: {
        path: rn,
        pattern: `fieldHeight: ${component === 'Select' ? 'tokens.' : ''}component.field.height.${size}`,
      },
      ...(rnTest ? { test: rnTest } : {}),
    },
  ]);

const selectionCells = (
  component: string,
  file: string,
  testFile: string,
  rnReducedMotion: Partial<CellSpec> = { unknownReason: RN_REDUCED_UNKNOWN },
): CellSpec[] => [
  {
    component,
    platform: 'web',
    state: 'focus-visible',
    token: FOCUS_RING,
    label: '키보드 포커스: field.focusRingWidth 두께의 외곽선',
    consumed: {
      path: `${UI}/${file}/${file}.scss`,
      pattern:
        'outline: var(--ds-component-field-focus-ring-width) solid var(--ds-border-primary-color)',
    },
  },
  {
    component,
    platform: 'web',
    state: 'reduced-motion',
    token: null,
    label: REDUCED_LABEL,
    consumed: {
      path: `${UI}/${file}/${file}.scss`,
      pattern: '@media (prefers-reduced-motion: reduce)',
    },
    test: {
      path: `${UI}/${file}/${testFile}`,
      pattern: REDUCED_TITLE,
      evidenceKind: 'source-assertion',
    },
  },
  {
    component,
    platform: 'react-native',
    state: 'focus-visible',
    token: FOCUS_RING,
    label: '키보드 포커스 표시',
    unknownReason: RN_FOCUS_UNKNOWN,
  },
  {
    component,
    platform: 'react-native',
    state: 'reduced-motion',
    token: null,
    label: REDUCED_LABEL,
    ...rnReducedMotion,
  },
];

export const STATE_CELLS: CellSpec[] = [
  {
    component: 'Button',
    platform: 'web',
    state: 'pressed',
    token: PRESSED,
    label: PRESSED_LABEL,
    consumed: {
      path: `${UI}/button-base/button-base.scss`,
      pattern: 'transform: translateY(var(--ds-component-pressed-offset))',
    },
    via: { path: `${UI}/button/Button.tsx`, pattern: "from '../button-base'" },
  },
  {
    component: 'IconButton',
    platform: 'web',
    state: 'pressed',
    token: PRESSED,
    label: PRESSED_LABEL,
    consumed: {
      path: `${UI}/button-base/button-base.scss`,
      pattern: 'transform: translateY(var(--ds-component-pressed-offset))',
    },
    via: { path: `${UI}/icon-button/IconButton.tsx`, pattern: "from '../button-base'" },
  },
  {
    component: 'Fab',
    platform: 'web',
    state: 'pressed',
    token: PRESSED,
    label: FAB_PRESSED_LABEL,
    consumed: { path: `${UI}/fab/fab.scss`, pattern: 'box-shadow: var(--ui-fab-shadow-active)' },
    notApplicable: FAB_REASON,
  },
  {
    component: 'Button',
    platform: 'react-native',
    state: 'pressed',
    token: PRESSED,
    label: PRESSED_LABEL,
    consumed: {
      path: `${RN}/button/Button.styles.ts`,
      pattern: 'pressed: { transform: [{ translateY: tokens.component.pressedOffset }] }',
    },
    test: {
      path: `${RN}/button/Button.test.tsx`,
      pattern:
        'expect(button()).toHaveStyle({ transform: [{ translateY: t.component.pressedOffset }] })',
      evidenceKind: 'behavior-assertion',
    },
  },
  {
    component: 'IconButton',
    platform: 'react-native',
    state: 'pressed',
    token: PRESSED,
    label: PRESSED_LABEL,
    consumed: {
      path: `${RN}/icon-button/IconButton.styles.ts`,
      pattern:
        '...(pressed ? { transform: [{ translateY: tokens.component.pressedOffset }] } : null)',
    },
    test: {
      path: `${RN}/icon-button/IconButton.test.tsx`,
      pattern:
        'expect(surface()).toHaveStyle({ transform: [{ translateY: t.component.pressedOffset }] })',
      evidenceKind: 'behavior-assertion',
    },
  },
  {
    component: 'Fab',
    platform: 'react-native',
    state: 'pressed',
    token: PRESSED,
    label: FAB_PRESSED_LABEL,
    consumed: {
      path: `${RN}/fab/Fab.styles.ts`,
      pattern: 'toBoxShadow(pressed ? tokens.shadow.xl : tokens.shadow.lg)',
    },
    test: {
      path: `${RN}/fab/Fab.test.tsx`,
      pattern: "it('눌림을 오프셋이 아니라 elevation 으로 표현한다'",
      evidenceKind: 'behavior-assertion',
    },
    notApplicable: FAB_REASON,
  },
  ...sizeCells(
    'InputBase',
    `${UI}/input-base/input-base.scss`,
    `${RN}/input-base/InputBase.styles.ts`,
    {
      path: `${RN}/input-base/InputBase.styles.test.ts`,
      pattern: "Math.max(T.component.field.height[size], T.spacing['4xl'])",
      evidenceKind: 'behavior-assertion',
    },
  ),
  ...sizeCells('Select', `${UI}/select/select.scss`, `${RN}/select/Select.styles.ts`),
  {
    component: 'BoxedInput',
    platform: 'web',
    state: 'focus-visible',
    token: FOCUS_RING,
    label: '포커스: field.focusRingWidth 두께의 halo',
    consumed: {
      path: `${UI}/boxed-input/boxed-input.scss`,
      pattern:
        'box-shadow: 0 0 0 var(--ds-component-field-focus-ring-width) var(--ui-input-focus-halo)',
    },
  },
  {
    component: 'FilledInput',
    platform: 'web',
    state: 'focus-visible',
    token: FOCUS_RING,
    label: '포커스: field.focusRingWidth 두께의 halo',
    consumed: {
      path: `${UI}/filled-input/filled-input.scss`,
      pattern:
        'box-shadow: 0 0 0 var(--ds-component-field-focus-ring-width) var(--ui-input-focus-halo)',
    },
  },
  {
    component: 'Select',
    platform: 'web',
    state: 'focus-visible',
    token: FOCUS_RING,
    label: '포커스: field.focusRingWidth 두께의 링',
    consumed: {
      path: `${UI}/select/select.scss`,
      pattern:
        'box-shadow: 0 0 0 var(--ds-component-field-focus-ring-width) var(--ui-select-focus-ring)',
    },
  },
  {
    component: 'InputBase',
    platform: 'react-native',
    state: 'focus-visible',
    token: FOCUS_RING,
    label: '포커스: 테두리 두께가 field.focusRingWidth 로 바뀜',
    consumed: {
      path: `${RN}/input-base/InputBase.styles.ts`,
      pattern:
        'focused && !disabled ? tokens.component.field.focusRingWidth : tokens.border.primary.width',
    },
    test: {
      path: `${RN}/input-base/InputBase.styles.test.ts`,
      pattern: "['focused', { focused: true }, () => T.component.field.focusRingWidth]",
      evidenceKind: 'behavior-assertion',
    },
  },
  {
    component: 'Select',
    platform: 'react-native',
    state: 'focus-visible',
    token: FOCUS_RING,
    label: '포커스: 테두리 두께가 field.focusRingWidth 로 바뀜',
    consumed: {
      path: `${RN}/select/Select.styles.ts`,
      pattern:
        'focused && !disabled ? tokens.component.field.focusRingWidth : tokens.border.primary.width',
    },
  },
  ...selectionCells('Checkbox', 'checkbox', 'Checkbox.test.tsx'),
  ...selectionCells('Radio', 'radio', 'Radio.test.tsx'),
  ...selectionCells('Switch', 'switch', 'Switch.test.tsx', {
    consumed: {
      path: `${RN}/switch/Switch.tsx`,
      pattern: 'reduced-motion 을 끄는 API 는 core Switch 에 없다',
    },
    notApplicable:
      'RN core Switch 의 애니메이션은 native 것이고 reduced-motion 을 끄는 API 가 없다 (Switch.tsx 주석)',
  }),
];

const findLine = (text: string | null, pattern: string): number | null => {
  const index = text?.split('\n').findIndex((line) => line.includes(pattern)) ?? -1;
  return index === -1 ? null : index + 1;
};

const CALL_START = /^\s*(?:it|test)(?:\.each)?\s*\(/;
/** 호출 시작부터: `it('제목'` 또는 여러 줄 표·식별자 표 뒤의 `it.each([...])('제목'`. */
const TITLE = /^\s*(?:it|test)(?:\.each\((?:[\s\S]*?\]|[\w.]+)\s*\))?\(\s*(['"`])(.+?)\1/;

/**
 * `line` 의 단언을 감싸는 가장 가까운 `it`·`it.each` 호출의 제목. 위로 올라가 호출 시작 줄을
 * 찾고, 제목은 그 시작부터 읽는다 — `it.each` 표가 길면 제목이 단언보다 아래 줄에 있다.
 */
export const testTitleAbove = (text: string, line: number): string | null => {
  const lines = text.split('\n');
  for (let index = Math.min(line, lines.length) - 1; index >= 0; index -= 1) {
    if (!CALL_START.test(lines[index])) continue;
    return TITLE.exec(lines.slice(index).join('\n'))?.[2] ?? null;
  }
  return null;
};

type ResolveContext = {
  read: (file: string) => string | null;
  /** token 이 그 플랫폼에 생성됐을 때의 authoring 위치. */
  declared: (token: string, platform: Platform) => SourceRef | null;
};

const locate = (ctx: ResolveContext, locator: Locator | undefined): SourceRef | null => {
  if (!locator) return null;
  const line = findLine(ctx.read(locator.path), locator.pattern);
  return line === null ? null : { path: locator.path, line };
};

export const resolveSignal = (spec: CellSpec, ctx: ResolveContext): DesignSystemSignal => {
  const declared = spec.token ? ctx.declared(spec.token, spec.platform) : null;
  const consumed = locate(ctx, spec.consumed);
  const testAt = locate(ctx, spec.test);
  const title =
    testAt && spec.test ? testTitleAbove(ctx.read(spec.test.path) ?? '', testAt.line) : null;
  // 소비 코드 없이 test 만 있으면 behavior 근거가 아니다.
  const tested =
    consumed && testAt && spec.test && title
      ? { ...testAt, title, evidenceKind: spec.test.evidenceKind, execution: 'not-run' as const }
      : null;

  const notes: string[] = [];
  if (spec.token && !declared)
    notes.push(`${spec.token} 이 ${spec.platform} 산출물에 생성되지 않았다`);
  if (spec.consumed && !consumed) notes.push(`${spec.consumed.path} 에서 소비 패턴을 찾지 못했다`);
  if (spec.unknownReason) notes.push(spec.unknownReason);

  const observationKind = spec.notApplicable
    ? 'not-applicable'
    : tested
      ? 'tested'
      : consumed
        ? 'consumed'
        : declared
          ? 'declared'
          : 'unknown';
  const reason = spec.notApplicable ?? (notes.length > 0 ? notes.join('; ') : null);

  return {
    id: `${spec.component}.${spec.platform}.${spec.state}`,
    component: spec.component,
    platform: spec.platform,
    state: spec.state,
    token: spec.token,
    label: spec.label,
    observationKind,
    declared,
    consumed,
    via: locate(ctx, spec.via),
    tested,
    reason: observationKind === 'unknown' && !reason ? '근거를 찾지 못했다' : reason,
  };
};

type ConsumerFile = { path: string; text: string };
export type TokenConsumer = { token: string; source: SourceRef };

const COMMENT = /^\s*(\*|\/\/|\/\*)/;
const CSS_VAR = /var\((--ds-component-[a-z0-9-]+)\)/g;
const TS_PATH = /\bcomponent\.((?:[A-Za-z0-9]+\.)*[A-Za-z0-9]+)/g;

/**
 * UI source 의 component token 소비 위치. CSS 변수는 catalog row 의 실제 cssVar 로만 token 에 잇고,
 * TS 경로는 알려진 token 경로나 그 그룹일 때만 센다. 주석 줄은 소비가 아니다.
 */
export const findTokenConsumers = (
  files: ConsumerFile[],
  cssVars: Record<string, string>,
  tokenPaths: string[],
): TokenConsumer[] => {
  const consumers: TokenConsumer[] = [];
  const known = (candidate: string) =>
    tokenPaths.includes(candidate) || tokenPaths.some((token) => token.startsWith(`${candidate}.`));
  for (const file of files) {
    const isScript = /\.tsx?$/.test(file.path);
    file.text.split('\n').forEach((line, index) => {
      if (COMMENT.test(line)) return;
      const tokens = new Set<string>();
      for (const match of line.matchAll(CSS_VAR))
        if (cssVars[match[1]]) tokens.add(cssVars[match[1]]);
      if (isScript) {
        for (const match of line.matchAll(TS_PATH)) {
          const candidate = `component.${match[1]}`;
          if (known(candidate)) tokens.add(candidate);
        }
      }
      for (const token of tokens)
        consumers.push({ token, source: { path: file.path, line: index + 1 } });
    });
  }
  return consumers;
};

/** 셀이 가리키지 않는 소비. 분모에 넣지 않고 따로 보고한다. */
export const findUnmappedConsumers = (
  files: ConsumerFile[],
  cells: CellSpec[],
  cssVars: Record<string, string>,
  tokenPaths: string[],
): TokenConsumer[] =>
  findTokenConsumers(files, cssVars, tokenPaths).filter(
    (consumer) =>
      !cells.some(
        (cell) =>
          cell.consumed?.path === consumer.source.path &&
          cell.token !== null &&
          (cell.token === consumer.token || cell.token.startsWith(`${consumer.token}.`)),
      ),
  );
