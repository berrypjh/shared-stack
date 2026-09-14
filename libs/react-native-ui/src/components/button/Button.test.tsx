/**
 * RN Button의 동작·토큰·접근성 계약.
 *
 * 스타일은 CSS 대응이 아니라 해석된 RN 값으로 검증합니다. 기대값은 `Native.Light.tokens`에서
 * 읽습니다 — 디자인 값을 박아 넣으면 토큰이 바뀔 때 조용히 어긋납니다.
 */
import { Text } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import type { PressableProps, View } from 'react-native';

import { ThemeProvider } from '../../theme';
import type { ButtonBaseProps } from '../button-base/ButtonBase.types';

import { Button } from './Button';
import type { ButtonProps, ButtonStyle } from './Button.types';

const t = Native.Light.tokens;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);
const button = () => screen.getByRole('button');

/**
 * 렌더 트리를 깊이 우선으로 훑어 관심 있는 노드만 순서대로 남깁니다.
 * 래퍼 이름 대신 "라벨보다 앞이냐 뒤냐"만 봅니다.
 *
 * RNTL 14는 `UNSAFE_getByType`을 없앴고 기본 indicator는 접근성 노드가 아니라 role로도
 * 잡히지 않으므로, 호스트 타입을 여기서 직접 봅니다.
 */
const markerOrder = (): string[] => {
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      out.push(`text:${node}`);
      return;
    }
    if (node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const n = node as { type?: string; props?: Record<string, unknown>; children?: unknown };
    const testID = n.props?.testID;
    if (typeof testID === 'string') out.push(testID);
    if (n.type === 'ActivityIndicator') out.push('indicator');
    walk(n.children);
  };
  walk(screen.toJSON());
  return out;
};

describe('기본 동작', () => {
  it('보이는 라벨을 렌더한다', async () => {
    await renderWithTheme(<Button>Save</Button>);

    expect(screen.getByText('Save')).toBeOnTheScreen();
  });

  it('보이는 라벨이 접근 가능한 이름이 된다', async () => {
    await renderWithTheme(<Button>Save</Button>);

    expect(button()).toHaveAccessibleName('Save');
  });

  it('accessibilityLabel 이 있으면 그쪽이 이름이 된다', async () => {
    await renderWithTheme(<Button accessibilityLabel="저장하기">Save</Button>);

    expect(button()).toHaveAccessibleName('저장하기');
  });

  it('활성 상태에서 onPress 가 불린다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button onPress={onPress}>Save</Button>);

    await fireEvent.press(button());

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled 면 press 가 막힌다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <Button disabled onPress={onPress}>
        Save
      </Button>,
    );

    await fireEvent.press(button());

    expect(onPress).not.toHaveBeenCalled();
    expect(button()).toBeDisabled();
  });

  it('ref 가 Pressable 호스트까지 닿는다', async () => {
    // ButtonBase 테스트는 ButtonBase→Pressable 구간만 본다. Button 은 자체 prop 만
    // 구조분해하고 나머지를 흘리므로, ref 가 그 목록에 잘못 들어가면 여기서만 잡힌다.
    const ref = { current: null } as { current: View | null };

    await renderWithTheme(<Button ref={ref}>Save</Button>);

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.measure).toBe('function');
  });
});

describe('variant 토큰', () => {
  it('contained 는 solid 배경과 contrast 라벨색을 쓴다', async () => {
    await renderWithTheme(<Button variant="contained">Save</Button>);

    expect(button()).toHaveStyle({ backgroundColor: t.color.primaryBtn.default });
    expect(screen.getByText('Save')).toHaveStyle({ color: t.color.text.contrastText });
  });

  it('outlined 는 투명 배경 + 토큰 테두리를 쓴다', async () => {
    await renderWithTheme(<Button variant="outlined">Save</Button>);

    expect(button()).toHaveStyle({
      backgroundColor: 'transparent',
      borderColor: t.border.primary.color,
      borderWidth: t.border.primary.width,
    });
    expect(screen.getByText('Save')).toHaveStyle({ color: t.color.text.primary });
  });

  it('text 는 배경도 테두리도 없다', async () => {
    await renderWithTheme(<Button variant="text">Save</Button>);

    expect(button()).toHaveStyle({ backgroundColor: 'transparent', borderWidth: 0 });
    expect(screen.getByText('Save')).toHaveStyle({ color: t.color.text.primary });
  });

  it('disabled contained 는 disabled 배경과 disabled 라벨색을 쓴다', async () => {
    await renderWithTheme(
      <Button variant="contained" disabled>
        Save
      </Button>,
    );

    expect(button()).toHaveStyle({ backgroundColor: t.color.primaryBtn.disabled });
    expect(screen.getByText('Save')).toHaveStyle({ color: t.color.text.disable });
  });

  it('disabled outlined 는 disabled 테두리를 쓴다', async () => {
    await renderWithTheme(
      <Button variant="outlined" disabled>
        Save
      </Button>,
    );

    expect(button()).toHaveStyle({ borderColor: t.border.disabled.color });
  });
});

