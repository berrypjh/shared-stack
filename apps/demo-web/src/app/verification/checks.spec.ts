import { describe, expect, it } from 'vitest';

import { CheckResult, Probe, runChecks, sameColor, summarize, toChannels } from './checks';

/**
 * 판정 로직만 검증한다. 실제 토큰 값의 정합성은 design-tokens 테스트가,
 * 브라우저 최종 결과는 Playwright 가 담당한다.
 */

const probe = (over: Partial<Probe> & { vars?: Record<string, string> } = {}): Probe => ({
  vars: {
    '--ds-background-primary': '#136F47',
    '--ds-background-error': '#B42318',
    '--ds-background-primary-rgb': '19 111 71',
    '--ds-primary-btn-default': '#136F47',
    ...over.vars,
  },
  buttonBg: over.buttonBg ?? 'rgb(19, 111, 71)',
  tailwindBg: over.tailwindBg ?? 'rgb(19, 111, 71)',
});

const base = probe({
  vars: {
    '--ds-background-primary': '#047857',
    '--ds-background-error': '#B42318',
    '--ds-background-primary-rgb': '4 120 87',
    '--ds-primary-btn-default': '#047857',
  },
  buttonBg: 'rgb(4, 120, 87)',
  tailwindBg: 'rgb(4, 120, 87)',
});

const status = (rs: CheckResult[], id: string) => rs.find((r) => r.id === id)?.status;

describe('toChannels', () => {
  it('reads 6-digit hex', () => {
    expect(toChannels('#5B21B6')).toBe('91 33 182');
  });

  it('expands 3-digit hex and ignores alpha', () => {
    expect(toChannels('#FFF')).toBe('255 255 255');
    expect(toChannels('#10B98114')).toBe('16 185 129');
  });

  it('reads rgb() and rgba()', () => {
    expect(toChannels('rgb(91, 33, 182)')).toBe('91 33 182');
    expect(toChannels('rgba(91 33 182 / 0.5)')).toBe('91 33 182');
  });

  it('returns null for anything it cannot parse', () => {
    expect(toChannels('')).toBeNull();
    expect(toChannels('transparent')).toBeNull();
  });
});

describe('sameColor', () => {
  it('matches across notations — computed style returns rgb(), tokens are hex', () => {
    expect(sameColor('#5B21B6', 'rgb(91, 33, 182)')).toBe(true);
  });

  it('does not match different colours', () => {
    expect(sameColor('#5B21B6', '#047857')).toBe(false);
  });

  it('never matches when a value is unreadable', () => {
    expect(sameColor('#5B21B6', '')).toBe(false);
  });
});

describe('runChecks', () => {
  it('passes every contract on a healthy pipeline', () => {
    const results = runChecks(base, probe());
    expect(summarize(results)).toEqual({ pass: 5, fail: 0, unknown: 0, total: 5 });
  });

  it('fails when the theme never reaches the CSS variable', () => {
    const results = runChecks(base, probe({ vars: { '--ds-background-primary': '#047857' } }));
    expect(status(results, 'themed')).toBe('fail');
  });

  it('fails when a token the theme should not touch drifted', () => {
    const results = runChecks(base, probe({ vars: { '--ds-background-error': '#123456' } }));
    expect(status(results, 'shared')).toBe('fail');
  });

  it('fails when the derived rgb channel does not follow its source colour', () => {
    const results = runChecks(base, probe({ vars: { '--ds-background-primary-rgb': '1 2 3' } }));
    expect(status(results, 'derived')).toBe('fail');
  });

  it('fails when the rendered component ignores the token', () => {
    const results = runChecks(base, probe({ buttonBg: 'rgb(4, 120, 87)' }));
    expect(status(results, 'react-ui')).toBe('fail');
  });

  it('fails when the tailwind utility ignores the token', () => {
    const results = runChecks(base, probe({ tailwindBg: 'rgb(4, 120, 87)' }));
    expect(status(results, 'tailwind')).toBe('fail');
  });

  it('reports unknown — not fail — when a value could not be measured', () => {
    const results = runChecks(base, probe({ buttonBg: '' }));
    expect(status(results, 'react-ui')).toBe('unknown');
    expect(summarize(results).fail).toBe(0);
  });

  it('names the suspect boundary and both values on failure', () => {
    const results = runChecks(base, probe({ vars: { '--ds-background-primary': '#047857' } }));
    const failed = results.find((r) => r.status === 'fail');
    expect(failed?.boundary).toBeTruthy();
    expect(failed?.actual).toBe('#047857');
  });
});
