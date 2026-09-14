import { describe, expect, it } from 'vitest';

import { failureHref } from './links';

const failure = (domain: string, id: string, scope = '@berrypjh/react-ui') =>
  ({ domain, id, scope, reason: '실패' }) as Parameters<typeof failureHref>[0];

describe('failureHref — 도메인 실패는 그 도메인 화면의 근거 행으로', () => {
  it('bundle 실패는 번들 화면의 그 행이다', () => {
    expect(failureHref(failure('bundle', 'bundle.size-limit.react-native-ui.full'), 'run-a')).toBe(
      '/bundles?run=run-a#bundle-bundle.size-limit.react-native-ui.full',
    );
  });

  it('context 실패는 측정 범위 panel 을 연다', () => {
    expect(
      failureHref(
        failure('context', 'context.package-scenario.design-tokens.agents-catalog.openai'),
        'run-a',
      ),
    ).toBe(
      '/ai?run=run-a&panel=scenario#context-context.package-scenario.design-tokens.agents-catalog.openai',
    );
    expect(failureHref(failure('context', 'context.variant-routed.x.web.openai'), 'run-a')).toBe(
      '/ai?run=run-a&panel=routed#context-context.variant-routed.x.web.openai',
    );
  });

  it('eval 실패는 AI 평가 화면이다', () => {
    expect(failureHref(failure('eval', 'eval:local-smoke-01'), 'run-a')).toBe('/ai?run=run-a');
  });
});
