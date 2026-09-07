/**
 * RN Fab의 동작·토큰·접근성 계약.
 *
 * 시각 크기와 터치 영역이 갈라지므로(`sm`은 지름 40 / 타깃 48) 두 값을 따로 검증합니다.
 * 스타일·prop 설정만 확인하며, 실제 기기의 물리적 터치 면적을 측정하지는 않습니다.
 */
import { Text } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { ThemeProvider } from '../../theme';

import { Fab } from './Fab';
import type { FabProps } from './Fab.types';

const t = Native.Light.tokens;

/** 토큰 기반 최소 터치 타깃. */
const MIN_TOUCH_TARGET = t.spacing['4xl'];

type ShadowLayer = {
  readonly blur: number;
  readonly color: string;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly spread: number;
};

/** 토큰의 다층 shadow를 RN `boxShadow` 배열로 옮긴 기대값. */
const boxShadow = (layers: Record<string, ShadowLayer>) =>
  Object.values(layers).map((l) => ({
    offsetX: l.offsetX,
    offsetY: l.offsetY,
    blurRadius: l.blur,
    spreadDistance: l.spread,
    color: l.color,
  }));

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);
const fab = () => screen.getByRole('button');

type El = ReturnType<typeof screen.getByRole>;
const elementChildren = (el: El): El[] => el.children.filter((c): c is El => typeof c !== 'string');

/**
 * 눈에 보이는 원판·알약. 루트(터치 타깃) 바로 아래 한 겹입니다.
 * 래퍼에 testID를 박으면 그게 사실상 공개 API가 되므로 구조로 찾습니다.
 */
const surface = () => elementChildren(fab())[0];
/** 아이콘 슬롯 — 표면의 첫 자식. */
const iconSlot = () => elementChildren(surface())[0];

describe('shape', () => {
  it('기본은 circular 다 — 지름이 같은 원판을 그린다', async () => {
    await renderWithTheme(<Fab icon={<Text>+</Text>} accessibilityLabel="추가" />);

    expect(surface()).toHaveStyle({
      width: t.typography.fontSize['7xl'],
      height: t.typography.fontSize['7xl'],
      borderRadius: t.radius.rounded,
    });
  });

  it('extended 는 라벨을 담는 알약이다 — 폭이 내용에 따라 늘어난다', async () => {
    await renderWithTheme(<Fab shape="extended">만들기</Fab>);

    const style = surface();
    expect(style).toHaveStyle({
      height: t.typography.fontSize['7xl'],
      borderRadius: t.radius.rounded,
      paddingHorizontal: t.spacing.xl,
    });
    expect(style).not.toHaveStyle({ width: t.typography.fontSize['7xl'] });
  });
});

