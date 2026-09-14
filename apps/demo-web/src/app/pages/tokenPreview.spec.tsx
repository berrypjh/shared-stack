import { Web } from '@berrypjh/react-ui';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TokenPreview } from './TokenPreview';

/**
 * 미리보기 커버리지. 토큰이 늘었는데 미리보기가 "—" 로만 나오면 이 테스트가 먼저 알려준다.
 */

const leaves: [string, string][] = [];
const walk = (node: unknown, path: string[]) => {
  if (node === null || typeof node !== 'object')
    return void leaves.push([path.join('.'), String(node)]);
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) walk(v, [...path, k]);
};
walk(Web.Light.tokens, []);

const isPlaceholder = ([path, value]: [string, string]) =>
  render(<TokenPreview path={path} value={value} />).container.textContent === '—';

describe('토큰 미리보기', () => {
  it('토큰이 하나 이상 있다', () => {
    expect(leaves.length).toBeGreaterThan(100);
  });

  it('그림이 없는 토큰은 shadow/elevation 의 type 뿐이다', () => {
    const uncovered = leaves.filter(isPlaceholder).map(([path]) => path);
    expect(uncovered.filter((p) => !/^(shadow|elevation)\..*\.type$/.test(p))).toEqual([]);
    expect(uncovered.length).toBeGreaterThan(0);
  });

  it.each([
    ['color.primary.pr500', '#2E90FA'],
    ['spacing.md', '0.5rem'],
    ['radius.lg', '1rem'],
    ['motion.duration.fast', '60ms'],
    ['typography.fontWeight.bold', '700'],
    ['typography.fontSize.lg', '1.25rem'],
    ['motion.easing.standard', 'ease'],
    ['component.button', '0.375rem 1rem'],
  ])('%s 는 그림을 갖는다', (path, value) => {
    expect(isPlaceholder([path, value])).toBe(false);
  });
});
