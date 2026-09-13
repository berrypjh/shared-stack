import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { locationOf, renderApp } from '../../../test/render';
import { designArtifact, publicFiles, qualityArtifact, testSummary } from '../../../test/runs';

const files = () => publicFiles([designArtifact('run-design'), qualityArtifact('run-quality')]);
const caseRows = () =>
  within(screen.getByRole('table', { name: 'test case' }))
    .getAllByRole('row')
    .slice(1);

describe('테스트 — 원본 count', () => {
  it('source 파일·report 파일·실행 case 수를 다른 열로 보여준다', async () => {
    renderApp('/quality/tests?run=run-quality', files());
    const table = await screen.findByRole('table', { name: 'test source 요약' });
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    const row = within(table).getByRole('row', { name: /vitest:@berrypjh\/react-ui/ });
    const cells = within(row).getAllByRole('cell');
    const column = (name: string) => cells[headers.indexOf(name) - 1].textContent;
    expect(column('source 파일 (scan)')).toBe('4');
    expect(column('report 파일')).toBe('3');
    expect(column('case (실행)')).toBe('3');
    expect(column('실패')).toBe('1');
    expect(column('시도 (재시도)')).toBe('4 (0)');
    expect(column('coverage')).toContain('측정 안 함');
    expect(column('report')).toContain('raw/tests/test.react-ui.json');
  });

  it('필터는 표시만 바꾸고 source 요약은 원본 값이라고 말한다', async () => {
    renderApp('/quality/tests?run=run-quality&status=failed', files());
    expect(
      await screen.findByText(
        '필터는 표시만 바꿉니다. source 요약의 count 는 원본 run 전체 값입니다.',
      ),
    ).toBeTruthy();
  });
});

describe('테스트 — 필터', () => {
  it('상태 필터는 주소와 알림을 함께 바꾸고 포커스를 잃지 않는다', async () => {
    const { user, router } = renderApp('/quality/tests?run=run-quality', files());
    await screen.findByRole('table', { name: 'test case' });
    expect(caseRows()).toHaveLength(5);

    const failed = screen.getByRole('button', { name: '실패' });
    await user.click(failed);
    expect(locationOf(router)).toBe('/quality/tests?run=run-quality&status=failed');
    expect(failed.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(failed);
    const announcement = screen.getByText(/전체 case 5개 중 필터와 일치 1개/);
    expect(announcement.closest('[aria-live="polite"]')).toBeTruthy();
    expect(caseRows()).toHaveLength(1);
  });

  it('검색어는 주소에 남고 이름·파일에서 찾으며 입력 포커스를 유지한다', async () => {
    const { user, router } = renderApp('/quality/tests?run=run-quality', files());
    const search = await screen.findByRole('searchbox', { name: '사례 이름·파일 검색' });
    await user.type(search, 'Loading');
    await waitFor(() =>
      expect(locationOf(router)).toBe('/quality/tests?run=run-quality&q=Loading'),
    );
    expect(document.activeElement).toBe(search);
    expect(caseRows().map((row) => row.textContent)).toEqual([
      expect.stringContaining('Button loading'),
    ]);
  });

  it('일치하는 case 가 없으면 no-match 와 초기화가 있고, 초기화해도 run 은 남는다', async () => {
    const { user, router } = renderApp(
      '/quality/tests?run=run-quality&status=failed&q=zzz',
      files(),
    );
    expect(await screen.findByText('필터와 일치하는 항목이 없습니다')).toBeTruthy();
    expect(screen.queryByRole('table', { name: 'test case' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '필터 초기화' }));
    expect(locationOf(router)).toBe('/quality/tests?run=run-quality');
    expect(await screen.findByRole('table', { name: 'test case' })).toBeTruthy();
  });

  it('package 필터는 source 와 case 를 함께 좁힌다', async () => {
    const { user, router } = renderApp('/quality/tests?run=run-quality', files());
    await user.selectOptions(await screen.findByRole('combobox', { name: '패키지' }), 'tools');
    expect(locationOf(router)).toBe('/quality/tests?run=run-quality&package=tools');
    const sources = screen.getByRole('table', { name: 'test source 요약' });
    expect(within(sources).getAllByRole('row')).toHaveLength(2);
    expect(caseRows()).toHaveLength(2);
  });

  it('고른 package 의 패키지 표면으로 이어진다', async () => {
    const { user } = renderApp(
      '/quality/tests?run=run-quality&package=%40berrypjh%2Freact-ui',
      files(),
    );
    await user.click(
      await screen.findByRole('link', { name: '@berrypjh/react-ui 패키지 표면 보기' }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: '패키지 표면' })).toBeTruthy();
  });
});

describe('테스트 — 이 run 에 없음', () => {
  it('test 결과가 없는 run 은 unsupported 이고 결과가 있는 run 으로 간다', async () => {
    const { user, router } = renderApp('/quality/tests?run=run-design', files());
    expect(await screen.findByText('run-design 에는 테스트 결과 이 없습니다')).toBeTruthy();
    await user.click(await screen.findByRole('link', { name: 'run-quality' }));
    expect(locationOf(router)).toBe('/quality/tests?run=run-quality');
  });
});

describe('테스트 — 끝나지 않은 실행', () => {
  it('시간 초과는 report·count·판정을 만들지 않고 이유를 보여준다', async () => {
    const base = testSummary('@berrypjh/react-ui', []);
    const reason = 'report 를 쓰기 전에 시간 초과로 끝났다';
    const noReport = { value: null, provenance: null, reason };
    const reportKeys = [
      'reportedFiles',
      'suites',
      'cases',
      'passed',
      'failed',
      'skipped',
      'todo',
      'retriedCases',
      'attempts',
    ];
    const timedOut = {
      ...base,
      execution: {
        ...base.execution,
        status: 'timeout',
        exitCode: null,
        reason: '600000ms 안에 끝나지 않았다',
      },
      report: { status: 'missing', format: 'vitest-json', path: null, sha256: null, reason },
      counts: { ...base.counts, ...Object.fromEntries(reportKeys.map((key) => [key, noReport])) },
      durations: { ...base.durations, caseSumMs: noReport },
      outcome: null,
      outcomeReason: '실행이 timeout 으로 끝나 결과가 없다',
    };
    renderApp(
      '/quality/tests?run=run-timeout',
      publicFiles([{ ...qualityArtifact('run-timeout'), tests: [timedOut] }]),
    );

    const table = await screen.findByRole('table', { name: 'test source 요약' });
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    const row = within(table).getByRole('row', { name: /vitest:@berrypjh\/react-ui/ });
    const cells = within(row).getAllByRole('cell');
    const column = (name: string) => cells[headers.indexOf(name) - 1].textContent ?? '';
    expect(column('실행')).toBe('시간 초과');
    for (const name of ['case (실행)', '통과', '실패']) {
      expect(column(name)).not.toBe('0');
      expect(column(name)).toContain(reason);
    }
    expect(column('report')).toContain(reason);
    expect(column('결과')).toContain('판정 없음');
  });
});
