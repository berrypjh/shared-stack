import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { locationOf, renderApp } from '../../../test/render';
import { designArtifact, publicFiles, qualityArtifact } from '../../../test/runs';

const files = () => publicFiles([designArtifact('run-design'), qualityArtifact('run-quality')]);
const rows = () =>
  within(screen.getByRole('table', { name: '검증 결과' }))
    .getAllByRole('row')
    .slice(1);

describe('검증', () => {
  it('lint·typecheck·build·tools 를 서로 다른 검증으로 보여준다', async () => {
    renderApp('/quality/checks?run=run-quality', files());
    await screen.findByRole('table', { name: '검증 결과' });
    expect(rows().map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      'Lint — 정적 규칙',
      'Typecheck — 타입',
      'Build — 산출물',
      'Tools — pnpm tools:check',
    ]);
  });

  it('실패는 exit·발췌를, 실행 안 함은 0 이 아니라 이유를 보여준다', async () => {
    renderApp('/quality/checks?run=run-quality', files());
    const failed = await screen.findByRole('row', { name: /typecheck\.quality-lab/ });
    expect(failed.textContent).toContain('실패');
    expect(failed.textContent).toContain('exit 2');
    expect(failed.textContent).toContain('TS2305');
    const notRun = screen.getByRole('row', { name: /build\.observability-contracts/ });
    expect(notRun.textContent).toContain(
      '실행 안 함 — --only-imports: import 한 report 가 없어 실행하지 않았다',
    );
    expect(notRun.textContent).not.toContain('exit 0');
  });

  it('상태 필터는 주소에 남고 일치 수를 알린다', async () => {
    const { user, router } = renderApp('/quality/checks?run=run-quality', files());
    await screen.findByRole('table', { name: '검증 결과' });
    await user.click(screen.getByRole('button', { name: '통과' }));
    expect(locationOf(router)).toBe('/quality/checks?run=run-quality&status=passed');
    expect(rows()).toHaveLength(2);
    expect(screen.getByText('검증 4개 중 필터와 일치 2개').closest('[aria-live]')).toBeTruthy();
  });

  it('검증 관측이 없는 run 은 unsupported 다', async () => {
    renderApp('/quality/checks?run=run-design', files());
    expect(await screen.findByText('run-design 에는 검증 결과 이 없습니다')).toBeTruthy();
  });
});
