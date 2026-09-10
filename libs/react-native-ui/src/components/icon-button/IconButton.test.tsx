/**
 * RN IconButton의 계약.
 *
 * 아이콘만 있는 컨트롤이라 접근성이 API 제약입니다 — 이름은 타입에서 강제하고 상태는
 * role/name/state 쿼리로 검증합니다. Fab과 마찬가지로 시각 크기와 터치 타깃이 갈라집니다.
 */
import { Text } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { ThemeProvider } from '../../theme';

import { IconButton } from './IconButton';
import type { IconButtonProps } from './IconButton.types';

const t = Native.Light.tokens;
const MIN_TOUCH_TARGET = t.spacing['4xl'];

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);
const button = () => screen.getByRole('button');

type El = ReturnType<typeof screen.getByRole>;
const elementChildren = (el: El): El[] => el.children.filter((c): c is El => typeof c !== 'string');

/** 눈에 보이는 컨트롤 면. 루트(터치 타깃) 바로 아래 한 겹입니다. */
const surface = () => elementChildren(button())[0];
/** 아이콘 슬롯 — 면의 첫 자식. */
const iconSlot = () => elementChildren(surface())[0];

const icon = <Text testID="icon">★</Text>;

describe('접근 가능한 이름', () => {
  it('role 과 name 으로 찾을 수 있다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" />);

    expect(screen.getByRole('button', { name: '즐겨찾기' })).toBeOnTheScreen();
  });

  it('아이콘 글리프가 아니라 accessibilityLabel 이 이름이다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" />);

    expect(button()).toHaveAccessibleName('즐겨찾기');
  });

  it('아이콘이 두 번째 접근성 컨트롤을 만들지 않는다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('상호작용', () => {
  it('활성 상태에서 press 가 불린다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <IconButton icon={icon} accessibilityLabel="즐겨찾기" onPress={onPress} />,
    );

    await fireEvent.press(button());

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled 면 press 가 막힌다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <IconButton icon={icon} accessibilityLabel="즐겨찾기" disabled onPress={onPress} />,
    );

    await fireEvent.press(button());

    expect(onPress).not.toHaveBeenCalled();
  });

  it('loading 이면 press 가 막힌다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <IconButton icon={icon} accessibilityLabel="즐겨찾기" loading onPress={onPress} />,
    );

    await fireEvent.press(button());

    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('접근성 상태', () => {
  it('disabled 를 알린다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" disabled />);

    expect(button()).toBeDisabled();
  });

  it('loading 은 busy 와 disabled 를 함께 알린다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" loading />);

    expect(button()).toBeBusy();
    expect(button()).toBeDisabled();
  });

  it('loading 중에도 이름이 유지된다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" loading />);

    expect(button()).toHaveAccessibleName('즐겨찾기');
  });

  it('소비자가 accessibilityState 로 실제 disabled 를 뒤집을 수 없다', async () => {
    await renderWithTheme(
      <IconButton
        icon={icon}
        accessibilityLabel="즐겨찾기"
        disabled
        accessibilityState={{ disabled: false }}
      />,
    );

    expect(button()).toBeDisabled();
  });

  it('소비자가 accessibilityState 로 loading busy 를 뒤집을 수 없다', async () => {
    await renderWithTheme(
      <IconButton
        icon={icon}
        accessibilityLabel="즐겨찾기"
        loading
        accessibilityState={{ busy: false }}
      />,
    );

    expect(button()).toBeBusy();
  });
});

describe('시각 토큰', () => {
  it.each([
    ['sm', t.typography.fontSize.md, t.spacing.sm],
    ['md', t.typography.fontSize.xl, t.spacing.sm],
    ['lg', t.typography.fontSize.xxl, t.spacing.md],
  ] as const)('%s 는 토큰 아이콘 크기와 padding 을 쓴다', async (size, glyph, padding) => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" size={size} />);

    expect(iconSlot()).toHaveStyle({ width: glyph, height: glyph });
    expect(surface()).toHaveStyle({ padding, borderRadius: t.radius.rounded });
  });

  it('기본 size 는 md 다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" />);

    expect(iconSlot()).toHaveStyle({ width: t.typography.fontSize.xl });
  });

  it('배경은 항상 투명하다 — 아이콘 버튼은 면을 칠하지 않는다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" />);

    expect(surface()).toHaveStyle({ backgroundColor: 'transparent' });
  });
});

describe('content color 토큰', () => {
  /** 아이콘을 함수로 받으면 해석된 토큰 색을 넘깁니다. */
  const colorProbe = (state: { color: string }) => <Text testID="icon">{state.color}</Text>;

  it('primary 는 icon.primary 색을 넘긴다', async () => {
    await renderWithTheme(<IconButton icon={colorProbe} accessibilityLabel="즐겨찾기" />);

    expect(screen.getByTestId('icon')).toHaveTextContent(t.color.icon.primary);
  });

  it('secondary 는 icon.secondary 색을 넘긴다', async () => {
    await renderWithTheme(
      <IconButton icon={colorProbe} accessibilityLabel="즐겨찾기" color="secondary" />,
    );

    expect(screen.getByTestId('icon')).toHaveTextContent(t.color.icon.secondary);
  });

  it('disabled 는 icon.disable 색을 넘긴다', async () => {
    await renderWithTheme(<IconButton icon={colorProbe} accessibilityLabel="즐겨찾기" disabled />);

    expect(screen.getByTestId('icon')).toHaveTextContent(t.color.icon.disable);
  });

  it('disabled 중에는 pressed 가 참이 되지 않는다', async () => {
    const pressedProbe = (state: { pressed: boolean }) => (
      <Text testID="icon">{state.pressed ? 'on' : 'off'}</Text>
    );

    await renderWithTheme(
      <IconButton icon={pressedProbe} accessibilityLabel="즐겨찾기" disabled testOnly_pressed />,
    );

    expect(screen.getByTestId('icon')).toHaveTextContent('off');
  });
});

