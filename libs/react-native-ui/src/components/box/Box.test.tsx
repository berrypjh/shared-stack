/**
 * RN Box 계약.
 *
 * `BoxProps` 는 **ui-core 소유**입니다 — 두 렌더러가 같은 불변식을 각자의 스타일 시스템으로
 * 옮깁니다. 여기서 검증하는 것은 그 공유 불변식의 RN 쪽 구현입니다:
 *
 * - spacing/radius = 토큰 이름 | 숫자
 * - 숫자 = 렌더러 기본 길이 단위 (web `px` 문자열, **RN 은 원시 숫자**)
 * - 방향값 > 축 값 > 공통값
 * - `undefined` 는 "건드리지 않는다" 이지 `0` 이 아니다
 * - `bg` 는 시맨틱 color 토큰 경로만 받는다
 * - 소비자 `style` 이 계산된 값을 이긴다
 *
 * web 의 `spacingToCss`/`radiusToCss`/CSS 변수는 옮기지 않습니다 — 그것은 web 렌더링 수단입니다.
 */
import { createRef, type ReactElement } from 'react';
import { Text } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { render, screen } from '@testing-library/react-native';
import type { View, ViewStyle } from 'react-native';

import { ThemeProvider } from '../../theme';

import type { NativeBoxProps } from './Box';
import { Box } from './Box';

const T = Native.Light.tokens;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const getBox = () => screen.getByTestId('box');

/**
 * Box 가 **계산한** style 만 꺼냅니다. `toHaveStyle` 은 배열을 합쳐 버려서
 * "이 축은 아예 건드리지 않았다"를 구분하지 못합니다.
 */
const computed = (): ViewStyle => {
  const style = getBox().props.style as [ViewStyle, unknown];
  return style[0];
};

describe('루트', () => {
  it('View 를 렌더하고 children 을 담는다', async () => {
    await renderWithTheme(
      <Box testID="box">
        <Text>child</Text>
      </Box>,
    );

    expect(getBox()).toBeOnTheScreen();
    expect(getBox().type).toBe('View');
    expect(screen.getByText('child')).toBeOnTheScreen();
  });

  it('네이티브 View prop 을 그대로 전달한다', async () => {
    await renderWithTheme(
      <Box
        testID="box"
        accessibilityLabel="상자"
        pointerEvents="none"
        collapsable={false}
        needsOffscreenAlphaCompositing
      />,
    );

    expect(getBox()).toHaveProp('accessibilityLabel', '상자');
    expect(getBox()).toHaveProp('pointerEvents', 'none');
    expect(getBox()).toHaveProp('collapsable', false);
    expect(getBox()).toHaveProp('needsOffscreenAlphaCompositing', true);
  });

  it('접근성 집합체가 아니다 — 자손이 각각 조작된다', async () => {
    await renderWithTheme(<Box testID="box" />);

    expect(getBox().props.accessible).not.toBe(true);
  });
});

describe('ref', () => {
  it('ref 가 호스트 View 를 가리킨다', async () => {
    const ref = createRef<View>();
    await renderWithTheme(<Box testID="box" ref={ref} />);

    expect(ref.current).not.toBeNull();
    // RN 호스트 인스턴스는 측정 API 를 가집니다 — 래퍼가 아니라 진짜 View 라는 증거입니다.
    expect(typeof ref.current?.measure).toBe('function');
  });
});

describe('spacing — 토큰', () => {
  it('p 토큰이 네 방향에 모두 적용된다', async () => {
    await renderWithTheme(<Box testID="box" p="md" />);

    expect(computed()).toMatchObject({
      paddingTop: T.spacing.md,
      paddingRight: T.spacing.md,
      paddingBottom: T.spacing.md,
      paddingLeft: T.spacing.md,
    });
  });

  it('px / py 가 축에만 적용된다', async () => {
    await renderWithTheme(<Box testID="box" px="lg" py="sm" />);

    expect(computed()).toMatchObject({
      paddingTop: T.spacing.sm,
      paddingBottom: T.spacing.sm,
      paddingLeft: T.spacing.lg,
      paddingRight: T.spacing.lg,
    });
  });

  it('m 토큰이 네 방향에 모두 적용된다', async () => {
    await renderWithTheme(<Box testID="box" m="lg" />);

    expect(computed()).toMatchObject({
      marginTop: T.spacing.lg,
      marginRight: T.spacing.lg,
      marginBottom: T.spacing.lg,
      marginLeft: T.spacing.lg,
    });
  });

  it('토큰 이름이 아니라 해석된 숫자가 들어간다', async () => {
    await renderWithTheme(<Box testID="box" p="md" />);

    expect(typeof computed().paddingTop).toBe('number');
    expect(computed().paddingTop).not.toBe('md');
  });
});

