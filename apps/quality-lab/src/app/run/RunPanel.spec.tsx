import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  bundle,
  contextMeasurement,
  fakeFetch,
  OTHER_SHA,
  publicArtifact,
  publicIndex,
  SHA,
} from '../../test/fixtures';

import { RunPanel } from './RunPanel';

const INDEX = '/observability/index.json';
const RUN = '/observability/runs/run-a.json';

const show = (fetcher: Parameters<typeof RunPanel>[0]['fetcher'], expectedSha = SHA) =>
  render(<RunPanel fetcher={fetcher} expectedSha={expectedSha} />);

const panel = () => screen.getByRole('region', { name: '최근 실행' });

describe('불러오는 동안', () => {
  it('aria-busy 와 polite 상태 알림으로 진행을 알린다', () => {
    // 끝나지 않는 요청 — 화면이 불러오는 중 상태에 머문다.
    show(() => new Promise<Response>(() => undefined));
    expect(panel().getAttribute('aria-busy')).toBe('true');
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('실행 기록을 불러오는 중입니다');
  });
});

describe('문제 상태', () => {
  it('index 가 없으면 미수집 상태를 보여준다', async () => {
    show(fakeFetch({}).fetcher);
    expect(
      await screen.findByRole('heading', { name: '아직 수집한 실행이 없습니다' }),
    ).toBeTruthy();
    expect(panel().getAttribute('aria-busy')).toBe('false');
  });

  it('계약을 어긴 run 은 오류 heading 과 설명을 주고 표를 그리지 않는다', async () => {
    const broken = { ...publicArtifact('run-a'), observations: 'nope' };
    show(fakeFetch({ [INDEX]: publicIndex('run-a'), [RUN]: broken }).fetcher);
    const heading = await screen.findByRole('heading', {
      name: '공개 artifact 가 계약과 맞지 않습니다',
    });
    const problem = heading.closest('section');
    expect(problem?.getAttribute('aria-describedby')).toBeTruthy();
    expect(within(problem as HTMLElement).getByText(/observations/)).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });
});

describe('검증된 실행', () => {
  const ready = (artifact: unknown, expectedSha = SHA) =>
    show(fakeFetch({ [INDEX]: publicIndex('run-a'), [RUN]: artifact }).fetcher, expectedSha);

  it('source SHA·수집 시각·source 종류를 보여준다', async () => {
    ready(publicArtifact('run-a'));
    const summary = await screen.findByRole('region', { name: '실행 요약' });
    expect(within(summary).getByText(SHA)).toBeTruthy();
    expect(within(summary).getByText('2026-09-13T14:00:00.000Z')).toBeTruthy();
    expect(within(summary).getByText('로컬')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('run-a 실행을 불러왔습니다');
  });

  it('값이 없는 관측은 상태 이름과 이유를 함께 보여준다', async () => {
    ready(publicArtifact('run-a'));
    const table = await screen.findByRole('table', { name: '관측 항목' });
    const notRun = within(table).getByRole('row', { name: /test\.quality-lab/ });
    expect(notRun.textContent).toContain(
      '실행 안 함 — static profile 은 정의만 읽고 명령을 실행하지 않습니다',
    );
    const measured = within(table).getByRole('row', { name: /bundle\.react-ui\.gzip/ });
    expect(measured.textContent).toContain('0 B');
  });

  it('partial 과 stale 을 알린다', async () => {
    ready(publicArtifact('run-a', { state: 'partial' }), OTHER_SHA);
    expect(await screen.findByText(/partial 실행/)).toBeTruthy();
    expect(
      screen.getByText(new RegExp(`${SHA.slice(0, 7)}.*${OTHER_SHA.slice(0, 7)}`)),
    ).toBeTruthy();
  });

  it('budget 은 초과·남은 값을 글로 주고, 값 없는 budget 은 빈 막대와 이유를 준다', async () => {
    ready({
      ...publicArtifact('run-a'),
      bundles: [
        bundle(),
        bundle({
          id: 'bundle.size-limit.react-ui.cx-only',
          caseName: '@berrypjh/react-ui — cx only',
          availability: 'unavailable',
          value: null,
          reason: 'libs/react-ui/dist/index.esm.js 가 없다',
          budget: {
            limitBytes: 11000,
            limitSource: '11 KB',
            headroomBytes: null,
            outcome: null,
            toolPassed: null,
          },
        }),
        bundle({
          id: 'bundle.treeshake.react-ui.single-cx.gzip',
          caseName: 'single: cx',
          role: 'diagnostic',
          method: 'treeshake-esbuild',
          tool: { name: 'esbuild', version: '0.27.2' },
          entry: '@berrypjh/react-ui',
          importSpec: '{ cx }',
          target: 'esbuild-default',
          compression: 'gzip',
          adjustment: 'none',
          value: 10697,
          budget: null,
        }),
      ],
    });
    const table = await screen.findByRole('table', { name: 'bundle 측정' });
    const over = within(table).getByRole('row', { name: /\* \(full\)/ });
    expect(over.textContent).toContain('757 B 초과');
    expect(over.textContent).toContain('15,857 B (15.86 KB)');
    expect(over.textContent).toContain('brotli');
    const missing = within(table).getByRole('row', { name: /cx only/ });
    expect(missing.textContent).toContain('값 없음 — libs/react-ui/dist/index.esm.js 가 없다');
    expect(within(missing).getByTestId('budget-bar-fill').style.width).toBe('0%');
    const diagnostic = within(table).getByRole('row', { name: /single: cx/ });
    expect(diagnostic.textContent).toContain('진단 (보고 전용)');
    expect(diagnostic.textContent).toContain('gzip');
  });

  it('context 는 누락된 입력을 이유와 함께 보여준다', async () => {
    ready({ ...publicArtifact('run-a'), contexts: [contextMeasurement()] });
    const table = await screen.findByRole('table', { name: 'context 측정' });
    expect(table.textContent).toContain('libs/design-tokens/dist/AGENTS.md');
    expect(table.textContent).toContain('측정 안 됨');
  });

  it('다시 불러오다 실패해도 마지막으로 검증된 실행을 유지한다', async () => {
    const files: Record<string, unknown> = {
      [INDEX]: publicIndex('run-a'),
      [RUN]: publicArtifact('run-a'),
    };
    show(fakeFetch(files).fetcher);
    await screen.findByRole('region', { name: '실행 요약' });

    files[RUN] = '<!doctype html>';
    await userEvent.click(screen.getByRole('button', { name: '다시 불러오기' }));

    expect(
      await screen.findByRole('heading', { name: '공개 artifact 가 계약과 맞지 않습니다' }),
    ).toBeTruthy();
    await waitFor(() => expect(panel().getAttribute('aria-busy')).toBe('false'));
    expect(within(screen.getByRole('region', { name: '실행 요약' })).getByText(SHA)).toBeTruthy();
    expect(screen.getByText('마지막으로 검증된 실행을 계속 보여줍니다')).toBeTruthy();
  });
});
