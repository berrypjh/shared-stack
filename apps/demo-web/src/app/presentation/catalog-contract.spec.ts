import { describe, expect, it } from 'vitest';

import {
  acceptsBoolean,
  allowedLiterals,
  catalogPackage,
  hasSymbol,
  propNamesOf,
  propOf,
} from './consumerCatalog';
import { allPresentations } from './registry';

/**
 * Designer comparison metadata 를 **생성된 public catalog** 와 대조한다.
 *
 * 손으로 고른 선언이 실제 공개 API 와 갈리는 것을 막는 자리다. catalog 를 Designer UI 의
 * 생성 source 로 쓰지 않고, 여기서 검증 source 로만 쓴다.
 */
const withComparison = allPresentations().flatMap((p) =>
  p.data.comparison ? [[p.data.id, p.data, p.data.comparison] as const] : [],
);

describe('consumer catalog', () => {
  it('공개 subpath export 를 읽는다', () => {
    expect(catalogPackage()).toBe('@berrypjh/react-ui');
  });

  it('판별 유니온 prop 의 값을 type 텍스트에서도 모은다', () => {
    // `Fab.shape` 은 values 가 한쪽 분기만 담는다. 둘의 합집합이어야 실제 공개 값이 된다.
    expect(propOf('Fab', 'shape')?.values).toEqual(['circular']);
    expect([...allowedLiterals('Fab', 'shape')].sort()).toEqual(['circular', 'extended']);
  });

  it('이름 붙은 타입은 values 만 쓰므로 검증이 느슨해지지 않는다', () => {
    expect([...allowedLiterals('Button', 'variant')].sort()).toEqual([
      'contained',
      'outlined',
      'text',
    ]);
    expect(allowedLiterals('Button', 'variant')).not.toContain('ghost');
  });

  it('없는 prop 은 빈 집합이다', () => {
    expect(allowedLiterals('Button', 'nope')).toEqual([]);
    expect(propNamesOf('NoSuchComponent')).toEqual([]);
  });
});

