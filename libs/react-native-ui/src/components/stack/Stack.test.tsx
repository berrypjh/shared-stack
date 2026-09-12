/**
 * RN Stack 계약.
 *
 * `StackSemanticProps` 는 **ui-core 소유**입니다 — 두 렌더러가 같은 불변식을 각자의 스타일
 * 시스템으로 옮깁니다. 여기서 검증하는 것은 그 공유 불변식의 RN 쪽 구현입니다:
 *
 * - `direction` 미지정 = `column` (web 과 같은 기본값)
 * - `gap` = 토큰 이름 | 숫자, 숫자는 **원시 길이**(web 은 `px` 문자열, RN 은 숫자)
 * - `0` 은 미지정이 아니라 "간격 없음"
 * - 어휘(`start`·`end`·`between`)를 native 값(`flex-start`·`flex-end`·`space-between`)으로 푼다
 * - `undefined` 는 "건드리지 않는다"
 * - 소비자 `style` 이 계산된 값을 이긴다
 *
 * web 의 `display: flex` 는 옮기지 않습니다 — RN View 는 이미 flex 컨테이너입니다.
 */
import { createRef, type ReactElement } from 'react';
import { Text } from 'react-native';

import { Native, themes } from '@berrypjh/ui-core';

import { render, screen } from '@testing-library/react-native';
import type { View, ViewStyle } from 'react-native';

import { ThemeProvider } from '../../theme';

import type { StackProps } from './Stack';
import { Stack } from './Stack';

const T = Native.Light.tokens;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const getStack = () => screen.getByTestId('stack');

/**
 * Stack 이 **계산한** style 만 꺼냅니다. `toHaveStyle` 은 배열을 합쳐 버려서
 * "이 축은 아예 건드리지 않았다"를 구분하지 못합니다.
 */
const computedOf = (element: { props: { style?: unknown } }): ViewStyle => {
  const style = element.props.style as [ViewStyle, unknown];
  return style[0];
};

const computed = (): ViewStyle => computedOf(getStack());

describe('루트', () => {
  it('View 를 렌더하고 children 을 담는다', async () => {
    await renderWithTheme(
      <Stack testID="stack">
        <Text>child</Text>
      </Stack>,
    );

    expect(getStack()).toBeOnTheScreen();
    expect(getStack().type).toBe('View');
    expect(screen.getByText('child')).toBeOnTheScreen();
  });

  it('네이티브 View prop 을 그대로 전달한다', async () => {
    const onLayout = jest.fn();

    await renderWithTheme(
      <Stack
        testID="stack"
        onLayout={onLayout}
        pointerEvents="none"
        collapsable={false}
        nativeID="shell"
      />,
    );

    expect(getStack()).toHaveProp('pointerEvents', 'none');
    expect(getStack()).toHaveProp('collapsable', false);
    expect(getStack()).toHaveProp('nativeID', 'shell');
    expect(getStack()).toHaveProp('onLayout', onLayout);
  });
});

describe('ref', () => {
  it('ref 가 호스트 View 를 가리킨다', async () => {
    const ref = createRef<View>();
    await renderWithTheme(<Stack testID="stack" ref={ref} />);

    expect(ref.current).not.toBeNull();
    // RN 호스트 인스턴스는 측정 API 를 가집니다 — 래퍼가 아니라 진짜 View 라는 증거입니다.
    expect(typeof ref.current?.measure).toBe('function');
  });
});

/**
 * 기본값은 **세로 축 하나뿐**입니다.
 *
 * RN View 는 이미 `flexDirection: 'column'` 이라 이 선언은 native 기본값과 같지만, 계약이
 * 정한 기본값을 관측 가능하게 만들고 web 과 계산 결과를 같게 하려고 항상 내보냅니다.
 */
describe('기본 레이아웃', () => {
  it('direction 기본값이 column 이다', async () => {
    await renderWithTheme(<Stack testID="stack" />);

    expect(computed().flexDirection).toBe('column');
  });

  it('축 외에는 아무것도 주입하지 않는다', async () => {
    await renderWithTheme(<Stack testID="stack" />);

    expect(computed()).toEqual({ flexDirection: 'column' });
  });

  it('web 의 display 개념을 옮기지 않는다 — RN View 는 이미 flex 다', async () => {
    await renderWithTheme(<Stack testID="stack" />);

    expect('display' in computed()).toBe(false);
  });
});

describe('direction', () => {
  it('column 을 세로 축으로 적용한다', async () => {
    await renderWithTheme(<Stack testID="stack" direction="column" />);

    expect(computed().flexDirection).toBe('column');
  });

  it('row 를 가로 축으로 적용한다', async () => {
    await renderWithTheme(<Stack testID="stack" direction="row" />);

    expect(computed().flexDirection).toBe('row');
  });
});