describe('spacing — 숫자는 원시 길이다', () => {
  it('숫자 p 가 숫자 그대로 남는다 — px 문자열이 아니다', async () => {
    await renderWithTheme(<Box testID="box" p={12} />);

    expect(computed().paddingTop).toBe(12);
    expect(typeof computed().paddingTop).toBe('number');
  });

  it('숫자 m 도 숫자 그대로다', async () => {
    await renderWithTheme(<Box testID="box" m={8} />);

    expect(computed().marginTop).toBe(8);
    expect(typeof computed().marginTop).toBe('number');
  });

  it('계산된 style 어디에도 px 문자열이 없다', async () => {
    await renderWithTheme(<Box testID="box" p={12} m={8} radius={4} />);

    for (const value of Object.values(computed())) {
      expect(String(value)).not.toMatch(/px$/);
    }
  });

  it('0 은 의도된 값이라 적용된다', async () => {
    await renderWithTheme(<Box testID="box" p={0} m={0} radius={0} />);

    expect(computed()).toMatchObject({
      paddingTop: 0,
      marginTop: 0,
      borderRadius: 0,
    });
  });
});

describe('우선순위 — 방향 > 축 > 공통', () => {
  it('p=12, px=16, pt=20', async () => {
    await renderWithTheme(<Box testID="box" p={12} px={16} pt={20} />);

    expect(computed()).toMatchObject({
      paddingTop: 20, // pt
      paddingRight: 16, // px
      paddingBottom: 12, // p
      paddingLeft: 16, // px
    });
  });

  it('m=8, my=10, ml=14', async () => {
    await renderWithTheme(<Box testID="box" m={8} my={10} ml={14} />);

    expect(computed()).toMatchObject({
      marginTop: 10, // my
      marginRight: 8, // m
      marginBottom: 10, // my
      marginLeft: 14, // ml
    });
  });

  it('토큰과 숫자를 섞어도 같은 순서다', async () => {
    await renderWithTheme(<Box testID="box" p="md" pt={20} />);

    expect(computed()).toMatchObject({
      paddingTop: 20,
      paddingBottom: T.spacing.md,
    });
  });
});

describe('undefined 는 0 이 아니다', () => {
  it('px 만 주면 세로 축은 아예 없다', async () => {
    await renderWithTheme(<Box testID="box" px="md" />);

    const c = computed();

    expect(c.paddingLeft).toBe(T.spacing.md);
    expect(c.paddingRight).toBe(T.spacing.md);
    // 키가 존재하면 0 이 주입된 것입니다.
    expect('paddingTop' in c).toBe(false);
    expect('paddingBottom' in c).toBe(false);
  });

  it('아무 prop 도 안 주면 계산된 style 이 비어 있다', async () => {
    await renderWithTheme(<Box testID="box" />);

    expect(computed()).toEqual({});
  });

  it('padding 만 주면 margin 키가 생기지 않는다', async () => {
    await renderWithTheme(<Box testID="box" p="md" />);

    const keys = Object.keys(computed());

    expect(keys.some((k) => k.startsWith('margin'))).toBe(false);
  });
});

describe('radius', () => {
  it('토큰을 해석한다', async () => {
    await renderWithTheme(<Box testID="box" radius="lg" />);

    expect(computed().borderRadius).toBe(T.radius.lg);
  });

  it('숫자를 그대로 쓴다', async () => {
    await renderWithTheme(<Box testID="box" radius={6} />);

    expect(computed().borderRadius).toBe(6);
  });

  it('주지 않으면 borderRadius 키가 없다', async () => {
    await renderWithTheme(<Box testID="box" p="md" />);

    expect('borderRadius' in computed()).toBe(false);
  });
});

