import { describe, expect, it } from 'vitest';

import { allTokenIds } from '../presentation/tokenCatalog';

import { magnitude, membersOf, SCALE_SECTIONS, shadowLayers, valueOf } from './tokenScales';

/**
 * 계열 목록은 손으로 적었다. 그래서 토큰이 늘었는데 목록이 그대로면 새 토큰이 화면에서 조용히
 * 빠진다 — 첫 테스트가 그것을 막는다. 기대값은 적지 않고 catalog 에서 읽는다.
 */
const families = SCALE_SECTIONS.flatMap((s) => s.families);
const find = (prefix: string, key: string) => {
  const family = families.find((f) => f.prefix === prefix);
  return family && membersOf(family, 'light').find((m) => m.key === key);
};

describe('스케일 카드 분류', () => {
  it('색을 뺀 모든 토큰이 정확히 한 카드에 담긴다', () => {
    const covered = families.flatMap((f) => membersOf(f, 'light').flatMap((m) => m.ids));
    const expected = allTokenIds().filter((id) => !id.startsWith('color.'));
    expect(expected.length).toBeGreaterThan(0);
    expect(covered.length).toBe(new Set(covered).size);
    expect([...covered].sort()).toEqual([...expected].sort());
  });

  it('빈 계열을 만들지 않는다', () => {
    for (const family of families) {
      expect(membersOf(family, 'light').length, family.prefix).toBeGreaterThan(0);
    }
  });

  it('잎 계열은 카드마다 토큰 하나, 합성 계열은 여럿이다', () => {
    for (const family of families) {
      for (const member of membersOf(family, 'light')) {
        if (family.composite) expect(member.ids.length).toBeGreaterThan(1);
        else expect(member.ids).toHaveLength(1);
      }
    }
  });

  it.each(['spacing', 'radius', 'typography.fontSize', 'motion.duration'])(
    '%s 는 작은 값에서 큰 값 순이다',
    (prefix) => {
      const family = families.find((f) => f.prefix === prefix);
      expect(family).toBeDefined();
      if (!family) return;
      const sizes = membersOf(family, 'light').map(
        (m) => magnitude(valueOf(m.ids[0] ?? '', 'light') ?? '')?.[1],
      );
      expect(sizes).toEqual([...sizes].sort((a = 0, b = 0) => a - b));
    },
  );

  it('글자 스타일은 글자 크기 순이다', () => {
    const family = families.find((f) => f.prefix === 'typography.heading');
    expect(membersOf(family ?? families[0], 'light').map((m) => m.key)).toEqual([
      'h6',
      'h5',
      'h4',
      'h3',
      'h2',
      'h1',
    ]);
  });
});

describe('그림자 층', () => {
  it('층이 여럿이면 쉼표로 이어질 값을 층마다 만든다', () => {
    const xs = find('shadow', 'xs');
    expect(xs).toBeDefined();
    const layers = shadowLayers(xs?.ids ?? [], 'light');
    expect(layers.length).toBeGreaterThan(1);
    expect(layers.every((l) => l.split(' ').length === 5)).toBe(true);
  });

  it('inner 그림자는 inset 으로 그린다', () => {
    const inner = find('shadow', 'inner');
    const layers = shadowLayers(inner?.ids ?? [], 'light');
    expect(layers).toHaveLength(1);
    expect(layers[0]).toMatch(/^inset /);
  });
});
