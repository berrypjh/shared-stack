import { describe, expect, it } from 'vitest';

import { scenariosFor, TARGETS } from './measure';

/**
 * check.ts 가 재는 scenario 목록의 characterization. 추출 전 `main` 이 만들던 이름·entry 와
 * 같아야 한다 — human 출력과 `--json` 이 같은 scenario 를 잰다.
 */
describe('scenariosFor', () => {
  const target = TARGETS['react-ui'];

  it('심볼이 없으면 all-exports 하나다', () => {
    expect(scenariosFor(target, [])).toEqual([
      {
        name: 'all-exports (baseline)',
        kind: 'all-exports',
        symbols: [],
        entry: "export * from '@berrypjh/react-ui';\n",
      },
    ]);
  });

  it('심볼 하나는 single 과 all-exports 다 — multi 는 없다', () => {
    expect(scenariosFor(target, ['cx']).map((scenario) => scenario.name)).toEqual([
      'single: cx',
      'all-exports (baseline)',
    ]);
  });

  it('여러 심볼은 각 single, multi, 마지막 all-exports 순서다', () => {
    const scenarios = scenariosFor(target, ['cx', 'Box']);
    expect(scenarios.map((scenario) => [scenario.name, scenario.kind, scenario.symbols])).toEqual([
      ['single: cx', 'single', ['cx']],
      ['single: Box', 'single', ['Box']],
      ['multi: cx+Box', 'multi', ['cx', 'Box']],
      ['all-exports (baseline)', 'all-exports', []],
    ]);
    expect(scenarios[0].entry).toBe("import { cx } from '@berrypjh/react-ui';\nconsole.log(cx);\n");
    expect(scenarios[2].entry).toBe(
      "import { cx, Box } from '@berrypjh/react-ui';\nconsole.log(cx, Box);\n",
    );
  });

  it('target 등록부는 기존 네 패키지와 externals 를 유지한다', () => {
    expect(Object.keys(TARGETS)).toEqual([
      'design-tokens',
      'ui-core',
      'react-ui',
      'react-native-ui',
    ]);
    expect(TARGETS['react-native-ui'].external).toEqual([
      'react',
      'react-native',
      'react/jsx-runtime',
    ]);
  });
});