describe('size 토큰', () => {
  it.each([
    ['sm', t.spacing.md, t.spacing.sm, t.radius.sm, t.typography.body.smallStrong],
    ['md', t.spacing.xl, t.spacing.sm, t.radius.md, t.typography.body.mediumStrong],
    ['lg', t.spacing['2xl'], t.spacing.md, t.radius.lg, t.typography.body.largeStrong],
  ] as const)(
    '%s 는 토큰 padding/radius/typography 를 쓴다',
    async (size, px, py, radius, type) => {
      await renderWithTheme(<Button size={size}>Save</Button>);

      expect(button()).toHaveStyle({
        paddingHorizontal: px,
        paddingVertical: py,
        borderRadius: radius,
      });
      expect(screen.getByText('Save')).toHaveStyle({
        fontFamily: type.fontFamily,
        fontSize: type.fontSize,
        fontWeight: type.fontWeight,
        lineHeight: type.lineHeight,
      });
    },
  );
});

describe('color 토큰', () => {
  it('secondary contained 는 secondary 배경을 쓴다', async () => {
    await renderWithTheme(
      <Button color="secondary" variant="contained">
        Save
      </Button>,
    );

    expect(button()).toHaveStyle({ backgroundColor: t.color.secondaryBtn.default });
  });

  it('secondary outlined 는 secondary stroke 와 라벨색을 쓴다', async () => {
    await renderWithTheme(
      <Button color="secondary" variant="outlined">
        Save
      </Button>,
    );

    expect(button()).toHaveStyle({ borderColor: t.color.stroke.secondary });
    expect(screen.getByText('Save')).toHaveStyle({ color: t.color.text.secondary });
  });
});

describe('fullWidth', () => {
  it('기본값은 내용 너비다', async () => {
    await renderWithTheme(<Button>Save</Button>);

    expect(button()).not.toHaveStyle({ alignSelf: 'stretch' });
  });

  it('fullWidth 는 부모 폭을 채운다', async () => {
    await renderWithTheme(<Button fullWidth>Save</Button>);

    expect(button()).toHaveStyle({ alignSelf: 'stretch' });
  });
});

describe('아이콘 슬롯', () => {
  it('startIcon 은 라벨 앞에 온다', async () => {
    await renderWithTheme(<Button startIcon={<Text testID="start">S</Text>}>Save</Button>);

    const order = markerOrder();
    expect(order.indexOf('start')).toBeLessThan(order.indexOf('text:Save'));
  });

  it('endIcon 은 라벨 뒤에 온다', async () => {
    await renderWithTheme(<Button endIcon={<Text testID="end">E</Text>}>Save</Button>);

    const order = markerOrder();
    expect(order.indexOf('text:Save')).toBeLessThan(order.indexOf('end'));
  });

  it('두 아이콘을 동시에 쓸 수 있다', async () => {
    await renderWithTheme(
      <Button startIcon={<Text testID="start">S</Text>} endIcon={<Text testID="end">E</Text>}>
        Save
      </Button>,
    );

    const order = markerOrder();
    expect(order.indexOf('start')).toBeLessThan(order.indexOf('text:Save'));
    expect(order.indexOf('text:Save')).toBeLessThan(order.indexOf('end'));
  });
});