describe('circular', () => {
  it('icon 을 렌더한다', async () => {
    await renderWithTheme(<Fab icon={<Text testID="icon">+</Text>} accessibilityLabel="추가" />);

    expect(screen.getByTestId('icon')).toBeOnTheScreen();
  });

  it('role=button 이고 accessibilityLabel 이 이름이 된다', async () => {
    await renderWithTheme(<Fab icon={<Text>+</Text>} accessibilityLabel="추가" />);

    expect(fab()).toBeOnTheScreen();
    expect(fab()).toHaveAccessibleName('추가');
  });

  it('press 가 동작한다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <Fab icon={<Text>+</Text>} accessibilityLabel="추가" onPress={onPress} />,
    );

    await fireEvent.press(fab());

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('아이콘이 두 번째 접근성 컨트롤을 만들지 않는다', async () => {
    await renderWithTheme(<Fab icon={<Text>+</Text>} accessibilityLabel="추가" />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('extended', () => {
  it('보이는 라벨을 렌더하고 그것이 이름이 된다', async () => {
    await renderWithTheme(<Fab shape="extended">만들기</Fab>);

    expect(screen.getByText('만들기')).toBeOnTheScreen();
    expect(fab()).toHaveAccessibleName('만들기');
  });

  it('accessibilityLabel 로 이름을 덮을 수 있다', async () => {
    await renderWithTheme(
      <Fab shape="extended" accessibilityLabel="새 문서 만들기">
        만들기
      </Fab>,
    );

    expect(fab()).toHaveAccessibleName('새 문서 만들기');
  });

  it('아이콘은 선택이고, 있으면 라벨 앞에 온다', async () => {
    await renderWithTheme(
      <Fab shape="extended" icon={<Text testID="icon">+</Text>}>
        만들기
      </Fab>,
    );

    expect(screen.getByTestId('icon')).toBeOnTheScreen();
    expect(surface()).toHaveStyle({ flexDirection: 'row', gap: t.spacing.sm });
  });
});

describe('size 토큰', () => {
  it.each([
    ['sm', t.spacing['3xl'], t.typography.fontSize.md],
    ['md', t.spacing['4xl'], t.typography.fontSize.lg],
    ['lg', t.typography.fontSize['7xl'], t.typography.fontSize.xl],
  ] as const)('circular %s 는 토큰 지름과 아이콘 크기를 쓴다', async (size, diameter, icon) => {
    await renderWithTheme(<Fab size={size} icon={<Text>+</Text>} accessibilityLabel="추가" />);

    expect(surface()).toHaveStyle({ width: diameter, height: diameter });
    expect(iconSlot()).toHaveStyle({ width: icon, height: icon });
  });

  it('기본 size 는 lg 다', async () => {
    await renderWithTheme(<Fab icon={<Text>+</Text>} accessibilityLabel="추가" />);

    expect(surface()).toHaveStyle({ width: t.typography.fontSize['7xl'] });
  });
});

describe('color 토큰', () => {
  it('기본 primary 는 primary 배경과 contrast 아이콘/라벨색을 쓴다', async () => {
    await renderWithTheme(<Fab shape="extended">만들기</Fab>);

    expect(surface()).toHaveStyle({ backgroundColor: t.color.primaryBtn.default });
    expect(screen.getByText('만들기')).toHaveStyle({ color: t.color.text.contrastText });
  });

  it('secondary 는 secondary 배경을 쓴다', async () => {
    await renderWithTheme(
      <Fab color="secondary" shape="extended">
        만들기
      </Fab>,
    );

    expect(surface()).toHaveStyle({ backgroundColor: t.color.secondaryBtn.default });
  });
});

describe('disabled', () => {
  it('disabled 를 알리고 press 를 막는다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <Fab disabled onPress={onPress} icon={<Text>+</Text>} accessibilityLabel="추가" />,
    );

    await fireEvent.press(fab());

    expect(fab()).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('disabled 표면은 disabled 배경과 그림자 없음을 쓴다', async () => {
    await renderWithTheme(<Fab disabled icon={<Text>+</Text>} accessibilityLabel="추가" />);

    expect(surface()).toHaveStyle({
      backgroundColor: t.color.primaryBtn.disabled,
      boxShadow: [],
    });
  });

  it('disabled 중에는 pressed elevation 이 살아나지 않는다', async () => {
    await renderWithTheme(
      <Fab disabled testOnly_pressed icon={<Text>+</Text>} accessibilityLabel="추가" />,
    );

    expect(surface()).toHaveStyle({ boxShadow: [] });
  });
});

describe('터치 타깃', () => {
  it('sm 은 시각 지름 40 을 유지하면서 터치 타깃 48 을 지킨다', async () => {
    await renderWithTheme(<Fab size="sm" icon={<Text>+</Text>} accessibilityLabel="추가" />);

    // 눈에 보이는 원판은 작게 남는다.
    expect(surface()).toHaveStyle({ width: t.spacing['3xl'], height: t.spacing['3xl'] });
    // 실제로 누를 수 있는 루트는 정책 하한 아래로 내려가지 않는다.
    expect(fab()).toHaveStyle({
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
    });
  });
});

describe('elevation 토큰', () => {
  it('평상시에는 shadow.lg 를 쓴다', async () => {
    await renderWithTheme(<Fab icon={<Text>+</Text>} accessibilityLabel="추가" />);

    expect(surface()).toHaveStyle({ boxShadow: boxShadow(t.shadow.lg) });
  });

  it('눌리면 shadow.xl 로 올라간다', async () => {
    await renderWithTheme(<Fab testOnly_pressed icon={<Text>+</Text>} accessibilityLabel="추가" />);

    expect(surface()).toHaveStyle({ boxShadow: boxShadow(t.shadow.xl) });
  });
});

/** 타입 수준 계약. circular은 아이콘만 있는 컨트롤이라 이름을 타입에서 요구합니다. */
type Expect<T extends true> = T;
type IsFab<T> = T extends FabProps ? true : false;
type HasProp<K extends string> = K extends keyof FabProps ? true : false;
type AcceptsValue<V, T> = V extends T ? true : false;

export type CircularRequiresIconAndName = [
  Expect<IsFab<{ icon: ReactNode; accessibilityLabel: 'add' }>>,
  // 이름 없는 아이콘 전용 컨트롤은 스크린리더에서 정체불명이 됩니다.
  Expect<IsFab<{ icon: ReactNode }> extends false ? true : false>,
  Expect<IsFab<{ accessibilityLabel: 'add' }> extends false ? true : false>,
  // 원형 Fab에 보이는 라벨을 넣으면 원판 밖으로 새거나 잘립니다.
  Expect<
    IsFab<{ icon: ReactNode; accessibilityLabel: 'add'; children: 'Create' }> extends false
      ? true
      : false
  >,
];

export type ExtendedRequiresLabel = [
  Expect<IsFab<{ shape: 'extended'; children: 'Create' }>>,
  Expect<IsFab<{ shape: 'extended'; children: 'Create'; icon: ReactNode }>>,
  Expect<IsFab<{ shape: 'extended' }> extends false ? true : false>,
];

export type RejectsUnknownVocabulary = [
  Expect<AcceptsValue<'square', FabProps['shape']> extends false ? true : false>,
  Expect<AcceptsValue<'xl', FabProps['size']> extends false ? true : false>,
  Expect<AcceptsValue<'error', FabProps['color']> extends false ? true : false>,
];

export type RejectsWebOnlyProps = [
  Expect<HasProp<'href'> extends false ? true : false>,
  Expect<HasProp<'component'> extends false ? true : false>,
  Expect<HasProp<'className'> extends false ? true : false>,
];