describe('comparison metadata drift', () => {
  it('metadata 를 선언한 definition 이 있다', () => {
    expect(withComparison.length).toBeGreaterThan(0);
  });

  it.each(withComparison)('%s 의 catalogSymbol 이 public symbol 이다', (_id, _data, comparison) => {
    expect(hasSymbol(comparison.catalogSymbol)).toBe(true);
  });

  it.each(withComparison)('%s 의 property prop 이 실제 public prop 이다', (_id, _data, c) => {
    const known = propNamesOf(c.catalogSymbol);
    expect(c.properties.map((p) => p.prop).filter((prop) => !known.includes(prop))).toEqual([]);
  });

  /** `variant: 'ghost'` 같은 drift 가 여기서 걸린다. */
  it.each(withComparison)('%s 의 enum option 이 실제 public 값이다', (_id, _data, c) => {
    const bad: string[] = [];
    for (const property of c.properties) {
      if (property.control.kind !== 'enum') continue;
      const allowed = allowedLiterals(c.catalogSymbol, property.prop);
      for (const option of property.control.options) {
        if (!allowed.includes(String(option.value))) {
          bad.push(`${property.prop}=${String(option.value)}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it.each(withComparison)('%s 의 boolean control 이 실제 boolean prop 이다', (_id, _data, c) => {
    const bad = c.properties
      .filter((p) => p.control.kind === 'boolean')
      .map((p) => p.prop)
      .filter((prop) => !acceptsBoolean(c.catalogSymbol, prop));
    expect(bad).toEqual([]);
  });

  it.each(withComparison)('%s 의 matrix 축 prop·값이 public 이다', (_id, _data, c) => {
    const axes = [c.variantMatrix?.columns, c.variantMatrix?.rows].filter(
      (a): a is NonNullable<typeof a> => a !== undefined,
    );
    const known = propNamesOf(c.catalogSymbol);
    for (const axis of axes) {
      expect(known).toContain(axis.prop);
      const allowed = allowedLiterals(c.catalogSymbol, axis.prop);
      expect(axis.options.map((o) => String(o.value)).filter((v) => !allowed.includes(v))).toEqual(
        [],
      );
    }
  });

  /**
   * State Matrix 는 **실제 prop 으로 재현되는 state 만** 담는다. hover 처럼 강제할 prop 이 없는
   * state 를 prop object 로 위조하면 여기서 걸린다.
   */
  it.each(withComparison)('%s 의 state 가 실제 public prop 으로만 이뤄진다', (_id, _data, c) => {
    const known = propNamesOf(c.catalogSymbol);
    const bad: string[] = [];
    for (const state of c.stateMatrix?.states ?? []) {
      expect(state.kind).toBe('prop');
      for (const prop of Object.keys(state.props)) {
        if (!known.includes(prop)) bad.push(`${state.id}:${prop}`);
      }
    }
    expect(bad).toEqual([]);
  });

  /** pseudo-state 이름이 state cell 로 새어 들어오지 않는지 직접 확인한다. */
  it.each(withComparison)('%s 의 state id 에 pseudo-state 이름이 없다', (_id, _data, c) => {
    const pseudo = /^(hover|focus|focus-visible|pressed|active)$/;
    const states = c.stateMatrix?.states.map((s) => s.id) ?? [];
    expect(states.filter((id) => pseudo.test(id))).toEqual([]);
  });

  /**
   * `focused` 는 pseudo-state 이름처럼 보이지만 FormControl 의 실제 공개 prop 이다 —
   * 그 근거를 catalog 로 고정한다. 근거가 사라지면(prop 이 빠지면) 이 테스트가 먼저 깨진다.
   */
  it('focused state 를 쓰는 definition 은 그 prop 이 실제로 공개돼 있다', () => {
    const users = withComparison.filter(([, , c]) =>
      c.stateMatrix?.states.some((s) => 'focused' in s.props),
    );
    expect(users.length).toBeGreaterThan(0);
    for (const [, , c] of users) {
      expect(acceptsBoolean(c.catalogSymbol, 'focused')).toBe(true);
    }
  });

  it('focused prop 이 없는 컴포넌트는 그것을 state 로 쓰지 않는다', () => {
    for (const [, , c] of withComparison) {
      if (acceptsBoolean(c.catalogSymbol, 'focused')) continue;
      const uses = (c.stateMatrix?.states ?? []).some((s) => 'focused' in s.props);
      expect(uses).toBe(false);
    }
  });
});

describe('comparison metadata 내부 정합성', () => {
  it.each(withComparison)('%s 의 property id 가 유일하다', (_id, _data, c) => {
    const ids = c.properties.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(withComparison)('%s 의 state id 가 유일하다', (_id, _data, c) => {
    const ids = c.stateMatrix?.states.map((s) => s.id) ?? [];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(withComparison)('%s 의 option id 가 축·컨트롤 안에서 유일하다', (_id, _data, c) => {
    const groups = [
      ...c.properties.flatMap((p) => (p.control.kind === 'enum' ? [p.control.options] : [])),
      ...[c.variantMatrix?.columns, c.variantMatrix?.rows]
        .filter((a): a is NonNullable<typeof a> => a !== undefined)
        .map((a) => a.options),
    ];
    for (const options of groups) {
      const ids = options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it.each(withComparison)('%s 의 matrix base scenario 가 존재한다', (_id, data, c) => {
    const scenarioIds = data.scenarios.map((s) => s.id);
    for (const base of [c.variantMatrix?.baseScenarioId, c.stateMatrix?.baseScenarioId]) {
      if (base !== undefined) expect(scenarioIds).toContain(base);
    }
  });

  /** 축이 하나도 없으면 이유를 적어야 한다 — 빈 UI 를 이유 없이 남기지 않는다. */
  it.each(withComparison)('%s 는 없는 축에 대한 설명을 갖는다', (_id, _data, c) => {
    const hasAxes = c.variantMatrix !== undefined || c.stateMatrix !== undefined;
    if (!hasAxes || c.properties.length === 0) {
      expect(c.notes?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it.each(withComparison)('%s 의 축은 최대 두 개다 — Cartesian 폭발이 없다', (_id, _data, c) => {
    const axes = [c.variantMatrix?.columns, c.variantMatrix?.rows].filter(Boolean);
    expect(axes.length).toBeLessThanOrEqual(2);
  });
});
