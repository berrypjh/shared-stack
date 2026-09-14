import { act, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fakeEnv, fakeMatchMedia, fakeObserver } from '../../../test/browser';
import { locationOf, renderApp } from '../../../test/render';

const MEDIA = {
  '(prefers-color-scheme: light)': true,
  '(prefers-reduced-motion: reduce)': true,
  '(forced-colors: none)': true,
  '(pointer: fine)': true,
  '(hover: hover)': true,
  '(any-pointer: fine)': true,
  '(any-hover: hover)': true,
};

const setup = ({ buffered = {} }: { buffered?: Record<string, unknown[]> } = {}) => {
  const media = fakeMatchMedia(MEDIA);
  const observer = fakeObserver({
    supported: ['navigation', 'resource', 'paint', 'layout-shift'],
    buffered,
  });
  const getContext = vi.fn((id: string) => (id === 'webgl2' ? { getExtension: () => null } : null));
  const createCanvas = vi.fn(() => ({ getContext }));
  const env = fakeEnv({
    matchMedia: media.matchMedia,
    PerformanceObserver: observer.Observer,
    createCanvas,
  });
  return { env, media, observer, createCanvas };
};

const open = (path: string, env: ReturnType<typeof setup>['env'], strict = false) =>
  renderApp(path, {}, undefined, { browserEnv: env, strict });

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const rowOf = (table: HTMLElement, label: string) => {
  const header = within(table).getByRole('rowheader', { name: new RegExp(`^${escape(label)}`) });
  return header.closest('tr') as HTMLTableRowElement;
};

const shift = (value: number, startTime = 10) => ({
  entryType: 'layout-shift',
  name: '',
  startTime,
  duration: 0,
  value,
  hadRecentInput: false,
});

describe('브라우저 세션 — Environment', () => {
  it('값·단위·측정 시각·제한을 나란히 두고, 모든 keyword false 는 지원 안 함이다', async () => {
    open('/browser', setup().env);
    const table = await screen.findByRole('table', { name: 'Environment' });
    const width = rowOf(table, 'viewport 너비');
    for (const text of [
      '1,280 CSS px',
      '측정됨',
      '2023-11-14T22:13:20.000Z',
      'scrollbar 를 포함한 창 안쪽 너비',
    ]) {
      expect(width.textContent).toContain(text);
    }
    expect(rowOf(table, '동작 줄이기 선호').textContent).toContain('reduce');
    const contrast = rowOf(table, '대비 선호');
    expect(contrast.textContent).toContain('지원 안 함');
    expect(contrast.textContent).toContain('모든 keyword 가 false');
  });

  it('media 변화는 표를 다시 읽고 알림은 상태 글로 준다 — 포커스를 옮기지 않는다', async () => {
    const { env, media } = setup();
    open('/browser', env);
    const table = await screen.findByRole('table', { name: 'Environment' });
    const focused = document.activeElement;
    act(() => {
      media.set('(prefers-color-scheme: light)', false);
      media.set('(prefers-color-scheme: dark)', true);
    });
    expect(rowOf(table, '색 구성 선호').textContent).toContain('dark');
    expect(await screen.findByText(/환경 값이 바뀌어 다시 읽었습니다/)).toBeTruthy();
    expect(document.activeElement).toBe(focused);
  });
});

describe('브라우저 세션 — Capabilities', () => {
  it('실제 false 와 지원 안 함을 다른 글로 쓰고 storage 0 은 실제 0 이다', async () => {
    open('/browser?panel=capabilities', setup().env);
    const table = await screen.findByRole('table', { name: 'Capabilities' });
    const isolated = rowOf(table, 'cross-origin isolated');
    expect(isolated.textContent).toContain('false (측정값)');
    const shared = rowOf(table, 'SharedArrayBuffer 전역');
    expect(shared.textContent).toContain('값 없음 — 지원 안 함');
    expect(shared.textContent).not.toContain('false');
    await waitFor(() => expect(rowOf(table, '사용량 추정').textContent).toContain('0 B (근사)'));
  });

  it('지원 안 함 필터는 주소에 남고 일치 수를 알린다', async () => {
    const { user, router } = open('/browser?panel=capabilities', setup().env);
    const table = await screen.findByRole('table', { name: 'Capabilities' });
    await user.click(screen.getByRole('button', { name: '지원 안 함' }));
    expect(locationOf(router)).toBe('/browser?panel=capabilities&status=unsupported');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.textContent).toContain('지원 안 함');
    expect(screen.getByText(/^항목 \d+개 중 필터와 일치 \d+개$/)).toBeTruthy();
  });

  it('WebGL 은 누를 때만 context 를 만들고 포커스는 버튼에 남는다', async () => {
    const { env, createCanvas } = setup();
    const { user } = open('/browser?panel=capabilities', env);
    const table = await screen.findByRole('table', { name: 'Capabilities' });
    expect(createCanvas).not.toHaveBeenCalled();
    expect(rowOf(table, 'WebGL context 가용성').textContent).toContain('측정 안 함');
    const button = screen.getByRole('button', { name: 'WebGL context 확인' });
    await user.click(button);
    expect(createCanvas).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(button);
    expect(rowOf(table, 'WebGL context 가용성').textContent).toContain('webgl2');
  });
});

