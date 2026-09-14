/**
 * 내부 ButtonBase의 동작 계약.
 *
 * Pressable 동작 원시만 검증합니다 — 라벨·아이콘·로딩·shape은 각 컴포넌트 관심사입니다.
 * pressed 시각 표현도 없습니다. Base가 보장하는 것은 pressed를 정확히 전달하는 데까지입니다.
 */
import { Text, View } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';

import { ButtonBase } from './ButtonBase';
import type { ButtonBaseProps } from './ButtonBase.types';

/** light 테마의 canonical 최소 터치 타깃. 컴포넌트는 theme 에서, 테스트는 원본에서 읽는다. */
const MIN_TOUCH_TARGET = Native.Light.tokens.spacing['4xl'];

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const getButton = () => screen.getByRole('button', { name: 'probe' });

describe('호스트와 접근성', () => {
  it('button role 을 가진 Pressable 호스트를 렌더한다', async () => {
    await renderWithTheme(
      <ButtonBase accessibilityLabel="probe">
        <Text>child</Text>
      </ButtonBase>,
    );

    expect(getButton()).toBeOnTheScreen();
    expect(screen.getByText('child')).toBeOnTheScreen();
  });

  it('accessibilityLabel 과 accessibilityHint 가 그대로 전달된다', async () => {
    await renderWithTheme(<ButtonBase accessibilityLabel="probe" accessibilityHint="hint" />);

    expect(getButton()).toHaveAccessibleName('probe');
    expect(getButton()).toHaveProp('accessibilityHint', 'hint');
  });

  it('disabled 가 접근성 상태로 노출된다', async () => {
    await renderWithTheme(<ButtonBase accessibilityLabel="probe" disabled />);

    expect(getButton()).toBeDisabled();
  });

  it('소비자 accessibilityState 의 다른 키는 보존된다', async () => {
    await renderWithTheme(
      <ButtonBase accessibilityLabel="probe" accessibilityState={{ selected: true }} />,
    );

    expect(getButton()).toBeSelected();
  });

  it('소비자가 accessibilityState.disabled=false 로 실제 disabled 를 덮어쓸 수 없다', async () => {
    await renderWithTheme(
      <ButtonBase accessibilityLabel="probe" disabled accessibilityState={{ disabled: false }} />,
    );

    expect(getButton()).toBeDisabled();
  });

  /**
   * 타입은 `accessibilityRole` 을 이미 막지만(`RejectsInvariantBreakingProps`), 그것은 소비자
   * 쪽 방어일 뿐이다. Base 안에서 `{...rest}` 가 `accessibilityRole` **뒤**로 옮겨지면 타입은
   * 그대로 통과하면서 런타임 불변식만 조용히 사라진다. 그 순서를 여기서 고정한다.
   */
  it('accessibilityRole 은 런타임으로도 덮어쓸 수 없다', async () => {
    const forced = { accessibilityRole: 'link' } as unknown as ButtonBaseProps;

    await renderWithTheme(<ButtonBase accessibilityLabel="probe" {...forced} />);

    expect(getButton()).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('press 동작', () => {
  it('onPress 를 호출한다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<ButtonBase accessibilityLabel="probe" onPress={onPress} />);

    await fireEvent.press(getButton());

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('onPressIn / onPressOut / onLongPress 를 전달한다', async () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const onLongPress = jest.fn();

    await renderWithTheme(
      <ButtonBase
        accessibilityLabel="probe"
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onLongPress={onLongPress}
      />,
    );

    await fireEvent(getButton(), 'pressIn');
    await fireEvent(getButton(), 'pressOut');
    await fireEvent(getButton(), 'longPress');

    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('disabled 면 onPress 가 호출되지 않는다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<ButtonBase accessibilityLabel="probe" disabled onPress={onPress} />);

    await fireEvent.press(getButton());

    expect(onPress).not.toHaveBeenCalled();
  });

  /**
   * 타입에 남아 있다는 것(`KeepsValidPressableProps`)과 Pressable 까지 실제로 닿는다는 것은
   * 다른 이야기다. Base 가 `hitSlop` 을 destructure 로 삼켜도 타입 검사는 통과한다.
   *
   * `android_ripple` 은 여기서 같이 볼 수 없다 — Pressable 의 `useAndroidRippleForView` 가
   * `Platform.OS === 'android'` 일 때만 viewProps 를 만들어서, iOS 기본인 jest 프리셋에서는
   * 넘겨도 호스트에 나타나지 않는다. 그쪽은 타입 수준 단언이 지킨다.
   */
  it('hitSlop 이 Pressable 까지 닿는다', async () => {
    await renderWithTheme(<ButtonBase accessibilityLabel="probe" hitSlop={12} />);

    expect(getButton().props.hitSlop).toBe(12);
  });

  it('testID 같은 일반 Pressable prop 을 전달한다', async () => {
    await renderWithTheme(<ButtonBase accessibilityLabel="probe" testID="probe-id" />);

    expect(screen.getByTestId('probe-id')).toBeOnTheScreen();
  });

  it('ref 가 Pressable 호스트에 닿는다', async () => {
    const ref = { current: null } as { current: View | null };

    await renderWithTheme(<ButtonBase accessibilityLabel="probe" ref={ref} />);

    expect(ref.current).not.toBeNull();
    // Pressable 의 ref 는 View 호스트다. test 렌더러에서도 measure 계열 메서드를 갖는다.
    expect(typeof ref.current?.measure).toBe('function');
  });
});

describe('style 합성', () => {
  it('정적 소비자 style 이 병합된다', async () => {
    await renderWithTheme(
      <ButtonBase accessibilityLabel="probe" style={{ backgroundColor: 'rgb(1, 2, 3)' }} />,
    );

    expect(getButton()).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
  });

  it('콜백 소비자 style 이 pressed 상태를 받는다', async () => {
    await renderWithTheme(
      <ButtonBase
        accessibilityLabel="probe"
        testOnly_pressed
        style={({ pressed }) => ({ backgroundColor: pressed ? 'rgb(9, 9, 9)' : 'rgb(0, 0, 0)' })}
      />,
    );

    expect(getButton()).toHaveStyle({ backgroundColor: 'rgb(9, 9, 9)' });
  });

  it('disabled 면 pressed 가 참이 되지 않는다', async () => {
    // RN Pressable은 `testOnly_pressed`를 disabled와 무관하게 참으로 만듭니다.
    // disabled인데 pressed 표현이 살아나면 안 되므로 Base가 막습니다.
    await renderWithTheme(
      <ButtonBase
        accessibilityLabel="probe"
        disabled
        testOnly_pressed
        style={({ pressed }) => ({ backgroundColor: pressed ? 'rgb(9, 9, 9)' : 'rgb(0, 0, 0)' })}
      />,
    );

    expect(getButton()).toHaveStyle({ backgroundColor: 'rgb(0, 0, 0)' });
  });

  it('소비자 style 이 최소 터치 타깃을 줄일 수 없다', async () => {
    await renderWithTheme(
      <ButtonBase accessibilityLabel="probe" style={{ minWidth: 0, minHeight: 0 }} />,
    );

    expect(getButton()).toHaveStyle({
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
    });
  });
});

describe('disabled 는 진실 공급원이 하나다', () => {
  it('accessibilityState 만으로 disabled 라고 주장할 수 없다', async () => {
    // RN Pressable 은 `disabled` 가 없으면 `accessibilityState.disabled` 를 그대로 알린다.
    // 그러면 "disabled 라고 알리는데 실제로는 눌리는" 버튼이 된다. Base 가 실제 값으로 덮는다.
    const onPress = jest.fn();
    await renderWithTheme(
      <ButtonBase
        accessibilityLabel="probe"
        accessibilityState={{ disabled: true }}
        onPress={onPress}
      />,
    );

    expect(getButton()).toBeEnabled();

    await fireEvent.press(getButton());

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

/** 타입 수준 계약. jest는 타입을 지우므로 이 블록은 `tsc -b`가 검증합니다. */
type Expect<T extends true> = T;
type HasProp<K extends string> = K extends keyof ButtonBaseProps ? true : false;

/** web 전용 개념은 RN Base의 prop이 아닙니다. */
export type RejectsWebOnlyProps = [
  Expect<HasProp<'href'> extends false ? true : false>,
  Expect<HasProp<'component'> extends false ? true : false>,
  Expect<HasProp<'className'> extends false ? true : false>,
];

/** 버튼 불변식과 충돌하는 prop도 막습니다. */
export type RejectsInvariantBreakingProps = [
  Expect<HasProp<'accessibilityRole'> extends false ? true : false>,
  Expect<HasProp<'aria-disabled'> extends false ? true : false>,
];

/** 멀쩡한 Pressable prop을 괜히 좁히지는 않습니다. */
export type KeepsValidPressableProps = [
  Expect<HasProp<'hitSlop'>>,
  Expect<HasProp<'onLongPress'>>,
  Expect<HasProp<'android_ripple'>>,
  Expect<HasProp<'accessibilityLabel'>>,
  Expect<HasProp<'accessibilityState'>>,
  Expect<HasProp<'testID'>>,
  Expect<HasProp<'disabled'>>,
];

describe('children 콜백', () => {
  it('children 콜백도 pressed 를 받는다', async () => {
    await renderWithTheme(
      <ButtonBase accessibilityLabel="probe" testOnly_pressed>
        {({ pressed }) => <Text>{pressed ? 'on' : 'off'}</Text>}
      </ButtonBase>,
    );

    expect(screen.getByText('on')).toBeOnTheScreen();
  });

  it('disabled 면 children 콜백의 pressed 도 거짓이다', async () => {
    // style 콜백과 같은 값을 써야 합니다. 갈라지면 못 누르는데 눌린 것처럼 보입니다.
    await renderWithTheme(
      <ButtonBase accessibilityLabel="probe" disabled testOnly_pressed>
        {({ pressed }) => <Text>{pressed ? 'on' : 'off'}</Text>}
      </ButtonBase>,
    );

    expect(screen.getByText('off')).toBeOnTheScreen();
  });
});
