import { describe, expect, it } from 'vitest';

import { NAV, titleFor } from './nav';

describe('정보 구조', () => {
  it('그룹은 작업 단위로 나뉜다', () => {
    expect(NAV.map((g) => g.label)).toEqual([
      null,
      '검증',
      'Foundation',
      '컴포넌트',
      'Layout',
      'Overlay',
    ]);
  });

  it('모든 경로가 유일하다', () => {
    const paths = NAV.flatMap((g) => g.items.map((i) => i.path));
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('현재 경로의 페이지 이름을 찾는다', () => {
    expect(titleFor('/')).toBe('개요');
    expect(titleFor('/verify')).toBe('Runtime');
    expect(titleFor('/components/button')).toBe('Button');
  });

  it('알 수 없는 경로는 개요로 떨어진다', () => {
    expect(titleFor('/nope')).toBe('개요');
  });

  /**
   * `end` 는 손으로 적지 않고 경로에서 유도한다. 특정 경로를 박아 두면 IA 가 바뀔 때
   * 함께 낡으므로, 규칙 자체를 검증한다.
   */
  it('다른 항목의 상위 경로이거나 루트면 정확히 일치할 때만 active 다', () => {
    const items = NAV.flatMap((g) => g.items);
    for (const item of items) {
      const isParent = items.some(
        (o) => o.path !== item.path && o.path.startsWith(`${item.path}/`),
      );
      expect(item.end).toBe(item.path === '/' || isParent);
    }
  });

  it('루트는 언제나 정확히 일치다', () => {
    expect(NAV.flatMap((g) => g.items).find((i) => i.path === '/')?.end).toBe(true);
  });
});
