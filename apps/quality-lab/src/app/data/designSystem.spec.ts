import { designSystemSchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { designSystem } from '../../test/design';

import { artifactMatrix, SIGNAL_KIND_LABEL, stateMatrix } from './designSystem';

const ds = designSystemSchema.parse(designSystem());

describe('stateMatrix — component × state·platform', () => {
  const matrix = stateMatrix(ds.signals);

  it('열은 한정된 상태 어휘와 플랫폼 순서다', () => {
    expect(matrix.columns).toEqual([
      { state: 'pressed', platform: 'web' },
      { state: 'pressed', platform: 'react-native' },
      { state: 'focus-visible', platform: 'react-native' },
      { state: 'reduced-motion', platform: 'web' },
      { state: 'reduced-motion', platform: 'react-native' },
    ]);
    expect(matrix.rows.map((row) => row.component)).toEqual(['Button', 'Checkbox', 'Fab']);
  });

  it('소비 위치만 있으면 consumed 이고 tested 가 아니다', () => {
    const button = matrix.rows[0];
    expect(button.cells[0]?.observationKind).toBe('consumed');
    expect(button.cells[0]?.tested).toBeNull();
    expect(SIGNAL_KIND_LABEL.consumed).toBe('소비 확인 · test 근거 없음');
    expect(SIGNAL_KIND_LABEL.tested).toBe('test 위치 있음 · 실행 안 함');
  });

  it('정의하지 않은 셀(null)과 근거를 찾지 못한 셀(unknown)을 구분한다', () => {
    const [button, checkbox] = matrix.rows;
    expect(button.cells[4]).toBeNull();
    expect(checkbox.cells[4]?.observationKind).toBe('unknown');
    expect(checkbox.cells[2]?.observationKind).toBe('declared');
  });
});

describe('artifactMatrix — 테마 × 생성 산출물', () => {
  it('테마마다 web·rn·css 산출물 상태를 원본 그대로 둔다', () => {
    expect(
      artifactMatrix(ds).map((row) => [row.theme, row.cells.map((cell) => cell?.status ?? 'none')]),
    ).toEqual([
      ['light', ['present', 'present', 'present']],
      ['dark', ['present', 'missing', 'present']],
    ]);
  });
});
