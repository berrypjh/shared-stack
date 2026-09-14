import { describe, expect, it } from 'vitest';

import { allPresentations } from './registry';
import {
  catalogSchema,
  cssVarOf,
  hasToken,
  resolveToken,
  tokenCount,
  tokenThemes,
} from './tokenCatalog';

/**
 * Token binding 을 **공개 token artifact** 와 대조한다.
 *
 * binding 은 사람이 stylesheet 를 읽고 고른 것이라, id 가 낡거나 오타가 나는 것을 막는 자리가
 * 필요하다. 여기서 막는 것은 "존재하는 token 인가"다 — "이 컴포넌트가 실제로 쓰는가"는
 * stylesheet 를 읽은 근거로만 결정되고, 자동으로 판단하지 않는다.
 */
const definitions = allPresentations().map((p) => [p.data.id, p.data] as const);

const withTokens = allPresentations().flatMap((p) =>
  p.data.tokens ? [[p.data.id, p.data, p.data.tokens] as const] : [],
);

describe('token catalog adapter', () => {
  it('공개 artifact 의 자기 기술 schema 를 읽는다', () => {
    expect(catalogSchema()).toBe('tokens[path] = [cssVar, ...valuesInThemesOrder]');
    expect(tokenCount()).toBeGreaterThan(0);
  });

  it('theme 목록이 artifact 에서 온다', () => {
    const themes = tokenThemes();
    expect(themes[0]).toBe('light');
    expect(themes).toContain('dark');
    expect(new Set(themes).size).toBe(themes.length);
  });

  /** CSS 변수를 이름 규칙으로 유도하면 틀린다 — catalog 가 적어 둔 값을 그대로 쓴다. */
  it('CSS 변수는 catalog 가 적어 둔 값이다', () => {
    expect(cssVarOf('spacing.md')).toBe('--ds-spacing-md');
    expect(cssVarOf('color.text.default')).toBe('--ds-text-default');
    expect(cssVarOf('component.pressedOffset')).toBe('--ds-component-pressed-offset');
    // 첫 세그먼트를 항상 떼는 유도 규칙이라면 `--ds-md` 가 나왔을 것이다.
    expect(cssVarOf('spacing.md')).not.toBe('--ds-md');
  });

  it('theme 순서대로 값을 읽는다', () => {
    const light = resolveToken('color.primaryBtn.default', 'light');
    const dark = resolveToken('color.primaryBtn.default', 'dark');
    expect(light.ok && dark.ok).toBe(true);
    if (!light.ok || !dark.ok) return;
    // 같은 token, 같은 변수, 다른 값 — identity 는 theme 과 무관하다.
    expect(light.token.id).toBe(dark.token.id);
    expect(light.token.cssVar).toBe(dark.token.cssVar);
    expect(light.token.value).not.toBe(dark.token.value);
  });

  it('모든 theme 에서 해석된다', () => {
    for (const theme of tokenThemes()) {
      expect(resolveToken('color.text.default', theme).ok).toBe(true);
    }
  });

  /** 없는 theme 을 light 로 조용히 대체하지 않는다. */
  it('없는 theme 은 실패를 돌려준다', () => {
    const result = resolveToken('color.text.default', 'no-such-theme');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unknown-theme');
  });

  it('없는 token 은 실패를 돌려준다', () => {
    const result = resolveToken('no.such.token', 'light');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unknown-token');
    expect(hasToken('no.such.token')).toBe(false);
    expect(cssVarOf('no.such.token')).toBeUndefined();
  });

  it('theme 이름을 대소문자로 흐리지 않는다', () => {
    expect(resolveToken('color.text.default', 'Light').ok).toBe(false);
  });
});

describe('token binding drift', () => {
  it('binding 을 선언한 definition 이 있다', () => {
    expect(withTokens.filter(([, , t]) => t.bindings.length > 0).length).toBeGreaterThan(0);
  });

  /** 이 Command 의 핵심 검증 — 오타나 낡은 id 가 여기서 걸린다. */
  it.each(withTokens)('%s 의 모든 token id 가 catalog 에 있다', (_id, _data, tokens) => {
    const unknown = tokens.bindings.flatMap((b) => b.tokenIds.filter((t) => !hasToken(t)));
    expect(unknown).toEqual([]);
  });

  it.each(withTokens)('%s 의 모든 token 이 모든 theme 에서 해석된다', (_id, _data, tokens) => {
    const failures: string[] = [];
    for (const binding of tokens.bindings) {
      for (const tokenId of binding.tokenIds) {
        for (const theme of tokenThemes()) {
          if (!resolveToken(tokenId, theme).ok) failures.push(`${tokenId}@${theme}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it.each(withTokens)('%s 의 binding id 가 유일하다', (_id, _data, tokens) => {
    const ids = tokens.bindings.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(withTokens)('%s 의 binding 안에 중복 token id 가 없다', (_id, _data, tokens) => {
    for (const binding of tokens.bindings) {
      expect(new Set(binding.tokenIds).size).toBe(binding.tokenIds.length);
    }
  });

  it.each(withTokens)('%s 의 scenario 참조가 실제 scenario 다', (_id, data, tokens) => {
    const known = new Set(data.scenarios.map((s) => s.id));
    const bad = tokens.bindings.flatMap((b) =>
      (b.scenarioIds ?? []).filter((sid) => !known.has(sid)),
    );
    expect(bad).toEqual([]);
  });

  it.each(withTokens)('%s 의 state 참조가 실제 state 다', (_id, data, tokens) => {
    const known = new Set(data.comparison?.stateMatrix?.states.map((s) => s.id) ?? []);
    const bad = tokens.bindings.flatMap((b) => (b.stateIds ?? []).filter((sid) => !known.has(sid)));
    expect(bad).toEqual([]);
  });

  /** 빈 목록을 "지원됨"처럼 보이게 하지 않는다 — 이유를 반드시 적는다. */
  it.each(withTokens)('%s 의 빈 binding 목록에는 이유가 있다', (_id, _data, tokens) => {
    if (tokens.bindings.length === 0) {
      expect(tokens.notes?.length ?? 0).toBeGreaterThan(0);
    }
  });

  /** metadata 는 identity 만 갖는다 — 값·변수를 복사해 두면 토큰이 바뀔 때 낡는다. */
  it.each(definitions)('%s 의 metadata 에 token 값·CSS 변수가 없다', (_id, data) => {
    const serialized = JSON.stringify(data.tokens ?? {});
    expect(serialized).not.toMatch(/--ds-/);
    expect(serialized).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(serialized).not.toMatch(/\d+(\.\d+)?rem/);
  });
});
