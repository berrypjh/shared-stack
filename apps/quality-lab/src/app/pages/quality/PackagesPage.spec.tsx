import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { locationOf, renderApp } from '../../../test/render';
import { designArtifact, publicFiles, qualityArtifact } from '../../../test/runs';

const files = () => publicFiles([designArtifact('run-design'), qualityArtifact('run-quality')]);

describe('패키지 표면', () => {
  it('선언과 실제 산출물을 나눠 보여주고 partial 을 성공으로 두지 않는다', async () => {
    renderApp('/quality/packages?run=run-design', files());
    const table = await screen.findByRole('table', { name: '패키지 표면' });
    const rn = within(table).getByRole('row', { name: /@berrypjh\/react-native-ui/ });
    expect(rn.textContent).toContain('partial');
    expect(rn.textContent).toContain('1/2');
    const targets = screen.getByRole('table', { name: '@berrypjh/react-native-ui exports 대상' });
    const missing = within(targets).getByRole('row', { name: /\.\/tokens/ });
    expect(missing.textContent).toContain('없음');
  });

  it('catalog drift 와 deprecated export 를 원본 표시대로 보여준다', async () => {
    renderApp('/quality/packages?run=run-design', files());
    const table = await screen.findByRole('table', { name: '패키지 표면' });
    expect(within(table).getByRole('row', { name: /@berrypjh\/react-ui/ }).textContent).toContain(
      '재생성 결과 다름',
    );
    expect(screen.getByText('deprecated: cx, Web')).toBeTruthy();
  });

  it('private import 검사는 test 위치만 있고 실행 결과가 없다고 말한다', async () => {
    renderApp('/quality/packages?run=run-design&package=%40berrypjh%2Freact-ui', files());
    const item = (await screen.findByText(/private import 가 없다/)).closest('li');
    expect(item?.textContent).toContain('tools/lib/package-boundary.test.ts:273');
    expect(item?.textContent).toContain('실행 안 함');
  });

  it('package query 로 한 package 만 보여준다', async () => {
    renderApp('/quality/packages?run=run-design&package=%40berrypjh%2Freact-ui', files());
    const table = await screen.findByRole('table', { name: '패키지 표면' });
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: '@berrypjh/react-native-ui' })).toBeNull();
  });

  it('run 에 없는 package 는 no-match 다', async () => {
    renderApp('/quality/packages?run=run-design&package=%40x%2Fy', files());
    expect(await screen.findByText('필터와 일치하는 항목이 없습니다')).toBeTruthy();
  });

  it('표면이 없는 run 은 unsupported 이고 표면이 있는 run 으로 간다', async () => {
    const { user, router } = renderApp('/quality/packages?run=run-quality', files());
    expect(await screen.findByText('run-quality 에는 패키지 표면 이 없습니다')).toBeTruthy();
    await user.click(await screen.findByRole('link', { name: 'run-design' }));
    expect(locationOf(router)).toBe('/quality/packages?run=run-design');
  });
});