describe('bg — 시맨틱 토큰만', () => {
  it('현재 테마를 통해 해석된다', async () => {
    await renderWithTheme(<Box testID="box" bg="background.surface" />);

    expect(computed().backgroundColor).toBe(T.color.background.surface);
  });

  it('주지 않으면 backgroundColor 키가 없다', async () => {
    await renderWithTheme(<Box testID="box" p="md" />);

    expect('backgroundColor' in computed()).toBe(false);
  });

  it('테마를 바꾸면 같은 토큰이 다른 색이 된다', async () => {
    const view = await render(
      <ThemeProvider mode="light">
        <Box testID="box" bg="background.surface" />
      </ThemeProvider>,
    );

    expect(computed().backgroundColor).toBe(Native.Light.tokens.color.background.surface);

    await view.rerender(
      <ThemeProvider mode="dark">
        <Box testID="box" bg="background.surface" />
      </ThemeProvider>,
    );

    expect(computed().backgroundColor).toBe(Native.Dark.tokens.color.background.surface);
    // 두 값이 같으면 이 테스트가 아무것도 증명하지 못합니다.
    expect(Native.Dark.tokens.color.background.surface).not.toBe(
      Native.Light.tokens.color.background.surface,
    );
  });

  it('spacing 토큰은 테마를 타지 않는다 — 색만 바뀐다', async () => {
    await render(
      <ThemeProvider mode="dark">
        <Box testID="box" p="md" />
      </ThemeProvider>,
    );

    expect(computed().paddingTop).toBe(Native.Light.tokens.spacing.md);
  });
});

describe('소비자 style 우선순위', () => {
  it('style 이 계산된 값을 덮고 다른 면은 살아남는다', async () => {
    await renderWithTheme(<Box testID="box" p={12} style={{ paddingTop: 40 }} />);

    // 계산된 배열의 뒤가 이깁니다.
    expect(getBox()).toHaveStyle({
      paddingTop: 40,
      paddingRight: 12,
      paddingBottom: 12,
      paddingLeft: 12,
    });
  });

  it('style 이 bg 도 덮을 수 있다', async () => {
    await renderWithTheme(
      <Box testID="box" bg="background.surface" style={{ backgroundColor: 'rgb(1, 2, 3)' }} />,
    );

    expect(getBox()).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
  });

  it('계산된 style 은 항상 소비자 style 앞에 온다', async () => {
    await renderWithTheme(<Box testID="box" p={12} style={{ margin: 4 }} />);

    const style = getBox().props.style as [ViewStyle, ViewStyle];

    expect(style[0]).toMatchObject({ paddingTop: 12 });
    expect(style[1]).toMatchObject({ margin: 4 });
  });
});

/** 타입 수준 계약. jest 는 타입을 지우므로 이 블록은 `tsc -b` 가 검증합니다. */
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type HasProp<K extends string> = K extends keyof NativeBoxProps ? true : false;

export type BoxSurface = [
  // 공유 계약이 실제로 붙어 있다.
  Expect<HasProp<'p'>>,
  Expect<HasProp<'px'>>,
  Expect<HasProp<'mt'>>,
  Expect<HasProp<'bg'>>,
  Expect<HasProp<'radius'>>,

  // RN 렌더러 prop 은 로컬에서 합성한다.
  Expect<HasProp<'style'>>,
  Expect<HasProp<'testID'>>,
  Expect<HasProp<'pointerEvents'>>,

  // web 어휘는 없다.
  Expect<Equal<HasProp<'className'>, false>>,

  // 다른 15개 공개 컴포넌트와 같은 계약이다. `ViewProps` 에는 `ref` 가 없어서
  // 각 컴포넌트가 직접 선언한다.
  Expect<HasProp<'ref'>>,
];

/**
 * 값 도메인 — **합성 경계**를 검사합니다.
 *
 * 계약 자체(`BoxProps`)의 도메인은 ui-core `contracts/box.test.ts` 가 이미 소유합니다.
 * 여기서 다시 보는 이유는 다릅니다: `BoxProps & Omit<ViewProps, keyof BoxProps>` 라는 RN
 * 로컬 합성이 계약을 **느슨하게 만들지 않았는지** 확인합니다. `ViewProps` 쪽에서 같은 이름의
 * 넓은 prop 이 새어 들어오면 여기서 깨집니다.
 */
export const boxValueDomain = () => (
  <>
    <Box p="md" m={8} radius="lg" bg="background.surface" />
    <Box p={0} radius={0} />
    {/* @ts-expect-error spacing 토큰이 아닌 임의 문자열 */}
    <Box p="not-a-token" />
    {/* @ts-expect-error 원시 색 문자열은 받지 않는다 — 시맨틱 토큰 경로만 */}
    <Box bg="#ff0000" />
    {/* @ts-expect-error radius 토큰이 아닌 임의 문자열 */}
    <Box radius="huge" />
    {/* @ts-expect-error className 은 web 렌더러 어휘다 */}
    <Box className="x" />
  </>
);
