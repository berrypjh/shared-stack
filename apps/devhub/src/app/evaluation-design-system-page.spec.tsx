import { screen, within } from '@testing-library/react';

import { designSystemArtifact } from '@/test/evaluation/design';
import { renderEvaluation } from '@/test/evaluation/render';
import { publicFiles, qualityArtifact } from '@/test/evaluation/runs';

const PATH = '/evaluation/design-system';
const files = () => publicFiles([qualityArtifact('run-quality'), designSystemArtifact('run-ds')]);

const MATRIX = 'Component state 근거';
const main = () => within(screen.getByRole('main'));
const rowOf = (tableName: string, header: string) =>
  within(main().getByRole('table', { name: tableName }))
    .getByRole('rowheader', { name: header })
    .closest('tr') as HTMLTableRowElement;
const cellTexts = (row: HTMLTableRowElement) =>
  Array.from(row.querySelectorAll('td'), (cell) => cell.textContent);

describe('디자인 시스템', () => {
  it('theme × 산출물 격자는 원본 상태를 글로 보여준다', async () => {
    renderEvaluation(`${PATH}?run=run-ds`, files());
    await main().findByRole('table', { name: 'Theme × 생성 산출물' });
    expect(rowOf('Theme × 생성 산출물', 'dark').textContent).toContain(
      '없음 — libs/design-tokens/src/.generated/rn/themes/dark/tokens.ts 이 없다',
    );
  });

  it('state 격자는 선언·소비·test 위치·근거 없음·해당 없음·정의 없음을 구분한다', async () => {
    renderEvaluation(`${PATH}?run=run-ds`, files());
    await main().findByRole('table', { name: MATRIX });
    expect(cellTexts(rowOf(MATRIX, 'Button'))).toEqual([
      '소비 확인 · test 근거 없음',
      'test 위치 있음 · 실행 안 함',
      '정의 없음',
      '정의 없음',
      '정의 없음',
    ]);
    expect(cellTexts(rowOf(MATRIX, 'Checkbox'))).toEqual([
      '정의 없음',
      '정의 없음',
      '선언만 확인 · 소비 근거 없음',
      'test 위치 있음 · 실행 안 함',
      '근거를 찾지 못함',
    ]);
    expect(cellTexts(rowOf(MATRIX, 'Fab'))[0]).toBe('해당 없음');
  });

  it('source 소비 위치만 있는 셀에는 test 근거를 붙이지 않는다', async () => {
    renderEvaluation(`${PATH}?run=run-ds`, files());
    await main().findByRole('table', { name: 'State 신호 근거' });
    const consumed = rowOf('State 신호 근거', 'Button.web.pressed');
    expect(consumed.textContent).toContain(
      'libs/react-ui/src/components/button-base/button-base.scss:197',
    );
    expect(consumed.textContent).toContain('test 근거 없음');
    expect(consumed.textContent).not.toContain('.test.tsx');
    const tested = rowOf('State 신호 근거', 'Button.react-native.pressed');
    expect(tested.textContent).toContain('Button.test.tsx:351');
    expect(tested.textContent).toContain('behavior-assertion');
    expect(tested.textContent).toContain('실행 안 함 (not-run)');
  });

  it('키보드로 격자 셀에서 근거 행으로 이동한다', async () => {
    const { user, location } = renderEvaluation(`${PATH}?run=run-ds`, files());
    await main().findByRole('table', { name: MATRIX });
    main()
      .getByRole('link', { name: 'Button · react-native · pressed — test 위치 있음 · 실행 안 함' })
      .focus();
    await user.keyboard('{Enter}');
    expect(location()).toBe(`${PATH}?run=run-ds#signal-Button.react-native.pressed`);
    expect(document.activeElement?.id).toBe('signal-Button.react-native.pressed');
  });

  it('platform 필터는 키보드로 바꾸고 일치 수를 알린다', async () => {
    const { user, location } = renderEvaluation(`${PATH}?run=run-ds`, files());
    await main().findByRole('table', { name: MATRIX });
    main().getByRole('button', { name: 'react-native' }).focus();
    await user.keyboard('{Enter}');
    expect(location()).toBe(`${PATH}?run=run-ds&platform=react-native`);
    expect(
      within(main().getByRole('table', { name: MATRIX })).getAllByRole('columnheader'),
    ).toHaveLength(4);
    expect(main().getByText('신호 6개 중 필터와 일치 3개')).toBeTruthy();
  });

  it('토큰 탐색·consumer preview 는 demo-web 으로 연결하고 복제하지 않는다', async () => {
    renderEvaluation(`${PATH}?run=run-ds`, files());
    const tokens = await main().findByRole('link', { name: 'demo-web 토큰 탐색 (/tokens)' });
    expect(tokens.getAttribute('href')).toBe('http://localhost:4200/tokens');
    expect(
      main().getByRole('link', { name: 'demo-web Scales (/scales)' }).getAttribute('href'),
    ).toBe('http://localhost:4200/scales');
    expect(main().getByText('pnpm nx serve @berrypjh/demo-web')).toBeTruthy();
  });

  it('contrast guard 는 WCAG 기준과 프로젝트 가드를 섞지 않는다', async () => {
    renderEvaluation(`${PATH}?run=run-ds`, files());
    await main().findByRole('table', { name: 'Contrast guard' });
    expect(rowOf('Contrast guard', 'divider-visibility').textContent).toContain(
      '프로젝트 가시성 가드 (WCAG 기준 아님)',
    );
    expect(rowOf('Contrast guard', 'wcag-aa-text').textContent).toContain('WCAG 2.1 AA');
  });

  it('design-system 근거가 없는 실행은 unsupported 다', async () => {
    renderEvaluation(`${PATH}?run=run-quality`, files());
    expect(
      await main().findByText('run-quality 에는 이 영역이 없다 — design-system 근거'),
    ).toBeTruthy();
  });
});