describe('loading', () => {
  it('기본값은 loading 아님 — indicator 가 없다', async () => {
    await renderWithTheme(<Button>Save</Button>);

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(markerOrder()).not.toContain('indicator');
  });

  it('loading 이면 기본 ActivityIndicator 를 렌더한다', async () => {
    await renderWithTheme(<Button loading>Save</Button>);

    expect(markerOrder()).toContain('indicator');
  });

  it('커스텀 loadingIndicator 를 그대로 렌더한다', async () => {
    await renderWithTheme(
      <Button loading loadingIndicator={<Text testID="spinner">…</Text>}>
        Save
      </Button>,
    );

    expect(screen.getByTestId('spinner')).toBeOnTheScreen();
    // 소비자 노드가 기본 ActivityIndicator를 대체합니다.
    expect(markerOrder()).not.toContain('indicator');
  });

  it('loading 이면 press 가 막힌다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <Button loading onPress={onPress}>
        Save
      </Button>,
    );

    await fireEvent.press(button());

    expect(onPress).not.toHaveBeenCalled();
  });

  it('loading 은 busy 와 disabled 를 함께 노출한다', async () => {
    await renderWithTheme(<Button loading>Save</Button>);

    expect(button()).toBeBusy();
    expect(button()).toBeDisabled();
  });

  it('loading 중에도 접근 가능한 이름이 유지된다', async () => {
    await renderWithTheme(<Button loading>Save</Button>);

    expect(button()).toHaveAccessibleName('Save');
  });

  it('loading indicator 가 따로 포커스되는 접근성 노드가 되지 않는다', async () => {
    await renderWithTheme(<Button loading>Save</Button>);

    // RN 에서 root 가 busy 를 알리므로 spinner 를 별도 progressbar 로 또 노출하지 않는다.
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it.each([
    ['start', true],
    ['end', false],
  ] as const)('loadingPosition=%s 는 indicator 를 라벨 %s 에 둔다', async (position, before) => {
    await renderWithTheme(
      <Button loading loadingPosition={position}>
        Save
      </Button>,
    );

    const order = markerOrder();
    const indicator = order.indexOf('indicator');
    const label = order.indexOf('text:Save');

    expect(indicator).toBeGreaterThanOrEqual(0);
    expect(before ? indicator < label : indicator > label).toBe(true);
  });

  it('loadingPosition=center 는 라벨을 가리되 트리에는 남긴다', async () => {
    await renderWithTheme(
      <Button loading loadingPosition="center">
        Save
      </Button>,
    );

    // 이름 보존을 위해 라벨은 언마운트하지 않고 시각적으로만 감춥니다.
    expect(screen.getByText('Save')).toBeOnTheScreen();
    expect(button()).toHaveAccessibleName('Save');
    expect(screen.getByText('Save').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
    );
  });
});

/**
 * 눌림 피드백.
 *
 * 이 디자인 시스템의 pressed 는 색이 아니라 **위치**입니다 — web `.ui-button:active` 가 색을
 * 그대로 둔 채 `translateY(var(--ds-component-pressed-offset))` 만 주는 것과 같은 값,
 * 같은 뜻입니다. `hover` 토큰을 pressed 로 돌려쓰지 않습니다.
 */
describe('pressed 피드백', () => {
  it('눌리면 토큰 오프셋만큼 내려간다', async () => {
    await renderWithTheme(<Button testOnly_pressed>Save</Button>);

    expect(button()).toHaveStyle({ transform: [{ translateY: t.component.pressedOffset }] });
  });

  it('눌리지 않았으면 오프셋이 없다', async () => {
    await renderWithTheme(<Button>Save</Button>);

    expect(button()).not.toHaveStyle({ transform: [{ translateY: t.component.pressedOffset }] });
  });

  it.each([
    ['disabled', { disabled: true }],
    ['loading', { loading: true }],
  ] as const)('%s 면 눌림 표현이 나오지 않는다', async (_label, props) => {
    await renderWithTheme(
      <Button testOnly_pressed {...props}>
        Save
      </Button>,
    );

    expect(button()).not.toHaveStyle({ transform: [{ translateY: t.component.pressedOffset }] });
  });
});

