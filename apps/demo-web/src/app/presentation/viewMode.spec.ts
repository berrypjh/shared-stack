import { describe, expect, it } from 'vitest';

import {
  DEFAULT_VIEW_MODE,
  parseViewMode,
  readViewMode,
  VIEW_PARAM,
  writeViewMode,
} from './viewMode';

/**
 * URL 정책. 이 규칙 하나가 Back/Forward · refresh · deep link · 링크 공유를 모두 설명한다.
 * 값 목록을 여기 다시 적지 않고 규칙을 검증한다.
 */
describe('view mode 읽기', () => {
  it('parameter 가 없으면 developer 다', () => {
    expect(readViewMode('')).toBe('developer');
    expect(readViewMode('?other=1')).toBe('developer');
    expect(DEFAULT_VIEW_MODE).toBe('developer');
  });

  it('view=designer 는 designer 다', () => {
    expect(readViewMode('?view=designer')).toBe('designer');
  });

  it('view=developer 는 developer 로 normalize 된다', () => {
    expect(readViewMode('?view=developer')).toBe('developer');
  });

  it.each([['bogus'], ['Designer'], ['DESIGNER'], [''], ['designer,developer']])(
    'view=%s 는 developer 로 떨어진다',
    (raw) => {
      expect(readViewMode(`?view=${encodeURIComponent(raw)}`)).toBe('developer');
    },
  );

  it('null 은 developer 다 — cast 없이 좁힌다', () => {
    expect(parseViewMode(null)).toBe('developer');
  });
});

describe('view mode 쓰기', () => {
  it('designer 는 view=designer 를 세운다', () => {
    expect(writeViewMode('', 'designer').get(VIEW_PARAM)).toBe('designer');
  });

  it('developer 는 view 를 지운다 — default 는 canonical URL 에 남지 않는다', () => {
    expect(writeViewMode('?view=designer', 'developer').has(VIEW_PARAM)).toBe(false);
    expect(writeViewMode('?view=designer', 'developer').toString()).toBe('');
  });

  it('view 이외의 parameter 를 보존한다', () => {
    const toDesigner = writeViewMode('?q=spacing&page=2', 'designer');
    expect(toDesigner.get('q')).toBe('spacing');
    expect(toDesigner.get('page')).toBe('2');

    const toDeveloper = writeViewMode('?q=spacing&view=designer&page=2', 'developer');
    expect(toDeveloper.get('q')).toBe('spacing');
    expect(toDeveloper.get('page')).toBe('2');
    expect(toDeveloper.has(VIEW_PARAM)).toBe(false);
  });

  it('원본 params 를 변형하지 않는다', () => {
    const original = new URLSearchParams('?view=designer');
    writeViewMode(original, 'developer');
    expect(original.get(VIEW_PARAM)).toBe('designer');
  });

  it('두 방향 왕복이 canonical 로 돌아온다', () => {
    const designer = writeViewMode('', 'designer');
    expect(writeViewMode(designer, 'developer').toString()).toBe('');
  });

  it('읽기와 쓰기가 서로의 역이다', () => {
    for (const mode of ['developer', 'designer'] as const) {
      expect(readViewMode(writeViewMode('?keep=1', mode))).toBe(mode);
    }
  });
});