/**
 * Button 과 같은 눌림 언어입니다 — 색이 아니라 위치. 옮기는 것은 보이는 면이고,
 * 루트는 최소 터치 타깃을 지키는 상자라 제자리에 둡니다.
 */
describe('pressed 피드백', () => {
  it('눌리면 면이 토큰 오프셋만큼 내려간다', async () => {
    await renderWithTheme(
      <IconButton icon={icon} accessibilityLabel="즐겨찾기" testOnly_pressed />,
    );

    expect(surface()).toHaveStyle({ transform: [{ translateY: t.component.pressedOffset }] });
  });

  it('눌리지 않았으면 오프셋이 없다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" />);

    expect(surface()).not.toHaveStyle({ transform: [{ translateY: t.component.pressedOffset }] });
  });

  it.each([
    ['disabled', { disabled: true }],
    ['loading', { loading: true }],
  ] as const)('%s 면 눌림 표현이 나오지 않는다', async (_label, props) => {
    await renderWithTheme(
      <IconButton icon={icon} accessibilityLabel="즐겨찾기" testOnly_pressed {...props} />,
    );

    expect(surface()).not.toHaveStyle({ transform: [{ translateY: t.component.pressedOffset }] });
  });
});

describe('loading', () => {
  it('기본 스피너는 ActivityIndicator 다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" loading />);

    expect(elementChildren(surface()).some((c) => c.type === 'ActivityIndicator')).toBe(true);
  });

  it('커스텀 loadingIndicator 를 그대로 쓴다', async () => {
    await renderWithTheme(
      <IconButton
        icon={icon}
        accessibilityLabel="즐겨찾기"
        loading
        loadingIndicator={<Text testID="spinner">…</Text>}
      />,
    );

    expect(screen.getByTestId('spinner')).toBeOnTheScreen();
    expect(elementChildren(surface()).some((c) => c.type === 'ActivityIndicator')).toBe(false);
  });

  it('스피너가 따로 조작 가능한 접근성 노드가 되지 않는다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" loading />);

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('loading 이 아니면 스피너가 없다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" />);

    expect(elementChildren(surface()).some((c) => c.type === 'ActivityIndicator')).toBe(false);
  });
});

describe('터치 타깃', () => {
  it.each(['sm', 'md', 'lg'] as const)(
    '%s 는 시각 크기와 무관하게 터치 타깃 정책을 지킨다',
    async (size) => {
      await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" size={size} />);

      expect(button()).toHaveStyle({
        minWidth: MIN_TOUCH_TARGET,
        minHeight: MIN_TOUCH_TARGET,
      });
    },
  );

  it('sm 은 아이콘을 작게 유지하면서 타깃을 지킨다', async () => {
    await renderWithTheme(<IconButton icon={icon} accessibilityLabel="즐겨찾기" size="sm" />);

    // 아이콘 글리프는 18 로 작다.
    expect(iconSlot()).toHaveStyle({ width: t.typography.fontSize.md });
    // 누를 수 있는 루트는 48 아래로 내려가지 않는다.
    expect(button()).toHaveStyle({ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET });
  });
});

/** 타입 수준 계약. `tsc -b`가 검증합니다. */
type Expect<T extends true> = T;
type IsIconButton<T> = T extends IconButtonProps ? true : false;
type HasProp<K extends string> = K extends keyof IconButtonProps ? true : false;
type AcceptsValue<V, T> = V extends T ? true : false;

export type NameIsRequired = [
  Expect<IsIconButton<{ icon: ReactNode; accessibilityLabel: 'star' }>>,
  // 이름 없는 아이콘 버튼은 스크린리더에서 정체불명이 됩니다.
  Expect<IsIconButton<{ icon: ReactNode }> extends false ? true : false>,
  Expect<IsIconButton<{ accessibilityLabel: 'star' }> extends false ? true : false>,
];

export type RejectsWebOnlyProps = [
  // `edge`는 자체 padding을 음수 margin으로 상쇄하는 웹 레이아웃 관용구라 RN에 대응 개념이 없습니다.
  Expect<HasProp<'edge'> extends false ? true : false>,
  Expect<HasProp<'href'> extends false ? true : false>,
  Expect<HasProp<'component'> extends false ? true : false>,
  Expect<HasProp<'className'> extends false ? true : false>,
];

export type RejectsUnknownVocabulary = [
  Expect<AcceptsValue<'xl', IconButtonProps['size']> extends false ? true : false>,
  Expect<AcceptsValue<'error', IconButtonProps['color']> extends false ? true : false>,
];

export type LoadingIsPlainBoolean = [
  Expect<AcceptsValue<true, IconButtonProps['loading']>>,
  // web의 `boolean | null` 3-상태는 renderer 사정이지 공유 불변식이 아닙니다.
  Expect<AcceptsValue<null, IconButtonProps['loading']> extends false ? true : false>,
];

/**
 * `tabIndex`는 DOM 유출이 아닙니다 — RN `ViewProps`가 직접 가지며 `focusable`로 매핑됩니다.
 * 타입이 `0 | -1`이라 DOM식 임의 숫자는 거부됩니다.
 */
export type KeepsRnTabIndex = [
  Expect<AcceptsValue<0, IconButtonProps['tabIndex']>>,
  Expect<AcceptsValue<5, IconButtonProps['tabIndex']> extends false ? true : false>,
];