describe('소비자 style', () => {
  it('일반 표현은 소비자가 덮어쓸 수 있다', async () => {
    await renderWithTheme(<Button style={{ backgroundColor: 'rgb(1, 2, 3)' }}>Save</Button>);

    expect(button()).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
  });

  it('disabled 표현은 소비자 style 보다 우선한다', async () => {
    await renderWithTheme(
      <Button disabled style={{ backgroundColor: 'rgb(1, 2, 3)' }}>
        Save
      </Button>,
    );

    expect(button()).toHaveStyle({ backgroundColor: t.color.primaryBtn.disabled });
  });

  it('loading 표현도 소비자 style 보다 우선한다', async () => {
    await renderWithTheme(
      <Button loading style={{ backgroundColor: 'rgb(1, 2, 3)' }}>
        Save
      </Button>,
    );

    expect(button()).toHaveStyle({ backgroundColor: t.color.primaryBtn.disabled });
  });

  it('pressed 오프셋은 소비자가 덮을 수 있다', async () => {
    // 배열 순서를 가정하지 않고, 실제로 소비자 값이 이겼는지 본다.
    // disabled·loading 과 달리 눌림은 안전 장치가 아니라 표현이라 양보한다.
    await renderWithTheme(
      <Button testOnly_pressed style={{ transform: [{ translateY: 9 }] }}>
        Save
      </Button>,
    );

    expect(button()).toHaveStyle({ transform: [{ translateY: 9 }] });
  });

  it('disabled/loading 중에는 pressed 표현이 살아나지 않는다', async () => {
    await renderWithTheme(
      <Button
        loading
        testOnly_pressed
        style={({ pressed }) => (pressed ? { backgroundColor: 'rgb(9, 9, 9)' } : null)}
      >
        Save
      </Button>,
    );

    expect(button()).toHaveStyle({ backgroundColor: t.color.primaryBtn.disabled });
  });
});

/**
 * 타입 수준 계약. `tsc -b`가 검증합니다.
 * `@ts-expect-error`는 엉뚱한 이유로 만족될 수 있어 `Expect<>` 방식을 씁니다.
 */
type Expect<T extends true> = T;
type HasProp<K extends string> = K extends keyof ButtonProps ? true : false;
type Accepts<K extends keyof ButtonProps, V> = V extends ButtonProps[K] ? true : false;

/** web 전용 개념은 RN Button의 prop이 아닙니다. */
export type RejectsWebOnlyProps = [
  Expect<HasProp<'href'> extends false ? true : false>,
  Expect<HasProp<'component'> extends false ? true : false>,
  Expect<HasProp<'className'> extends false ? true : false>,
];

/**
 * `tabIndex`는 web 유출이 아닙니다 — RN `ViewProps`가 직접 가진 prop이고(`focusable`로 매핑)
 * 타입도 DOM의 `number`가 아니라 `0 | -1`입니다.
 */
export type KeepsRnTabIndex = [
  Expect<Accepts<'tabIndex', 0>>,
  Expect<Accepts<'tabIndex', -1>>,
  Expect<Accepts<'tabIndex', 5> extends false ? true : false>,
];

/** 어휘 밖의 값은 받지 않습니다. `color: 'error'`는 web SCSS에만 있고 계약에는 없습니다. */
export type RejectsUnknownVocabulary = [
  Expect<Accepts<'variant', 'ghost'> extends false ? true : false>,
  Expect<Accepts<'size', 'xl'> extends false ? true : false>,
  Expect<Accepts<'color', 'error'> extends false ? true : false>,
  Expect<Accepts<'loadingPosition', 'middle'> extends false ? true : false>,
];

/**
 * `ButtonProps`는 공개 선언 누출을 막으려고 `ButtonBaseProps`를 상속하지 않습니다.
 * 대신 두 목록이 갈라지지 않는지 여기서 잡습니다.
 */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export type StaysCompatibleWithButtonBase = [
  Expect<
    Equal<
      Exclude<keyof PressableProps, keyof ButtonBaseProps>,
      Exclude<keyof PressableProps, keyof ButtonProps>
    >
  >,
  Expect<ButtonStyle extends ButtonBaseProps['style'] ? true : false>,
];

/** 문서화된 값은 전부 받습니다. */
export type AcceptsDocumentedVocabulary = [
  Expect<Accepts<'variant', 'contained'>>,
  Expect<Accepts<'variant', 'outlined'>>,
  Expect<Accepts<'variant', 'text'>>,
  Expect<Accepts<'size', 'sm'>>,
  Expect<Accepts<'size', 'lg'>>,
  Expect<Accepts<'color', 'secondary'>>,
  Expect<Accepts<'loadingPosition', 'start'>>,
  Expect<Accepts<'loadingPosition', 'center'>>,
  Expect<Accepts<'loadingPosition', 'end'>>,
];
