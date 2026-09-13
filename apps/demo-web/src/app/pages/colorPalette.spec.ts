import { describe, expect, it } from 'vitest';

import { tokenIdsInCategory } from '../presentation/tokenCatalog';

import { colorFamilies, rampsOf, semanticOf } from './colorPalette';

/**
 * 계열 분류는 **키 모양**에서 나온다. 계열 이름 목록을 테스트에 다시 적지 않는다 — 적으면
 * 토큰에 계열이 늘 때 이 테스트만 낡아 새 계열이 팔레트에서 조용히 빠진다.
 */
const families = colorFamilies(tokenIdsInCategory('color'));

describe('색 팔레트 분류', () => {
  it('color 토큰을 하나도 잃지 않는다', () => {
    const ids = tokenIdsInCategory('color');
    expect(ids.length).toBeGreaterThan(0);
    expect(families.flatMap((f) => f.entries).map((e) => e.id)).toEqual([...ids]);
  });

  it('램프와 시맨틱 둘로만 갈린다', () => {
    expect(rampsOf(families).length + semanticOf(families).length).toBe(families.length);
    expect(rampsOf(families).length).toBeGreaterThan(0);
    expect(semanticOf(families).length).toBeGreaterThan(0);
  });

  it('램프는 단계 키만 갖는다', () => {
    for (const family of rampsOf(families)) {
      for (const entry of family.entries) {
        expect(entry.key).toMatch(/^[a-z]{2}\d{3}$/);
      }
    }
  });

  it('램프 단계는 오름차순이다 — 자릿수가 같아 사전순이 곧 단계순이다', () => {
    for (const family of rampsOf(families)) {
      const keys = family.entries.map((e) => e.key);
      expect(keys).toEqual([...keys].sort());
    }
  });

  it('시맨틱 역할에는 단계 키만으로 된 계열이 없다', () => {
    for (const family of semanticOf(families)) {
      expect(family.entries.every((e) => /^[a-z]{2}\d{3}$/.test(e.key))).toBe(false);
    }
  });

  it('계열 이름이 유일하다', () => {
    const names = families.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('빈 계열을 만들지 않는다', () => {
    for (const family of families) {
      expect(family.entries.length).toBeGreaterThan(0);
    }
  });

  it('계열이 없거나 키가 없는 id 는 무시한다', () => {
    expect(colorFamilies(['color', 'color.orphan'])).toEqual([]);
  });
});