describe('gap', () => {
  it('토큰 이름을 해석된 숫자로 바꾼다', async () => {
    await renderWithTheme(<Stack testID="stack" gap="md" />);

    expect(computed().gap).toBe(T.spacing.md);
    expect(typeof computed().gap).toBe('number');
    expect(computed().gap).not.toBe('md');
  });

  it('숫자는 원시 길이로 남는다 — px 문자열이 아니다', async () => {
    await renderWithTheme(<Stack testID="stack" gap={12} />);

    expect(computed().gap).toBe(12);
    expect(String(computed().gap)).not.toMatch(/px$/);
  });

  it('0 은 의도된 값이라 적용된다', async () => {
    await renderWithTheme(<Stack testID="stack" gap={0} />);

    expect(computed().gap).toBe(0);
    expect('gap' in computed()).toBe(true);
  });

  it('undefined 는 gap 키를 만들지 않는다', async () => {
    await renderWithTheme(<Stack testID="stack" gap={undefined} />);

    expect('gap' in computed()).toBe(false);
  });
});

/** 계약 어휘를 native 값으로 푸는 것은 렌더러 몫입니다. */
describe('align', () => {
  it.each([
    ['start', 'flex-start'],
    ['center', 'center'],
    ['end', 'flex-end'],
    ['stretch', 'stretch'],
  ] as const)('align=%s 를 alignItems: %s 로 푼다', async (align, expected) => {
    await renderWithTheme(<Stack testID="stack" align={align} />);

    expect(computed().alignItems).toBe(expected);
  });

  it('주지 않으면 alignItems 키가 없다', async () => {
    await renderWithTheme(<Stack testID="stack" />);

    expect('alignItems' in computed()).toBe(false);
  });
});

describe('justify', () => {
  it.each([
    ['start', 'flex-start'],
    ['center', 'center'],
    ['end', 'flex-end'],
    ['between', 'space-between'],
  ] as const)('justify=%s 를 justifyContent: %s 로 푼다', async (justify, expected) => {
    await renderWithTheme(<Stack testID="stack" justify={justify} />);

    expect(computed().justifyContent).toBe(expected);
  });

  it('주지 않으면 justifyContent 키가 없다', async () => {
    await renderWithTheme(<Stack testID="stack" />);

    expect('justifyContent' in computed()).toBe(false);
  });
});

describe('wrap', () => {
  it('true 는 줄바꿈을 허용한다', async () => {
    await renderWithTheme(<Stack testID="stack" wrap />);

    expect(computed().flexWrap).toBe('wrap');
  });

  /** 명시한 `false` 는 미지정과 다릅니다 — `gap={0}` 과 같은 취급입니다. */
  it('false 는 nowrap 을 명시한다', async () => {
    await renderWithTheme(<Stack testID="stack" wrap={false} />);

    expect(computed().flexWrap).toBe('nowrap');
  });

  it('주지 않으면 flexWrap 키가 없다', async () => {
    await renderWithTheme(<Stack testID="stack" />);

    expect('flexWrap' in computed()).toBe(false);
  });
});

/**
 * spacing 은 **테마를 타지 않습니다** — 등록된 7개 테마가 같은 눈금을 씁니다
 * (`Box.test.tsx` 의 "spacing 토큰은 테마를 타지 않는다" 와 같은 사실).
 *
 * 그래서 "테마를 바꾸면 값이 달라진다" 는 검사를 쓰지 않습니다 — 그것은 아무것도 증명하지
 * 못합니다. 대신 **레지스트리에 등록된 모든 테마에서 해석이 성공하는지**를 봅니다. 테마 이름을
 * 손으로 적지 않고 `themes` 를 순회하므로, design-tokens 에 테마가 늘면 이 검사도 함께 늡니다.
 */
describe('테마', () => {
  it('등록된 모든 테마에서 토큰 gap 이 해석된다', async () => {
    expect(themes.length).toBeGreaterThan(0);

    // 한 번의 렌더에 모든 테마를 담는다. 한 테스트 안에서 render/unmount 를 반복하면 세 번째
    // 마운트부터 빈 트리가 나온다 (RNTL 14 의 컨테이너 재사용). 중첩 Provider 는
    // `ThemeProvider.test.tsx` 가 이미 쓰는 패턴이다.
    await render(
      <>
        {themes.map(({ name }) => (
          <ThemeProvider key={name} mode={name}>
            <Stack testID={`stack-${name}`} gap="lg" />
          </ThemeProvider>
        ))}
      </>,
    );

    for (const { name } of themes) {
      const style = computedOf(screen.getByTestId(`stack-${name}`));

      expect(typeof style.gap).toBe('number');
      expect(style.gap).toBe(T.spacing.lg);
    }
  });

  /** RNTL 14 의 `render` 는 비동기라 동기 `toThrow` 가 아니라 `rejects` 로 받는다. */
  it('ThemeProvider 밖에서는 던진다 — 조용히 잘못된 간격을 만들지 않는다', async () => {
    await expect(render(<Stack testID="stack" gap="md" />)).rejects.toThrow(
      'useTheme must be used within <ThemeProvider>.',
    );
  });
});

