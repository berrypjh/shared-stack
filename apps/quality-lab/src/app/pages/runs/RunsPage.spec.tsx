import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { locationOf, renderApp } from '../../../test/render';
import { designArtifact, publicFiles, qualityArtifact } from '../../../test/runs';

const files = () => publicFiles([designArtifact('run-design'), qualityArtifact('run-quality')]);

describe('실행 기록', () => {
  it('실행을 요약과 함께 나열하고 run 전체는 고른 것만 받는다', async () => {
    const { calls } = renderApp('/runs', files());
    const table = await screen.findByRole('table', { name: '공개된 실행' });
    const quality = await within(table).findByRole('row', { name: /run-quality/ });
    expect(quality.textContent).toContain('core');
    expect(quality.textContent).toContain('완료');
    expect(await screen.findByRole('table', { name: '관측 항목' })).toBeTruthy();
    const urls = calls.map((call) => call.url);
    expect(urls).toContain('/observability/runs/run-quality.json');
    expect(urls).not.toContain('/observability/runs/run-design.json');
  });

  it('실행을 누르면 주소와 detail 이 그 실행으로 바뀐다', async () => {
    const { user, router } = renderApp('/runs', files());
    const table = await screen.findByRole('table', { name: '공개된 실행' });
    await user.click(await within(table).findByRole('link', { name: 'run-design' }));
    expect(locationOf(router)).toBe('/runs?run=run-design');
    const summary = await screen.findByRole('region', { name: '실행 요약' });
    expect(await within(summary).findByText('run-design')).toBeTruthy();
  });

  it('요약 없이 export 된 run 은 요약 없음과 export 명령을 준다', async () => {
    renderApp('/runs', publicFiles([qualityArtifact('run-quality')], { summaries: false }));
    const table = await screen.findByRole('table', { name: '공개된 실행' });
    const row = await within(table).findByRole('row', { name: /run-quality/ });
    expect(await within(row).findByText(/요약 없음/)).toBeTruthy();
    expect(row.textContent).toContain('pnpm quality:export --run-id=run-quality');
  });

  it('개요의 번들 링크는 실행 기록의 번들 표로 온다', async () => {
    renderApp('/runs?run=run-quality#bundles', files());
    expect(await screen.findByRole('table', { name: 'bundle 측정' })).toBeTruthy();
    expect(document.getElementById('bundles')).toBeTruthy();
  });
});
