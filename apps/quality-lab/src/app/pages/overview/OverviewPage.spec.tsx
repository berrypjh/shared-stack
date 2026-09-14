import { act, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { evalArtifact } from '../../../test/evals';
import { OTHER_SHA } from '../../../test/fixtures';
import { locationOf, renderApp } from '../../../test/render';
import { designArtifact, publicFiles, qualityArtifact } from '../../../test/runs';

const files = () => publicFiles([designArtifact('run-design'), qualityArtifact('run-quality')]);
const region = (name: string) => screen.findByRole('region', { name });
const picker = () => screen.findByRole('combobox', { name: '실행' }) as Promise<HTMLSelectElement>;

describe('개요 — 실제 loader 결과', () => {
  it('기본은 index 의 마지막 실행이고 네 영역을 독립 카드로 보여준다', async () => {
    renderApp('/', files());
    expect(await screen.findByRole('heading', { level: 1, name: '개요' })).toBeTruthy();
    const select = await picker();
    await waitFor(() => expect(select.value).toBe('run-quality'));
    for (const name of ['테스트', '번들 budget', '컨텍스트', '평가']) {
      expect(await region(name)).toBeTruthy();
    }
    expect((await region('테스트')).textContent).toContain('test source 2개 · case 5개');
    expect(screen.queryByText(/점수/)).toBeNull();
  });

  it('run 이 담지 않은 영역은 0 이 아니라 이 실행에 없음과 수집 명령이다', async () => {
    renderApp('/?run=run-design', files());
    const tests = await region('테스트');
    expect(await within(tests).findByText('이 실행에 없음')).toBeTruthy();
    expect(tests.textContent).toContain('pnpm quality:collect --profile=core --run-id=<새-run-id>');
    expect(tests.textContent).toContain('run-quality');
    expect((await region('평가')).textContent).toContain('--profile=eval');
  });

  it('stale·partial 을 성공처럼 두지 않는다', async () => {
    renderApp(
      '/?run=run-quality',
      publicFiles([qualityArtifact('run-quality', { state: 'partial' })]),
      OTHER_SHA,
    );
    const status = await region('실행 상태');
    expect(await within(status).findByText('기준 source 와 다른 실행입니다')).toBeTruthy();
    expect(within(status).getByText('일부만 수집된 실행입니다')).toBeTruthy();
  });

  it('baseline 비교는 아직 없다고 말한다', async () => {
    renderApp('/', files());
    const baseline = await region('기준선 비교');
    expect(await within(baseline).findByText('해당 없음')).toBeTruthy();
  });
});

describe('개요 — 도메인 화면으로 한 번에', () => {
  it('번들 카드는 번들 화면의 같은 실행으로 간다', async () => {
    const { user, router } = renderApp('/', files());
    const bundles = await region('번들 budget');
    await user.click(await within(bundles).findByRole('link', { name: '번들 화면 보기' }));
    expect(locationOf(router)).toBe('/bundles?run=run-quality');
    expect(await screen.findByRole('table', { name: 'size-limit budget' })).toBeTruthy();
  });

  it('평가가 없는 실행의 컨텍스트 카드는 package-scenario panel 을 연다', async () => {
    const { user, router } = renderApp('/', files());
    const contexts = await region('컨텍스트');
    await user.click(await within(contexts).findByRole('link', { name: '컨텍스트 표 보기' }));
    expect(locationOf(router)).toBe('/ai?run=run-quality&panel=scenario');
    expect(await screen.findByRole('table', { name: 'Context — package-scenario' })).toBeTruthy();
  });

  it('평가 카드는 AI 평가 화면으로 간다', async () => {
    const { user, router } = renderApp('/', publicFiles([evalArtifact('run-eval')]));
    const evals = await region('평가');
    await user.click(await within(evals).findByRole('link', { name: 'AI 평가 보기' }));
    expect(locationOf(router)).toBe('/ai?run=run-eval');
    expect(await screen.findByRole('region', { name: '평가 출처' })).toBeTruthy();
  });
});

describe('개요 — 근거까지 두 단계', () => {
  it('최근 실패의 check 를 누르면 실패한 행과 발췌가 보인다', async () => {
    const { user, router } = renderApp('/', files());
    const failures = await region('최근 실패');
    await user.click(await within(failures).findByRole('link', { name: 'typecheck.quality-lab' }));
    expect(await screen.findByRole('heading', { level: 1, name: '검증' })).toBeTruthy();
    expect(locationOf(router)).toBe('/quality/checks?run=run-quality&status=failed');
    const row = await screen.findByRole('row', { name: /typecheck\.quality-lab/ });
    expect(row.textContent).toContain('실패');
    expect(row.textContent).toContain('TS2305');
  });

  it('최근 실패의 test source 를 누르면 실패 case 와 파일 경로가 보인다', async () => {
    const { user } = renderApp('/', files());
    const failures = await region('최근 실패');
    await user.click(
      await within(failures).findByRole('link', { name: 'vitest:@berrypjh/react-ui' }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: '테스트' })).toBeTruthy();
    const cases = await screen.findByRole('table', { name: 'test case' });
    const rows = within(cases).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Button focus ring');
    expect(rows[0].textContent).toContain('libs/react-ui/src/Button.test.tsx');
  });

  it('실행을 고르면 주소가 바뀌고 뒤로 가면 이전 실행으로 돌아온다 — picker 는 그대로다', async () => {
    const { user, router } = renderApp('/', files());
    const select = await picker();
    await waitFor(() => expect(select.value).toBe('run-quality'));
    await user.selectOptions(select, 'run-design');
    expect(locationOf(router)).toBe('/?run=run-design');
    expect(await within(await region('테스트')).findByText('이 실행에 없음')).toBeTruthy();
    expect(await picker()).toBe(select);

    await act(() => router.navigate(-1));
    expect(locationOf(router)).toBe('/');
    await waitFor(() => expect(select.value).toBe('run-quality'));
  });
});