describe('소비자 style 우선순위', () => {
  it('style 이 계산된 축을 덮는다', async () => {
    await renderWithTheme(
      <Stack testID="stack" direction="row" style={{ flexDirection: 'column' }} />,
    );

    expect(getStack()).toHaveStyle({ flexDirection: 'column' });
  });

  it('덮지 않은 선언은 그대로 남는다', async () => {
    await renderWithTheme(<Stack testID="stack" direction="row" gap="md" style={{ gap: 1 }} />);

    expect(getStack()).toHaveStyle({ flexDirection: 'row', gap: 1 });
  });

  it('계산된 style 은 항상 소비자 style 앞에 온다', async () => {
    await renderWithTheme(<Stack testID="stack" gap={12} style={{ margin: 4 }} />);

    const style = getStack().props.style as [ViewStyle, ViewStyle];

    expect(style[0]).toMatchObject({ gap: 12 });
    expect(style[1]).toMatchObject({ margin: 4 });
  });
});

/**
 * Stack 은 레이아웃 전용 View 입니다. 시맨틱을 **지어내지 않고**, 소비자가 준 것은 그대로
 * 전달합니다.
 */
describe('접근성', () => {
  it('소비자가 준 접근성 prop 을 전달한다', async () => {
    await renderWithTheme(
      <Stack
        testID="stack"
        accessible
        accessibilityRole="summary"
        accessibilityLabel="필터"
        accessibilityHint="두 번 눌러 펼칩니다"
        accessibilityState={{ expanded: true }}
      />,
    );

    expect(getStack()).toHaveProp('accessible', true);
    expect(getStack()).toHaveProp('accessibilityRole', 'summary');
    expect(getStack()).toHaveProp('accessibilityLabel', '필터');
    expect(getStack()).toHaveProp('accessibilityHint', '두 번 눌러 펼칩니다');
    expect(getStack()).toHaveProp('accessibilityState', { expanded: true });
  });

  it('주지 않으면 역할·이름·포커스를 만들지 않는다', async () => {
    await renderWithTheme(<Stack testID="stack" />);

    const stack = getStack();

    // 접근성 집합체가 아닙니다 — 자손이 각각 조작됩니다.
    expect(stack.props.accessible).not.toBe(true);
    expect(stack.props.accessibilityRole).toBeUndefined();
    expect(stack.props.accessibilityLabel).toBeUndefined();
    expect(stack.props.accessibilityHint).toBeUndefined();
    expect(stack.props.accessibilityState).toBeUndefined();
    expect(stack.props.focusable).toBeUndefined();
  });
});

/** 타입 수준 계약. jest 는 타입을 지우므로 이 블록은 `tsc` 가 검증합니다. */
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type HasProp<K extends string> = K extends keyof StackProps ? true : false;

export type StackSurface = [
  // 공유 계약이 실제로 붙어 있다.
  Expect<HasProp<'direction'>>,
  Expect<HasProp<'gap'>>,
  Expect<HasProp<'align'>>,
  Expect<HasProp<'justify'>>,
  Expect<HasProp<'wrap'>>,

  // RN 렌더러 prop 은 로컬에서 합성한다.
  Expect<HasProp<'style'>>,
  Expect<HasProp<'testID'>>,
  Expect<HasProp<'onLayout'>>,
  Expect<HasProp<'accessibilityRole'>>,

  // `ViewProps` 에는 `ref` 가 없어서 각 컴포넌트가 직접 선언한다.
  Expect<HasProp<'ref'>>,

  // web 어휘는 없다.
  Expect<Equal<HasProp<'className'>, false>>,

  // Box 의 visual prop 을 복제하지 않는다.
  Expect<Equal<HasProp<'p'>, false>>,
  Expect<Equal<HasProp<'bg'>, false>>,
  Expect<Equal<HasProp<'radius'>, false>>,
];

/**
 * 값 도메인 — **합성 경계**를 검사합니다.
 *
 * 계약 자체의 도메인은 ui-core `contracts/stack.test.ts` 가 소유합니다. 여기서 다시 보는
 * 이유는 다릅니다: `StackSemanticProps & Omit<ViewProps, keyof StackSemanticProps>` 라는 RN
 * 로컬 합성이 계약을 **느슨하게 만들지 않았는지** 확인합니다.
 */
export const stackValueDomain = () => (
  <>
    <Stack direction="row" gap="md" align="center" justify="between" wrap />
    <Stack gap={0} wrap={false} />
    {/* @ts-expect-error 축 어휘가 아니다 */}
    <Stack direction="horizontal" />
    {/* @ts-expect-error spacing 토큰이 아닌 임의 문자열 */}
    <Stack gap="huge" />
    {/* @ts-expect-error V1 어휘에 baseline 이 없다 */}
    <Stack align="baseline" />
    {/* @ts-expect-error 계약 어휘는 정규화된 이름이다 */}
    <Stack justify="space-between" />
    {/* @ts-expect-error className 은 web 렌더러 어휘다 */}
    <Stack className="x" />
    {/* @ts-expect-error 여백·면은 Box 가 가진다 */}
    <Stack p="md" />
    {/* @ts-expect-error 레이아웃 컨테이너에 눌림 상태가 없다 */}
    <Stack pressed />
    {/* @ts-expect-error 비활성화할 동작이 없다 */}
    <Stack disabled />
  </>
);
