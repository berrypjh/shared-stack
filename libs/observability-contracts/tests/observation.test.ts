import { describe, expect, it } from 'vitest';

import { AVAILABILITIES, observationSchema, VERIFICATION_STATUSES } from '../src/index.js';

import { available, missing, verification } from './fixtures.js';

const ok = (input: unknown) => observationSchema.safeParse(input).success;
const MISSING = AVAILABILITIES.filter((a) => a !== 'available');

describe('null 과 0 은 다른 사실이다', () => {
  it('실측 0 은 available 값으로 보존된다', () => {
    expect(observationSchema.parse(available({ value: 0 }))).toMatchObject({
      availability: 'available',
      value: 0,
    });
  });

  it('available 인데 value 가 null 이면 거부한다', () => {
    expect(ok(available({ value: null }))).toBe(false);
  });

  it.each(MISSING)('%s 는 null 과 이유로 표현된다', (availability) => {
    expect(ok(missing(availability))).toBe(true);
  });

  it.each(MISSING)('%s 는 value 0 을 가질 수 없다', (availability) => {
    expect(ok(missing(availability, { value: 0 }))).toBe(false);
  });

  it('값이 없으면 이유가 필요하다', () => {
    expect(ok(missing('not-run', { reason: null }))).toBe(false);
    expect(ok(missing('not-run', { reason: '   ' }))).toBe(false);
  });

  it('available 이 아니면 outcome 을 가질 수 없다 — unsupported 는 pass 가 아니다', () => {
    expect(ok(missing('unsupported', { outcome: 'pass' }))).toBe(false);
  });
});

describe('숫자', () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    '%s 는 거부한다',
    (value) => {
      expect(ok(available({ value }))).toBe(false);
    },
  );

  it('count·bytes·tokens 는 비음수 정수다', () => {
    expect(ok(available({ value: -1 }))).toBe(false);
    expect(ok(available({ value: 1.5 }))).toBe(false);
    expect(ok(available({ domain: 'test', unit: 'count', value: 3 }))).toBe(true);
    expect(ok(available({ domain: 'context', unit: 'tokens', value: -3 }))).toBe(false);
  });

  it('signed delta 는 음수를 허용한다', () => {
    expect(ok(available({ unit: 'bytes-delta', value: -120 }))).toBe(true);
    expect(ok(available({ domain: 'context', unit: 'tokens-delta', value: -3 }))).toBe(true);
  });

  it('ms 는 비음수 소수다', () => {
    expect(ok(available({ domain: 'test', unit: 'ms', value: 12.5 }))).toBe(true);
    expect(ok(available({ domain: 'test', unit: 'ms', value: -0.1 }))).toBe(false);
  });

  describe('ratio 는 분모와 함께 온다', () => {
    const ratio = (overrides: Record<string, unknown>) =>
      available({ domain: 'eval', unit: 'ratio', ...overrides });

    it('0..1 값과 양의 정수 분모', () => {
      expect(ok(ratio({ value: 0.5, denominator: 4 }))).toBe(true);
      expect(ok(ratio({ value: 0, denominator: 1 }))).toBe(true);
    });

    it.each([null, 0, 2.5, -1])('분모 %s 는 거부한다', (denominator) => {
      expect(ok(ratio({ value: 0.5, denominator }))).toBe(false);
    });

    it.each([1.2, -0.1])('범위 밖 %s 는 거부한다', (value) => {
      expect(ok(ratio({ value, denominator: 4 }))).toBe(false);
    });

    it('ratio 가 아니면 분모를 두지 않는다', () => {
      expect(ok(available({ denominator: 4 }))).toBe(false);
    });
  });
});

describe('알 수 없는 입력', () => {
  it('domain 에 등록되지 않은 unit 은 거부한다', () => {
    expect(ok(available({ domain: 'bundle', unit: 'tokens' }))).toBe(false);
    expect(ok(missing('not-run', { domain: 'bundle', unit: 'ms' }))).toBe(false);
  });

  it('알 수 없는 domain·availability·필드는 거부한다', () => {
    expect(ok(available({ domain: 'perf' }))).toBe(false);
    expect(ok(missing('skipped'))).toBe(false);
    expect(ok({ ...available(), rawTrace: 'x' })).toBe(false);
  });
});

describe('verification 은 원본 5상태를 보존한다', () => {
  it('eval harness 와 같은 다섯 상태다', () => {
    expect([...VERIFICATION_STATUSES]).toEqual([
      'passed',
      'failed',
      'not-run',
      'unsupported',
      'timeout',
    ]);
  });

  it.each([
    ['passed', 'available', 'pass', null],
    ['failed', 'available', 'fail', null],
    ['timeout', 'available', 'fail', null],
    ['not-run', 'not-run', null, '실행하지 않았다'],
    ['unsupported', 'unsupported', null, '이 harness 가 지원하지 않는다'],
  ])('%s → %s / %s', (status, availability, outcome, reason) => {
    const input = verification({
      status,
      availability,
      outcome,
      reason,
      exitCode: null,
      durationMs: null,
    });
    expect(observationSchema.parse(input)).toMatchObject({ status, availability, outcome });
  });

  it('unsupported·not-run·timeout 을 pass 로 둘 수 없다', () => {
    expect(
      ok(verification({ status: 'unsupported', availability: 'available', outcome: 'pass' })),
    ).toBe(false);
    expect(
      ok(verification({ status: 'not-run', availability: 'available', outcome: 'pass' })),
    ).toBe(false);
    expect(ok(verification({ status: 'timeout', outcome: 'pass' }))).toBe(false);
  });

  it('실행하지 않은 verification 은 이유가 필요하다', () => {
    expect(
      ok(verification({ status: 'not-run', availability: 'not-run', outcome: null, reason: null })),
    ).toBe(false);
  });
});
