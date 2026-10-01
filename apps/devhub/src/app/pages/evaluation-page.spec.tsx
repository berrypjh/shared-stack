import { act, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { type NavigateFunction, useNavigate } from 'react-router-dom';

import { MEASURES } from '@/components/evaluation/measures';
import { catalog } from '@/data';
import { collectCommand } from '@/lib/evaluation/status';
import { evalArtifact } from '@/test/evaluation/evals';
import { OTHER_SHA, SHA } from '@/test/evaluation/fixtures';
import { renderEvaluation } from '@/test/evaluation/render';
import { publicFiles, qualityArtifact, staticArtifact } from '@/test/evaluation/runs';

const files = () => publicFiles([staticArtifact('run-static'), qualityArtifact('run-quality')]);
const main = () => within(screen.getByRole('main'));
const inspector = () => within(screen.getByRole('complementary', { name: '상세 정보' }));
const picker = () => main().findByRole('combobox', { name: '실행' }) as Promise<HTMLSelectElement>;
const explorer = () => within(screen.getByRole('navigation', { name: '저장소 항목' }));
const evaluationSection = () =>
  within(explorer().getByRole('region', { name: /^평가/ }) as HTMLElement);

/** 화면이 빈 index 를 받아 미수집 상태를 그릴 때까지 기다린다 — 뒤늦은 상태 변경이 테스트 밖으로 새지 않게. */
const settled = () => main().findByText('아직 수집한 실행이 없음');

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

describe('평가 항목', () => {
  it('카탈로그의 모든 항목이 화면을 갖는다', () => {
    expect(Object.keys(MEASURES).sort()).toEqual(catalog.evaluations.map((item) => item.id).sort());
  });

  it('탐색기는 항목을 묶음 순서대로 싣고 고른 실행은 같은 묶음으로만 이어 간다 — 필터는 가져가지 않는다', async () => {
    renderEvaluation('/evaluation/bundle-budget?run=local-static-01&package=x', {});
    await settled();
    const section = evaluationSection();
    expect(section.getByRole('link', { name: '평가' }).getAttribute('href')).toBe('/evaluation');
    const budget = section.getByRole('link', { name: '번들 budget' });
    expect(budget.getAttribute('href')).toBe('/evaluation/bundle-budget?run=local-static-01');
    expect(budget.getAttribute('aria-current')).toBe('page');
    expect(section.getByRole('link', { name: '트리셰이킹 진단' }).getAttribute('href')).toBe(
      '/evaluation/treeshake?run=local-static-01',
    );
    const routing = section.getByRole('link', { name: '라우팅' });
    expect(routing.getAttribute('href')).toBe('/evaluation/eval-routing');
    expect(routing.getAttribute('aria-current')).toBeNull();
    const groups = [
      ...explorer().getByRole('region', { name: /^평가/ }).querySelectorAll('details'),
    ];
    expect(groups.map((group) => group.querySelector('summary span')?.textContent)).toEqual([
      '번들',
      '컨텍스트',
      '소비자 평가',
    ]);
  });

  it('제목 · 문서 제목은 항목 이름이다', async () => {
    renderEvaluation('/evaluation/context-tokens', files());
    expect(main().getByRole('heading', { level: 1 }).textContent).toBe('컨텍스트 토큰');
    expect(document.title).toContain('컨텍스트 토큰 · 평가');
    await picker();
  });

  it('실행 목록은 그 영역이 있는 실행뿐이고 기본은 그중 마지막이다', async () => {
    const mixed = publicFiles([
      qualityArtifact('run-quality'),
      evalArtifact('run-eval'),
      staticArtifact('run-static'),
    ]);
    const options = (select: HTMLSelectElement) =>
      [...select.options].map((option) => option.value);

    const bundle = renderEvaluation('/evaluation/bundle-budget', mixed);
    const bundleSelect = await picker();
    await waitFor(() => expect(bundleSelect.value).toBe('run-quality'));
    expect(options(bundleSelect)).toEqual(['run-quality']);
    bundle.unmount();

    renderEvaluation('/evaluation/eval-scorecard', mixed);
    const evalSelect = await picker();
    await waitFor(() => expect(evalSelect.value).toBe('run-eval'));
    expect(options(evalSelect)).toEqual(['run-eval']);
  });

  it('주소로 고른 실행은 영역이 없어도 목록에 남아 왜 비었는지 보인다', async () => {
    renderEvaluation('/evaluation/bundle-budget?run=run-static', files());
    const select = await picker();
    expect([...select.options].map((option) => option.value)).toEqual([
      'run-static',
      'run-quality',
    ]);
    expect(await main().findByText(/run-static 에는 이 영역이 없음/)).toBeTruthy();
  });

  it('영역이 있는 실행이 하나도 없으면 고를 실행 대신 수집 명령을 준다', async () => {
    renderEvaluation('/evaluation/eval-scorecard', files());
    const notice = await main().findByRole('region', {
      name: '이 영역이 있는 공개 실행이 없음 — 성적표',
    });
    expect(within(notice).getByText('pnpm quality:eval')).toBeTruthy();
    expect(main().queryByRole('combobox', { name: '실행' })).toBeNull();
  });

  it('옆 칸은 고른 실행의 상태 · source · 스냅샷 비교를 말한다', async () => {
    renderEvaluation('/evaluation/bundle-budget?run=run-quality', files());
    const run = within(await inspector().findByRole('region', { name: /^고른 실행/ }));
    expect(await run.findByText('완료')).toBeTruthy();
    expect(run.getByText(SHA.slice(0, 7))).toBeTruthy();
    expect(run.getByText('기준과 같음')).toBeTruthy();
  });

  it('stale · partial 을 성공처럼 두지 않는다', async () => {
    renderEvaluation(
      '/evaluation/bundle-budget?run=run-quality',
      publicFiles([qualityArtifact('run-quality', { state: 'partial' })]),
      { expectedSha: OTHER_SHA },
    );
    const run = within(await inspector().findByRole('region', { name: /^고른 실행/ }));
    expect(await run.findByText('일부만 수집')).toBeTruthy();
    expect(run.getByText('기준과 다름')).toBeTruthy();
    expect(main().getByText('일부만 수집된 실행')).toBeTruthy();
    expect(main().getByText('지금 코드와 다른 커밋에서 잰 실행')).toBeTruthy();
  });

  it('이전 · 다음은 같은 묶음일 때만 고른 실행을 이어 간다', async () => {
    renderEvaluation('/evaluation/treeshake?run=run-quality', files());
    await main().findByRole('heading', { level: 1, name: '트리셰이킹 진단' });
    expect(
      inspector()
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))
        .filter((href) => href?.startsWith('/evaluation/')),
    ).toEqual([
      '/evaluation/bundle-budget?run=run-quality#devhub-inspector',
      '/evaluation/context-tokens#devhub-inspector',
    ]);
  });

  it('영역이 없는 실행은 요약으로 확인한 그 영역이 있는 실행을 말한다', async () => {
    renderEvaluation(
      '/evaluation/eval-scorecard?run=run-static',
      publicFiles([staticArtifact('run-static'), evalArtifact('run-eval')]),
    );
    expect(await main().findByText(/이 영역이 있는 실행: run-eval/)).toBeTruthy();
  });

  it('실행을 고르면 주소가 바뀌고 뒤로 가면 이전 실행으로 돌아온다 — picker 는 그대로다', async () => {
    const { ref, wrap } = withNavigate();
    const { user, location } = renderEvaluation(
      '/evaluation/bundle-budget',
      publicFiles([qualityArtifact('run-old'), qualityArtifact('run-quality')]),
      { wrap },
    );
    const select = await picker();
    await waitFor(() => expect(select.value).toBe('run-quality'));
    await user.selectOptions(select, 'run-old');
    expect(location()).toBe('/evaluation/bundle-budget?run=run-old');
    await waitFor(() => expect(main().getByText('run-old 실행을 불러왔음')).toBeTruthy());
    expect(await picker()).toBe(select);

    await act(async () => {
      await ref.navigate?.(-1);
    });
    expect(location()).toBe('/evaluation/bundle-budget');
    await waitFor(() => expect(select.value).toBe('run-quality'));
  });

  it('카탈로그에 없는 항목은 없다고 말한다', () => {
    renderEvaluation('/evaluation/bundles', {});
    expect(main().getByRole('heading', { level: 1 }).textContent).toBe('카탈로그에 없는 항목');
    expect(main().getByText(/bundles/)).toBeTruthy();
  });
});

