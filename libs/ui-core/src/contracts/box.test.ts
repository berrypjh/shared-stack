import type { BoxProps, BoxRadiusValue, BoxSpacingValue } from './box';

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

const rampBg: BoxProps = { bg: 'primary.pr500' };
const neutralRampBg: BoxProps = { bg: 'neutral.ne200' };
const componentBg: BoxProps = { bg: 'primaryBtn.hover' };

describe('Box 계약이 받는 것', () => {
  it('시맨틱 토큰과 원시 숫자를 함께 받는다', () => {
    expect(semantic.p).toBe('md');
    expect(semantic.px).toBe(4);
    expect(numericRadius).toBe(8);
    expect(tokenSpacing).toBe('xl');
  });

  it('bg 는 시맨틱 역할과 원시 램프 경로를 모두 받는다', () => {
    // 값 비교가 아니라 위 선언이 컴파일된다는 사실이 계약이다.
    expect(semantic.bg).toBe('background.primary');
    expect(rampBg.bg).toBe('primary.pr500');
    expect(neutralRampBg.bg).toBe('neutral.ne200');
    expect(componentBg.bg).toBe('primaryBtn.hover');
  });

  it('미지정 축은 키 자체가 없다 — 0 이 아니다', () => {
    expect('py' in semantic).toBe(false);
    expect(Object.keys(semantic)).not.toContain('mb');
  });
});

describe('Box 계약이 거부하는 것', () => {
  it('색 카테고리 밖의 토큰 경로와 원시 색 문자열을 거부한다', () => {
    const wrongCategory: BoxProps = {
      // @ts-expect-error spacing 토큰은 ColorToken이 아니다
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

describe('렌더러 prop 은 계약에 없다', () => {
  it('web 전용 prop 을 받지 않는다', () => {
    // @ts-expect-error className은 react-ui가 덧붙인다
    const className: BoxProps = { className: 'root' };
    // @ts-expect-error style은 react-ui가 덧붙인다
    const style: BoxProps = { style: {} };
    // @ts-expect-error DOM 이벤트는 react-ui가 덧붙인다
    const onClick: BoxProps = { onClick: () => undefined };

    expect([className, style, onClick]).toHaveLength(3);
  });

  it('RN 전용 prop 을 받지 않는다', () => {
    // @ts-expect-error testID는 react-native-ui가 덧붙인다
    const testID: BoxProps = { testID: 'box' };
    // @ts-expect-error onLayout은 react-native-ui가 덧붙인다
    const onLayout: BoxProps = { onLayout: () => undefined };
    // @ts-expect-error accessibilityRole은 react-native-ui가 덧붙인다
    const accessibilityRole: BoxProps = { accessibilityRole: 'none' };

    expect([testID, onLayout, accessibilityRole]).toHaveLength(3);
  });
});