describe('브라우저 세션 — Performance', () => {
  it('entry 가 오기 전에는 숫자 없이 표본 대기이고, 실제 0 entry 는 측정됨이다', async () => {
    const { env, observer } = setup();
    open('/browser?panel=performance', env);
    const table = await screen.findByRole('table', { name: 'Performance entry 관측' });
    expect(rowOf(table, 'paint').textContent).toContain('표본 대기 — entry 가 아직 없음 (0 아님)');
    expect(rowOf(table, 'longtask').textContent).toContain('지원 안 함');
    expect(rowOf(table, 'navigation').textContent).toContain(
      'hard navigation 한 번 (SPA route 이동 아님)',
    );
    act(() => observer.emit('layout-shift', [shift(0)]));
    expect(rowOf(table, 'layout-shift').textContent).toContain('value 0 · startTime 10.0 ms');
    expect(screen.getAllByText(/Core Web Vitals 가 아닙니다/).length).toBeGreaterThan(0);
  });

  it('TAO 로 가려진 cross-origin resource 의 0 은 크기가 아니고 query 는 싣지 않는다', async () => {
    const { env, observer } = setup();
    open('/browser?panel=performance', env);
    await screen.findByRole('table', { name: 'Performance entry 관측' });
    act(() =>
      observer.emit('resource', [
        {
          entryType: 'resource',
          name: 'https://cdn.example.com/lib.js?token=secret',
          initiatorType: 'script',
          startTime: 5,
          duration: 10,
          requestStart: 0,
          responseStart: 0,
          transferSize: 0,
          encodedBodySize: 0,
          decodedBodySize: 0,
        },
      ]),
    );
    const detail = screen.getByRole('table', { name: /^resource entry/ });
    const row = within(detail).getAllByRole('row')[1];
    expect(row.textContent).toContain('https://cdn.example.com/lib.js');
    expect(row.textContent).toContain('0 — TAO 로 가려짐 (크기 아님)');
    expect(detail.textContent).not.toContain('token');
  });

  it('StrictMode 재실행 뒤 observer 는 type 마다 하나만 살아 있고 entry 를 두 번 세지 않는다', async () => {
    const { env, observer } = setup({
      buffered: { 'layout-shift': [shift(0.1, 5), shift(0.2, 9)] },
    });
    const view = open('/browser?panel=performance', env, true);
    const table = await screen.findByRole('table', { name: 'Performance entry 관측' });
    act(() => observer.flush());
    const active = observer.instances.filter((instance) => !instance.disconnected);
    expect(active).toHaveLength(4);
    expect(observer.instances.length).toBeGreaterThan(active.length);
    expect(rowOf(table, 'layout-shift').querySelectorAll('td')[3].textContent).toBe('2');
    view.unmount();
    expect(observer.instances.every((instance) => instance.disconnected)).toBe(true);
  });
});

describe('브라우저 세션 — 출처', () => {
  it('주소의 artifact run 과 이 세션의 출처·시간을 나눠 말한다', async () => {
    open('/browser?run=local-quality-01', setup().env);
    const source = await screen.findByRole('region', { name: '세션 출처' });
    expect(source.textContent).toContain('local-quality-01 은 저장소 artifact');
    expect(source.textContent).toContain('저장·전송하지 않습니다');
  });

  it('허용하지 않은 보기 값은 오류다', async () => {
    open('/browser?panel=weird', setup().env);
    expect(await screen.findByText('주소의 필터를 읽을 수 없습니다')).toBeTruthy();
  });
});
