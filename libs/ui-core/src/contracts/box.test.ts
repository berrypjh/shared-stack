/**
 * Box 계약의 **타입 수준** 검증.
 *
 * 런타임 동작이 아니라 "무엇을 받고 무엇을 거부하는가"가 계약이므로 검사도 타입 수준이다.
 * `@ts-expect-error` 는 `tsc -p tsconfig.spec.json` 이 확인한다 — 에러가 사라지면
 * "unused directive" 로 실패하므로 계약이 느슨해지면 빌드가 깨진다.
 */
import type { BoxProps, BoxRadiusValue, BoxSpacingValue } from './box';

/** 토큰 이름과 원시 숫자를 모두 받는다. 축약 우선순위는 렌더러가 구현한다. */
const semantic: BoxProps = {
  p: 'md',
  px: 4,
  pt: 'lg',
  m: 'sm',
  mx: 0,
  bg: 'background.primary',
  radius: 'md',
};

const numericRadius: BoxRadiusValue = 8;
const tokenSpacing: BoxSpacingValue = 'xl';

describe('Box 계약이 받는 것', () => {
  it('시맨틱 토큰과 원시 숫자를 함께 받는다', () => {
    expect(semantic.p).toBe('md');
    expect(semantic.px).toBe(4);
    expect(numericRadius).toBe(8);
    expect(tokenSpacing).toBe('xl');
  });

  it('미지정 축은 키 자체가 없다 — 0 이 아니다', () => {
    expect('py' in semantic).toBe(false);
    expect(Object.keys(semantic)).not.toContain('mb');
  });
});

describe('Box 계약이 거부하는 것', () => {
  it('색 카테고리 밖의 토큰 경로와 원시 색 문자열을 거부한다', () => {
    const wrongCategory: BoxProps = {
      // @ts-expect-error spacing 토큰은 ColorToken 이 아니다
      bg: 'md',
    };
    const rawColor: BoxProps = {
      // @ts-expect-error 원시 색 문자열은 토큰이 아니다
      bg: '#101828',
    };
    const missingLeaf: BoxProps = {
      // @ts-expect-error 중간 노드는 leaf 경로가 아니다
      bg: 'background',
    };

    expect([wrongCategory, rawColor, missingLeaf]).toHaveLength(3);
  });

  it('spacing/radius 자리에 임의 문자열을 받지 않는다', () => {
    const bogus: BoxProps = {
      // @ts-expect-error 토큰 이름이 아니다
      p: 'huge',
      // @ts-expect-error 토큰 이름이 아니다
      radius: 'round',
    };

    expect(bogus.p).toBe('huge');
  });
});

/**
 * 초과 프로퍼티 에러는 객체 리터럴당 **첫 번째 것만** 보고된다.
 * 그래서 금지 prop 은 리터럴 하나에 하나씩 둔다 — 묶으면 뒤쪽 directive 가 침묵한다.
 */
describe('렌더러 prop 은 계약에 없다', () => {
  it('web 전용 prop 을 받지 않는다', () => {
    // @ts-expect-error className 은 react-ui 가 덧붙인다
    const className: BoxProps = { className: 'root' };
    // @ts-expect-error style 은 react-ui 가 덧붙인다
    const style: BoxProps = { style: {} };
    // @ts-expect-error DOM 이벤트는 react-ui 가 덧붙인다
    const onClick: BoxProps = { onClick: () => undefined };

    expect([className, style, onClick]).toHaveLength(3);
  });

  it('RN 전용 prop 을 받지 않는다', () => {
    // @ts-expect-error testID 는 react-native-ui 가 덧붙인다
    const testID: BoxProps = { testID: 'box' };
    // @ts-expect-error onLayout 은 react-native-ui 가 덧붙인다
    const onLayout: BoxProps = { onLayout: () => undefined };
    // @ts-expect-error accessibilityRole 은 react-native-ui 가 덧붙인다
    const accessibilityRole: BoxProps = { accessibilityRole: 'none' };

    expect([testID, onLayout, accessibilityRole]).toHaveLength(3);
  });
});
