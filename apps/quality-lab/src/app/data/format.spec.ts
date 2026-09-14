import { describe, expect, it } from 'vitest';

import {
  availabilityLabel,
  bundleRoleLabel,
  countText,
  formatBytes,
  headroomText,
  observationValueText,
  shortSha,
} from './format';

describe('availabilityLabel — 색 밖에서도 읽히는 상태 이름', () => {
  it.each([
    ['available', '측정됨'],
    ['not-run', '실행 안 함'],
    ['unsupported', '지원 안 함'],
    ['unavailable', '값 없음'],
    ['permission-required', '권한 필요'],
    ['not-measured', '측정 안 함'],
    ['not-applicable', '해당 없음'],
    ['invalid', '검증 실패'],
  ])('%s → %s', (availability, label) => {
    expect(availabilityLabel(availability)).toBe(label);
  });
});

describe('formatBytes', () => {
  it('바이트와 size-limit 과 같은 십진 KB 를 함께 쓴다', () => {
    expect(formatBytes(10574)).toBe('10,574 B (10.57 KB)');
    expect(formatBytes(0)).toBe('0 B');
  });
});

describe('headroomText — 초과·남은 값을 글로 준다', () => {
  it('남으면 남음, 넘으면 초과, 같으면 한도와 같음', () => {
    expect(headroomText(426)).toBe('426 B 남음');
    expect(headroomText(-757)).toBe('757 B 초과');
    expect(headroomText(0)).toBe('0 B 남음 (한도와 같음)');
  });

  it('값이 없으면 남은 값을 말하지 않는다', () => {
    expect(headroomText(null)).toBe('판정 없음');
  });
});

describe('observationValueText — 값이 없으면 dash 가 아니라 이유를 준다', () => {
  const base = { denominator: null, reason: null };

  it('ratio 는 백분율과 분모를 함께 쓴다', () => {
    expect(
      observationValueText({
        ...base,
        availability: 'available',
        unit: 'ratio',
        value: 0.5,
        denominator: 2,
      }),
    ).toBe('50.0% (2 중)');
  });

  it('bytes·tokens·count·ms 는 단위를 붙인다', () => {
    expect(
      observationValueText({ ...base, availability: 'available', unit: 'bytes', value: 10574 }),
    ).toBe('10,574 B (10.57 KB)');
    expect(
      observationValueText({ ...base, availability: 'available', unit: 'tokens', value: 0 }),
    ).toBe('0 tokens');
    expect(
      observationValueText({ ...base, availability: 'available', unit: 'count', value: 3 }),
    ).toBe('3');
    expect(
      observationValueText({ ...base, availability: 'available', unit: 'ms', value: 12.5 }),
    ).toBe('12.5 ms');
  });

  it('값이 없으면 상태 이름과 이유를 쓴다', () => {
    expect(
      observationValueText({
        availability: 'not-run',
        unit: 'ratio',
        value: null,
        denominator: null,
        reason: 'static profile 은 실행하지 않는다',
      }),
    ).toBe('실행 안 함 — static profile 은 실행하지 않는다');
  });
});

describe('countText', () => {
  it('0 은 0 이고 null 은 이유다', () => {
    expect(countText({ value: 0, reason: null })).toBe('0');
    expect(countText({ value: 1201, reason: null })).toBe('1,201');
    expect(countText({ value: null, reason: 'report 가 없다' })).toBe(
      '측정 안 됨 — report 가 없다',
    );
  });
});

describe('bundleRoleLabel', () => {
  it('한도 게이트와 보고 전용 진단을 구분한다', () => {
    expect(bundleRoleLabel('budget')).toBe('budget');
    expect(bundleRoleLabel('diagnostic')).toBe('진단 (보고 전용)');
  });
});

describe('shortSha', () => {
  it('40자 SHA 는 7자로 줄이고 unknown 은 그대로 둔다', () => {
    expect(shortSha('b6eed3b610abc3c3ace5a7aba8d27bf7e2d11890')).toBe('b6eed3b');
    expect(shortSha('unknown')).toBe('unknown');
  });
});