describe('개요 — 비정상 상태', () => {
  it('주소의 run 이 index 에 없으면 명시 오류다', async () => {
    renderApp('/?run=run-z', files());
    expect(await screen.findByText('run-z 실행이 index 에 없습니다')).toBeTruthy();
    expect(screen.queryByRole('region', { name: '테스트' })).toBeNull();
  });

  it('모르는 query 는 조용히 버리지 않는다', async () => {
    renderApp('/?foo=1', files());
    expect(await screen.findByText('주소의 필터를 읽을 수 없습니다')).toBeTruthy();
    expect(screen.getByText(/알 수 없는 query: foo/)).toBeTruthy();
  });

  it('요약이 계약과 맞지 않으면 오류와 다시 export 명령을 준다', async () => {
    const broken = files();
    broken['/observability/runs/run-quality.summary.json'] = { metadata: 'broken' };
    renderApp('/', broken);
    expect(await screen.findByText('공개 artifact 가 계약과 맞지 않습니다')).toBeTruthy();
    expect(screen.getByText('pnpm quality:export --run-id=run-quality')).toBeTruthy();
  });

  it('요약 없이 export 된 run 은 run 전체를 받지 않고 다시 export 하라고 한다', async () => {
    const { calls } = renderApp(
      '/',
      publicFiles([qualityArtifact('run-quality')], { summaries: false }),
    );
    expect(await screen.findByText(/요약 파일이 index 에 없습니다/)).toBeTruthy();
    expect(calls.map((call) => call.url)).not.toContain('/observability/runs/run-quality.json');
  });

  it('데이터가 없는 clean clone 은 미수집 상태와 복사 버튼만 보여준다', async () => {
    renderApp('/', {});
    expect(
      await screen.findByRole('heading', { name: '아직 수집한 실행이 없습니다' }),
    ).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /복사/ })).toHaveLength(2);
    expect(screen.queryByRole('table')).toBeNull();
  });
});