describe('평가 항목 — 비정상 상태', () => {
  it('주소의 run 이 index 에 없으면 명시 오류다', async () => {
    renderEvaluation('/evaluation/bundle-budget?run=run-z', files());
    expect(await main().findByText('run-z 실행이 index 에 없음')).toBeTruthy();
    expect(main().queryByRole('table')).toBeNull();
  });

  it('모르는 query 는 조용히 버리지 않는다', async () => {
    renderEvaluation('/evaluation/treeshake?foo=1', files());
    expect(await main().findByText('주소의 필터를 읽을 수 없음')).toBeTruthy();
    expect(main().getByText(/알 수 없는 query: foo/)).toBeTruthy();
  });

  it('실행이 계약과 맞지 않으면 오류와 다시 export 명령을 준다', async () => {
    const broken = files();
    broken['/observability/runs/run-quality.json'] = { metadata: 'broken' };
    renderEvaluation('/evaluation/bundle-budget', broken);
    expect(await main().findByText('공개 artifact 가 계약과 맞지 않음')).toBeTruthy();
    expect(main().getByText('pnpm quality:export --run-id=run-quality')).toBeTruthy();
  });

  /** 수집한 실행이 없으면 어떤 항목도 숫자 표를 그리지 않고, 그 항목을 채우는 profile 로 수집하라고 한다. */
  it.each(catalog.evaluations)(
    '/evaluation/$id 는 미수집 상태와 $collectProfile 수집 명령을 말하고 값 표를 그리지 않는다',
    async ({ id, collectProfile }) => {
      renderEvaluation(`/evaluation/${id}`, {});
      const notice = await main().findByRole('region', { name: '아직 수집한 실행이 없음' });
      expect(within(notice).getByText(collectCommand(collectProfile))).toBeTruthy();
      expect(main().queryByText(/--profile=static/)).toBeNull();
      // 돌리는 법 표(명령)만 있고, 측정값 표는 없다.
      expect(
        main()
          .queryAllByRole('table')
          .map(
            (table) =>
              table.getAttribute('aria-label') ?? table.querySelector('caption')?.textContent,
          ),
      ).toEqual(MEASURES[id].howTo ? ['평가 돌리는 명령'] : []);
    },
  );
});
