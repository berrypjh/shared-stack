import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BarChart } from './BarChart';

const renderChart = () =>
  render(
    <BarChart
      title="Budget 사용"
      description="각 막대는 자기 한도 기준입니다"
      unit="bytes"
      groups={[
        {
          label: '@berrypjh/react-ui',
          bars: [
            {
              key: 'cx',
              label: 'cx only',
              value: 10574,
              scale: 11000,
              marker: 11000,
              text: '10,574 B / 11,000 B',
            },
            { key: 'box', label: 'box only', value: null, scale: null, text: 'N/A — dist 없음' },
            {
              key: 'full',
              label: 'full',
              value: 15857,
              scale: 15857,
              marker: 15100,
              tone: 'over',
              text: '757 B 초과',
            },
          ],
        },
      ]}
    />,
  );

describe('BarChart', () => {
  it('figure 이름·설명·단위를 글로 준다', () => {
    renderChart();
    const figure = screen.getByRole('figure', { name: 'Budget 사용' });
    const description = document.getElementById(figure.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent).toBe('각 막대는 자기 한도 기준입니다 · 단위 bytes');
    expect(within(figure).getByRole('group', { name: '@berrypjh/react-ui' })).toBeTruthy();
  });

  it('값은 막대 길이와 같은 글로 보이고 hover 없이 읽힌다', () => {
    renderChart();
    const [cx, , full] = screen.getAllByRole('listitem');
    expect(cx.dataset.value).toBe('10574');
    expect(cx.querySelector('[data-fill]')?.getAttribute('width')).toBe('96.13');
    expect(cx.querySelector('[data-marker]')?.getAttribute('x1')).toBe('100.00');
    expect(cx.textContent).toContain('10,574 B / 11,000 B');
    expect(full.querySelector('[data-fill]')?.getAttribute('data-tone')).toBe('over');
  });

  it('값이 없으면 0 막대·빈 track 을 그리지 않고 이유를 쓴다', () => {
    renderChart();
    const box = screen.getAllByRole('listitem')[1];
    expect(box.dataset.value).toBe('null');
    expect(box.querySelector('svg')).toBeNull();
    expect(box.textContent).toContain('N/A — dist 없음');
  });
});
