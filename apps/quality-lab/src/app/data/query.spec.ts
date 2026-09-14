import { describe, expect, it } from 'vitest';

import { parseQuery, queryString } from './query';

const parse = (search: string, spec: Parameters<typeof parseQuery>[1]) =>
  parseQuery(new URLSearchParams(search), spec);

const ALL = { keys: ['run', 'package', 'status', 'q'], statuses: ['failed', 'passed'] } as const;

describe('parseQuery — 허용 목록만 읽는다', () => {
  it('run·package·status·q 를 읽는다', () => {
    expect(
      parse('run=local-quality-01&package=%40berrypjh%2Freact-ui&status=failed&q=Button', ALL),
    ).toEqual({
      ok: true,
      value: {
        run: 'local-quality-01',
        package: '@berrypjh/react-ui',
        status: 'failed',
        q: 'Button',
      },
    });
  });

  it('값이 없으면 빈 query 다', () => {
    expect(parse('', ALL)).toEqual({ ok: true, value: {} });
  });

  it('모르는 key 와 그 페이지가 받지 않는 key 는 거부한다', () => {
    expect(parse('foo=1', ALL)).toEqual({ ok: false, issues: ['알 수 없는 query: foo'] });
    expect(parse('status=failed', { keys: ['run'] })).toEqual({
      ok: false,
      issues: ['이 페이지는 status 를 받지 않습니다'],
    });
  });

  it('run id 는 계약 형식이어야 한다', () => {
    const result = parse('run=..%2Fx', ALL);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.issues[0]).toContain('run');
  });

  it('허용하지 않은 status·package 형식은 거부한다', () => {
    expect(parse('status=weird', ALL)).toEqual({
      ok: false,
      issues: ['status 는 failed, passed 중 하나여야 합니다'],
    });
    expect(parse('package=a%20b', ALL).ok).toBe(false);
  });

  it('같은 key 가 둘이면 어느 쪽인지 추측하지 않는다', () => {
    expect(parse('run=a&run=b', ALL)).toEqual({ ok: false, issues: ['run 이 두 번 있습니다'] });
  });

  it('q 는 100자를 넘거나 제어 문자를 담을 수 없다', () => {
    expect(parse(`q=${'x'.repeat(101)}`, ALL).ok).toBe(false);
    expect(parse('q=a%0Ab', ALL).ok).toBe(false);
  });
});

describe('parseQuery — 도메인 화면 key', () => {
  const DOMAIN = {
    keys: ['run', 'base', 'variant', 'panel', 'platform'],
    panels: ['initial', 'routed'],
  } as const;

  it('base·variant·panel·platform 을 읽는다', () => {
    expect(
      parse(
        'run=run-a&base=run-b&variant=progressive-with-repair&panel=routed&platform=react-native',
        DOMAIN,
      ),
    ).toEqual({
      ok: true,
      value: {
        run: 'run-a',
        base: 'run-b',
        variant: 'progressive-with-repair',
        panel: 'routed',
        platform: 'react-native',
      },
    });
  });

  it('panel·platform 은 정해진 값만, base·variant 는 id 형식만 받는다', () => {
    expect(parse('panel=weird', DOMAIN)).toEqual({
      ok: false,
      issues: ['panel 은 initial, routed 중 하나여야 합니다'],
    });
    expect(parse('platform=ios', DOMAIN)).toEqual({
      ok: false,
      issues: ['platform 은 web, react-native 중 하나여야 합니다'],
    });
    expect(parse('base=..%2Fx', DOMAIN).ok).toBe(false);
    expect(parse('variant=Bad%20Name', DOMAIN).ok).toBe(false);
  });

  it('target 은 audit target id 형식만 받는다', () => {
    const spec = { keys: ['run', 'target'] } as const;
    expect(parse('target=quality-lab%3A%2Fbundles%3Adark%3Amobile', spec)).toEqual({
      ok: true,
      value: { target: 'quality-lab:/bundles:dark:mobile' },
    });
    expect(parse('target=%3Cscript%3E', spec).ok).toBe(false);
  });

  it('도메인 key 도 정해진 순서로 쓴다', () => {
    expect(queryString({ panel: 'routed', variant: 'v-1', base: 'run-b', run: 'run-a' })).toBe(
      '?run=run-a&base=run-b&variant=v-1&panel=routed',
    );
  });
});

describe('queryString — 같은 필터는 같은 주소다', () => {
  it('정해진 순서로 쓰고 빈 값은 뺀다', () => {
    expect(queryString({ q: 'x', status: 'failed', run: 'run-a', package: undefined })).toBe(
      '?run=run-a&status=failed&q=x',
    );
    expect(queryString({})).toBe('');
  });

  it('parse 한 결과를 다시 쓰면 같은 query 가 된다', () => {
    const search = '?run=run-a&package=%40berrypjh%2Freact-ui&status=passed';
    const parsed = parse(search.slice(1), ALL);
    expect(parsed.ok && queryString(parsed.value)).toBe(search);
  });
});
