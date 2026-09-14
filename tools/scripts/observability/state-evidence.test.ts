import fs from 'node:fs';
import path from 'node:path';

import { designSystemSignalSchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { REPO_ROOT } from '../generate-consumer-catalog/config';

import {
  type CellSpec,
  findUnmappedConsumers,
  resolveSignal,
  STATE_CELLS,
  testTitleAbove,
} from './state-evidence';

const TOKEN_SOURCE = { path: 'libs/design-tokens/tokens/light/component.json', line: 7 };

const SPEC: CellSpec = {
  component: 'Button',
  platform: 'react-native',
  state: 'pressed',
  token: 'component.pressedOffset',
  label: '눌림: 색은 그대로, pressedOffset 만큼 아래로 이동',
  consumed: { path: 'src/Button.styles.ts', pattern: 'translateY: tokens.component.pressedOffset' },
  test: {
    path: 'src/Button.test.tsx',
    pattern: 'translateY: t.component.pressedOffset',
    evidenceKind: 'behavior-assertion',
  },
};

const STYLES =
  'export const s = {\n  pressed: { transform: [{ translateY: tokens.component.pressedOffset }] },\n};\n';
const TEST = `describe('pressed', () => {
  it('눌리면 내려간다', async () => {
    render();
    expect(x).toHaveStyle({ transform: [{ translateY: t.component.pressedOffset }] });
  });
});
`;

const reader =
  (files: Record<string, string>) =>
  (file: string): string | null =>
    files[file] ?? null;

const resolve = (spec: CellSpec, files: Record<string, string>, declared = true) =>
  resolveSignal(spec, {
    read: reader(files),
    declared: () => (declared ? TOKEN_SOURCE : null),
  });

describe('resolveSignal — source·test 위치로 상태 셀을 만든다', () => {
  it('소비 코드와 그것을 단언하는 test 가 있으면 tested 다 (실행 결과는 not-run)', () => {
    const signal = resolve(SPEC, { 'src/Button.styles.ts': STYLES, 'src/Button.test.tsx': TEST });
    expect(signal).toEqual({
      id: 'Button.react-native.pressed',
      component: 'Button',
      platform: 'react-native',
      state: 'pressed',
      token: 'component.pressedOffset',
      label: '눌림: 색은 그대로, pressedOffset 만큼 아래로 이동',
      observationKind: 'tested',
      declared: TOKEN_SOURCE,
      consumed: { path: 'src/Button.styles.ts', line: 2 },
      via: null,
      tested: {
        path: 'src/Button.test.tsx',
        line: 4,
        title: '눌리면 내려간다',
        evidenceKind: 'behavior-assertion',
        execution: 'not-run',
      },
      reason: null,
    });
    expect(designSystemSignalSchema.parse(signal)).toEqual(signal);
  });

  it('test 가 단언하지 않으면 consumed 에서 멈춘다', () => {
    const signal = resolve(SPEC, { 'src/Button.styles.ts': STYLES, 'src/Button.test.tsx': 'it()' });
    expect(signal).toMatchObject({ observationKind: 'consumed', tested: null });
  });

  it('소비 코드가 없으면 test 가 있어도 tested 가 아니다 — 선언만 남는다', () => {
    const signal = resolve(SPEC, { 'src/Button.test.tsx': TEST });
    expect(signal).toMatchObject({ observationKind: 'declared', consumed: null, tested: null });
    expect(signal.reason).toContain('src/Button.styles.ts');
  });

  it('해당 플랫폼에 token 이 생성되지 않았으면 선언 근거가 없다고 적는다', () => {
    const signal = resolve(
      SPEC,
      { 'src/Button.styles.ts': STYLES, 'src/Button.test.tsx': TEST },
      false,
    );
    expect(signal).toMatchObject({ observationKind: 'tested', declared: null });
    expect(signal.reason).toContain('react-native');
  });

  it('선언도 소비도 없으면 unknown 이다', () => {
    const signal = resolve(SPEC, {}, false);
    expect(signal).toMatchObject({ observationKind: 'unknown', declared: null });
    expect(signal.reason).toBeTruthy();
  });

  it('다른 방식으로 표현하는 상태는 not-applicable 이고 그 근거를 남긴다', () => {
    const fab: CellSpec = {
      ...SPEC,
      component: 'Fab',
      label: '눌림: 오프셋 대신 elevation 상승',
      consumed: { path: 'src/Fab.styles.ts', pattern: 'tokens.shadow.xl' },
      test: undefined,
      notApplicable: 'Fab 은 눌림을 pressedOffset 이 아니라 elevation 으로 표현한다',
    };
    const signal = resolve(fab, {
      'src/Fab.styles.ts':
        'const a = 1;\nconst shadow = pressed ? tokens.shadow.xl : tokens.shadow.lg;\n',
    });
    expect(signal).toMatchObject({
      id: 'Fab.react-native.pressed',
      observationKind: 'not-applicable',
      consumed: { path: 'src/Fab.styles.ts', line: 2 },
      reason: 'Fab 은 눌림을 pressedOffset 이 아니라 elevation 으로 표현한다',
    });
  });

  it('근거가 정의되지 않은 셀은 unknown 과 그 이유다', () => {
    const noEvidence: CellSpec = {
      component: 'Checkbox',
      platform: 'react-native',
      state: 'reduced-motion',
      token: null,
      label: '동작 줄이기: 전환 해제',
      unknownReason: 'RN source 에서 reduced-motion 처리 근거를 찾지 못했다',
    };
    expect(resolve(noEvidence, {})).toMatchObject({
      observationKind: 'unknown',
      declared: null,
      reason: 'RN source 에서 reduced-motion 처리 근거를 찾지 못했다',
    });
  });
});

describe('testTitleAbove', () => {
  it('가장 가까운 it 제목을 읽는다 — it.each 형식도 포함한다', () => {
    const text = "it('a', () => {});\nit.each([1])('%s 는 b', () => {\n  expect(1);\n});\n";
    expect(testTitleAbove(text, 3)).toBe('%s 는 b');
    expect(testTitleAbove('expect(1);', 1)).toBeNull();
  });

  it('여러 줄 it.each 는 표 뒤의 제목을 읽는다 — 단언이 표 안에 있어도 같다', () => {
    const text = [
      "it('앞의 다른 test', () => {});",
      "describe('두께', () => {",
      '  it.each([',
      "    ['평상시', () => T.width],",
      "    ['focused', () => T.focusRingWidth],",
      "  ])('%s', (_label, expected) => {",
      '    expect(width).toBe(expected());',
      '  });',
      '});',
    ].join('\n');
    expect(testTitleAbove(text, 5)).toBe('%s');
    expect(testTitleAbove(text, 7)).toBe('%s');
  });
});

describe('findUnmappedConsumers — 한정된 셀 밖의 소비', () => {
  it('셀이 가리키지 않는 소비 위치를 분모에 넣지 않고 따로 적는다', () => {
    const cells: CellSpec[] = [
      {
        ...SPEC,
        platform: 'web',
        consumed: { path: 'libs/ui/button-base.scss', pattern: 'pressed-offset' },
        test: undefined,
      },
    ];
    const files = [
      {
        path: 'libs/ui/button-base.scss',
        text: '.b:active {\n  transform: translateY(var(--ds-component-pressed-offset));\n}\n',
      },
      {
        path: 'libs/ui/chip.scss',
        text: '.c {}\n.c:active {\n  transform: translateY(var(--ds-component-pressed-offset));\n}\n',
      },
      { path: 'libs/rn/Chip.styles.ts', text: 'translateY: tokens.component.pressedOffset' },
    ];
    const cssVars = { '--ds-component-pressed-offset': 'component.pressedOffset' };
    expect(findUnmappedConsumers(files, cells, cssVars, ['component.pressedOffset'])).toEqual([
      { token: 'component.pressedOffset', source: { path: 'libs/ui/chip.scss', line: 3 } },
      { token: 'component.pressedOffset', source: { path: 'libs/rn/Chip.styles.ts', line: 1 } },
    ]);
  });

  it('catalog 에 없는 CSS 변수는 token 으로 추측하지 않는다', () => {
    const files = [{ path: 'a.scss', text: 'x: var(--ds-component-unknown);' }];
    expect(findUnmappedConsumers(files, [], {}, [])).toEqual([]);
  });
});

describe('STATE_CELLS — 현재 저장소 source 와 대조', () => {
  const read = (file: string) => {
    const full = path.join(REPO_ROOT, file);
    return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
  };
  const signals = STATE_CELLS.map((spec) =>
    resolveSignal(spec, { read, declared: () => TOKEN_SOURCE }),
  );
  const byId = (id: string) => {
    const signal = signals.find((candidate) => candidate.id === id);
    if (!signal) throw new Error(`no cell ${id}`);
    return signal;
  };

  it('셀 id 가 겹치지 않고 전부 계약을 통과한다', () => {
    expect(new Set(signals.map((signal) => signal.id)).size).toBe(signals.length);
    for (const signal of signals) expect(designSystemSignalSchema.parse(signal)).toEqual(signal);
  });

  it('정의한 소비·test 패턴이 source 에서 사라지지 않았다', () => {
    const drifted = STATE_CELLS.flatMap((spec, index) => {
      const signal = signals[index];
      return [
        ...(spec.consumed && !signal.consumed
          ? [`${signal.id} consumed ${spec.consumed.path}`]
          : []),
        ...(spec.test && !signal.tested && signal.consumed
          ? [`${signal.id} test ${spec.test.path}`]
          : []),
      ];
    });
    expect(drifted).toEqual([]);
  });

  it('test 위치는 단언을 감싸는 it 의 제목으로 잇는다', () => {
    expect(byId('Button.react-native.pressed').tested?.title).toBe(
      '눌리면 토큰 오프셋만큼 내려간다',
    );
    expect(byId('InputBase.react-native.size-sm').tested?.title).toBe(
      '%s 는 터치 타깃 아래로 내려가지 않는다',
    );
    expect(byId('InputBase.react-native.focus-visible').tested?.title).toBe('%s');
  });

  it('RN Button·IconButton 은 pressed 를 translateY 로 표현하고 test 가 단언한다', () => {
    expect(byId('Button.react-native.pressed').observationKind).toBe('tested');
    expect(byId('IconButton.react-native.pressed').observationKind).toBe('tested');
  });

  it('Fab 의 pressed 는 elevation 이라 pressedOffset 셀은 not-applicable 이다', () => {
    expect(byId('Fab.react-native.pressed').observationKind).toBe('not-applicable');
    expect(byId('Fab.web.pressed').observationKind).toBe('not-applicable');
  });

  it('web Button 은 소비만 확인되고 behavior test 는 없다', () => {
    expect(byId('Button.web.pressed').observationKind).toBe('consumed');
  });

  it('web 선택 컨트롤 reduced-motion test 는 CSS source 단언이다', () => {
    expect(byId('Checkbox.web.reduced-motion').tested?.evidenceKind).toBe('source-assertion');
  });
});
