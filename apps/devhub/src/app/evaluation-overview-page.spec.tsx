import { act, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { type NavigateFunction, useNavigate } from 'react-router-dom';

import { evalArtifact } from '@/test/evaluation/evals';
import { OTHER_SHA } from '@/test/evaluation/fixtures';
import { renderEvaluation } from '@/test/evaluation/render';
import { publicFiles, qualityArtifact, staticArtifact } from '@/test/evaluation/runs';

const EVAL_COLLECT =
  'pnpm quality:collect --profile=eval --from=tmp/llm-evals/<평가-폴더> --run-id=<새-run-id>';

const files = () => publicFiles([staticArtifact('run-static'), qualityArtifact('run-quality')]);
const main = () => within(screen.getByRole('main'));
const region = (name: string) => main().findByRole('region', { name });
const picker = () => main().findByRole('combobox', { name: '실행' }) as Promise<HTMLSelectElement>;

/** 셸 밖에서 뒤로 가기를 부르기 위해 앱 안의 navigate 를 꺼낸다. */
const withNavigate = () => {
  const ref: { navigate: NavigateFunction | null } = { navigate: null };
  const Capture = () => {
    ref.navigate = useNavigate();
    return null;
  };
  const wrap = (app: ReactNode) => (
    <>
      <Capture />
      {app}
    </>
  );
  return { ref, wrap };
};

describe('개요 — 실제 loader 결과', () => {
  it('기본은 index 의 마지막 실행이고 세 영역을 독립 카드로 보여 준다', async () => {
    renderEvaluation('/evaluation', files());
    expect(main().getByRole('heading', { level: 1, name: '개요' })).toBeTruthy();
    expect(main().getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const select = await picker();
    await waitFor(() => expect(select.value).toBe('run-quality'));
    for (const name of ['번들 budget', '컨텍스트', '평가']) {
      expect(await region(name)).toBeTruthy();
    }
    expect(main().queryByRole('region', { name: '테스트' })).toBeNull();
    expect(main().queryByText(/점수/)).toBeNull();
  });

  it('run 이 담지 않은 영역은 0 이 아니라 이 실행에 없음과 수집 명령이다', async () => {
    renderEvaluation('/evaluation?run=run-static', files());
    const bundles = await region('번들 budget');
    expect(await within(bundles).findByText('이 실행에 없음')).toBeTruthy();
    expect(bundles.textContent).toContain(
      'pnpm quality:collect --profile=core --run-id=<새-run-id>',
    );
    await waitFor(() => expect(bundles.textContent).toContain('run-quality'));
    expect((await region('평가')).textContent).toContain('--profile=eval');
  });

  it('평가 카드의 수집 명령은 평가 폴더를 받는 eval 명령 그대로다', async () => {
    renderEvaluation('/evaluation?run=run-static', files());
    const evals = await region('평가');
    expect(await within(evals).findByText(EVAL_COLLECT)).toBeTruthy();
    expect(evals.textContent).not.toContain('<dir>');
  });

  it('평가가 없는 실행의 평가 카드는 요약으로 확인한 평가 있는 실행을 말하고 AI 평가로 잇는다', async () => {
    renderEvaluation(
      '/evaluation?run=run-static',
      publicFiles([staticArtifact('run-static'), evalArtifact('run-eval')]),
    );
    const evals = await region('평가');
    const link = await within(evals).findByRole('link', { name: 'run-eval' });
    expect(link.getAttribute('href')).toBe('/evaluation/ai?run=run-eval');
    expect(evals.textContent).toContain('이 영역이 있는 실행: run-eval');
    expect(evals.textContent).not.toContain('이 영역이 있는 공개 실행이 없음');
  });

  it('어느 공개 실행에도 평가가 없으면 그렇게 말한다', async () => {
    const { calls } = renderEvaluation('/evaluation?run=run-static', files());
    const evals = await region('평가');
    await waitFor(() =>
      expect(calls.map((call) => call.url)).toContain(
        '/observability/runs/run-quality.summary.json',
      ),
    );
    await waitFor(() => expect(evals.textContent).toContain('이 영역이 있는 공개 실행이 없음'));
    expect(within(evals).queryByRole('link', { name: /^run-/ })).toBeNull();
  });

  it('번들 · 컨텍스트 카드도 그 영역이 있는 실행을 요약으로 말한다', async () => {
    renderEvaluation('/evaluation?run=run-static', files());
    const bundles = await region('번들 budget');
    const bundleRun = await within(bundles).findByRole('link', { name: 'run-quality' });
    expect(bundleRun.getAttribute('href')).toBe('/evaluation/bundles?run=run-quality');
    expect(bundles.textContent).toContain('이 영역이 있는 실행: run-quality');
    const contexts = await region('컨텍스트');
    const contextRun = await within(contexts).findByRole('link', { name: 'run-quality' });
    expect(contextRun.getAttribute('href')).toBe('/evaluation/ai?run=run-quality&panel=scenario');
  });

  it('stale·partial 을 성공처럼 두지 않는다', async () => {
    renderEvaluation(
      '/evaluation?run=run-quality',
      publicFiles([qualityArtifact('run-quality', { state: 'partial' })]),
      { expectedSha: OTHER_SHA },
    );
    const status = await region('실행 상태');
    expect(await within(status).findByText('기준 source 와 다른 실행')).toBeTruthy();
    expect(within(status).getByText('일부만 수집된 실행')).toBeTruthy();
  });

  it('baseline 비교는 아직 없다고 말한다', async () => {
    renderEvaluation('/evaluation', files());
    const baseline = await region('기준선 비교');
    expect(await within(baseline).findByText('해당 없음')).toBeTruthy();
  });
});

describe('개요 — 도메인 화면으로 한 번에', () => {
  it('번들 카드는 번들 화면의 같은 실행으로 간다', async () => {
    const { user, location } = renderEvaluation('/evaluation', files());
    const bundles = await region('번들 budget');
    await user.click(await within(bundles).findByRole('link', { name: '번들 화면 보기' }));
    expect(location()).toBe('/evaluation/bundles?run=run-quality');
    expect(await main().findByRole('table', { name: 'size-limit budget' })).toBeTruthy();
  });

  it('평가가 없는 실행의 컨텍스트 카드는 package-scenario panel 을 연다', async () => {
    const { user, location } = renderEvaluation('/evaluation', files());
    const contexts = await region('컨텍스트');
    await user.click(await within(contexts).findByRole('link', { name: '컨텍스트 표 보기' }));
    expect(location()).toBe('/evaluation/ai?run=run-quality&panel=scenario');
    expect(await main().findByRole('table', { name: 'Context — package-scenario' })).toBeTruthy();
  });

  it('평가 카드는 AI 평가 화면으로 간다', async () => {
    const { user, location } = renderEvaluation(
      '/evaluation',
      publicFiles([evalArtifact('run-eval')]),
    );
    const evals = await region('평가');
    await user.click(await within(evals).findByRole('link', { name: 'AI 평가 보기' }));
    expect(location()).toBe('/evaluation/ai?run=run-eval');
    expect(await main().findByRole('region', { name: '평가 출처' })).toBeTruthy();
  });
});

describe('개요 — 근거까지 두 단계', () => {
  it('최근 실패의 번들을 누르면 번들 화면의 그 행에 포커스가 간다', async () => {
    const { user, location } = renderEvaluation('/evaluation', files());
    const failures = await region('최근 실패');
    const id = 'bundle.size-limit.react-native-ui.full';
    expect(failures.textContent).toContain('757 B 초과');
    await user.click(await within(failures).findByRole('link', { name: id }));
    expect(await main().findByRole('heading', { level: 1, name: '번들' })).toBeTruthy();
    expect(location()).toBe(`/evaluation/bundles?run=run-quality#bundle-${id}`);
    await waitFor(() => expect(document.activeElement?.id).toBe(`bundle-${id}`));
  });

  it('실행을 고르면 주소가 바뀌고 뒤로 가면 이전 실행으로 돌아온다 — picker 는 그대로다', async () => {
    const { ref, wrap } = withNavigate();
    const { user, location } = renderEvaluation('/evaluation', files(), { wrap });
    const select = await picker();
    await waitFor(() => expect(select.value).toBe('run-quality'));
    await user.selectOptions(select, 'run-static');
    expect(location()).toBe('/evaluation?run=run-static');
    expect(await within(await region('번들 budget')).findByText('이 실행에 없음')).toBeTruthy();
    expect(await picker()).toBe(select);

    await act(async () => {
      await ref.navigate?.(-1);
    });
    expect(location()).toBe('/evaluation');
    await waitFor(() => expect(select.value).toBe('run-quality'));
  });
});

describe('개요 — 비정상 상태', () => {
  it('주소의 run 이 index 에 없으면 명시 오류다', async () => {
    renderEvaluation('/evaluation?run=run-z', files());
    expect(await main().findByText('run-z 실행이 index 에 없음')).toBeTruthy();
    expect(main().queryByRole('region', { name: '번들 budget' })).toBeNull();
  });

  it('모르는 query 는 조용히 버리지 않는다', async () => {
    renderEvaluation('/evaluation?foo=1', files());
    expect(await main().findByText('주소의 필터를 읽을 수 없음')).toBeTruthy();
    expect(main().getByText(/알 수 없는 query: foo/)).toBeTruthy();
  });

  it('요약이 계약과 맞지 않으면 오류와 다시 export 명령을 준다', async () => {
    const broken = files();
    broken['/observability/runs/run-quality.summary.json'] = { metadata: 'broken' };
    renderEvaluation('/evaluation', broken);
    expect(await main().findByText('공개 artifact 가 계약과 맞지 않음')).toBeTruthy();
    expect(main().getByText('pnpm quality:export --run-id=run-quality')).toBeTruthy();
  });

  it('요약 없이 export 된 run 은 run 전체를 받지 않고 다시 export 하라고 한다', async () => {
    const { calls } = renderEvaluation(
      '/evaluation',
      publicFiles([qualityArtifact('run-quality')], { summaries: false }),
    );
    expect(await main().findByText(/요약 파일이 index 에 없음/)).toBeTruthy();
    expect(calls.map((call) => call.url)).not.toContain('/observability/runs/run-quality.json');
  });

  it('데이터가 없는 clean clone 은 미수집 상태와 복사 버튼만 보여 준다', async () => {
    renderEvaluation('/evaluation', {});
    expect(await main().findByRole('heading', { name: '아직 수집한 실행이 없음' })).toBeTruthy();
    expect(main().getByText('pnpm quality:export --run-id=<새-run-id>')).toBeTruthy();
    expect(main().getAllByRole('button', { name: /복사/ })).toHaveLength(2);
    expect(main().queryByRole('table')).toBeNull();
  });
});
