/**
 * RN Chip 계약.
 *
 * 두 모드만 있다:
 *
 * 1. **passive** — `View` + `Text`. Pressable 이 아니고 상태가 없다.
 * 2. **interactive** — `onPress` 를 주면 내부 `ButtonBase`(Pressable). `selected` 를 함께 주면
 *    `accessibilityState.selected` 를 알린다.
 *
 * `ButtonBase` 를 재사용한다 — `accessibilityRole="button"` 강제, `disabled` 강제,
 * 최소 터치 타깃(`spacing.4xl`)을 소비자 style **뒤**에 얹어 줄일 수 없게 하는 것을 이미 한다.
 * 공개되지 않는다 (배럴 없음).
 *
 * `selected`·`disabled` 는 타입 수준에서 interactive 에만 허용된다 — 누를 수 없는 것에 선택
 * 시각만 주면 시맨틱 없는 상태가 된다.
 */
import { type ReactElement } from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../theme';

import { Chip } from './Chip';
import { resolveChipRootStyle } from './Chip.styles';
import * as barrel from './index';

const T = Native.Light.tokens;

const show = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const chip = () => screen.getByTestId('chip');

/** Chip 이 루트에 얹은 style 을 합쳐서 본다 (ButtonBase 가 배열로 넘긴다). */
const flat = (style: unknown): ViewStyle =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(Infinity).filter(Boolean))
    : (style as ViewStyle);

const rootStyle = (): ViewStyle => flat(chip().props.style);

describe('passive 모드', () => {
  it('Pressable 이 아니다 — button 역할이 없다', async () => {
    await show(<Chip testID="chip">태그</Chip>);

    expect(screen.queryByRole('button')).toBeNull();
    expect(chip().props.accessibilityRole).toBeUndefined();
  });

  it('라벨을 Text 로 렌더한다', async () => {
    await show(<Chip testID="chip">디자인 시스템</Chip>);

    expect(screen.getByText('디자인 시스템')).toBeOnTheScreen();
  });

  it('선택·비활성 상태를 알리지 않는다', async () => {
    await show(<Chip testID="chip">태그</Chip>);

    const state = chip().props.accessibilityState;

    expect(state?.selected).toBeUndefined();
    expect(state?.disabled).toBeUndefined();
  });

  it('최소 터치 타깃을 적용하지 않는다 — 누를 수 없다', async () => {
    await show(<Chip testID="chip">태그</Chip>);

    const style = rootStyle();

    expect(style.minHeight).toBeUndefined();
    expect(style.minWidth).toBeUndefined();
  });

  it('ViewProps 를 루트로 전달한다', async () => {
    await show(
      <Chip testID="chip" pointerEvents="none">
        태그
      </Chip>,
    );

    expect(chip().props.pointerEvents).toBe('none');
  });
});

describe('interactive 모드', () => {
  it('button 역할을 가진다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined}>
        필터
      </Chip>,
    );

    expect(screen.getByRole('button', { name: '필터' })).toBeOnTheScreen();
  });

  it('onPress 를 전달한다', async () => {
    const onPress = jest.fn();

    await show(
      <Chip testID="chip" onPress={onPress}>
        필터
      </Chip>,
    );
    await fireEvent.press(screen.getByRole('button', { name: '필터' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  /** `ButtonBase` 가 `spacing.4xl` 을 소비자 style 뒤에 얹는다 — 줄일 수 없다. */
  it('최소 터치 타깃을 적용한다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined}>
        필터
      </Chip>,
    );

    const style = rootStyle();

    expect(style.minWidth).toBe(T.spacing['4xl']);
    expect(style.minHeight).toBe(T.spacing['4xl']);
  });

  it('소비자 style 이 터치 타깃을 줄이지 못한다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined} style={{ minHeight: 10 }}>
        필터
      </Chip>,
    );

    // ButtonBase 가 터치 타깃을 마지막에 얹으므로 소비자 값이 이기지 못한다.
    expect(rootStyle().minHeight).toBe(T.spacing['4xl']);
  });

  it('accessibilityLabel 로 이름을 덮을 수 있다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined} accessibilityLabel="디자인 필터 적용">
        디자인
      </Chip>,
    );

    expect(screen.getByRole('button', { name: '디자인 필터 적용' })).toBeOnTheScreen();
  });

  it('accessibilityHint 를 전달한다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined} accessibilityHint="두 번 눌러 선택">
        필터
      </Chip>,
    );

    expect(chip().props.accessibilityHint).toBe('두 번 눌러 선택');
  });

  it('중첩 상호작용 요소를 만들지 않는다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined} leading={<View testID="icon" />}>
        필터
      </Chip>,
    );

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByTestId('icon')).toBeOnTheScreen();
  });
});

describe('selected', () => {
  it('selected 를 accessibilityState 로 알린다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined} selected>
        필터
      </Chip>,
    );

    expect(screen.getByRole('button', { name: '필터' })).toBeSelected();
  });

  it('selected=false 도 알린다 — toggle 임을 드러낸다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined} selected={false}>
        필터
      </Chip>,
    );

    expect(chip().props.accessibilityState?.selected).toBe(false);
  });

  /** `selected` 가 없으면 toggle 이 아니라 단순 action chip 이다. 없는 상태를 지어내지 않는다. */
  it('selected 가 없으면 selected 상태를 두지 않는다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined}>
        실행
      </Chip>,
    );

    expect(chip().props.accessibilityState?.selected).toBeUndefined();
  });

  it('선택된 면과 테두리를 함께 바꾼다 — 색 하나에 의존하지 않는다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined} selected>
        필터
      </Chip>,
    );

    const style = rootStyle();

    expect(style.backgroundColor).toBe(T.color.background.selected);
    expect(style.borderColor).toBe(T.color.selectionControl.checked);
  });
});

describe('disabled', () => {
  it('누름을 실제로 차단한다', async () => {
    const onPress = jest.fn();

    await show(
      <Chip testID="chip" onPress={onPress} disabled>
        필터
      </Chip>,
    );
    await fireEvent.press(screen.getByRole('button', { name: '필터' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('disabled 를 접근성으로 알린다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined} disabled>
        필터
      </Chip>,
    );

    expect(screen.getByRole('button', { name: '필터' })).toBeDisabled();
  });

  it('disabled 여도 selected 를 계속 알린다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined} selected disabled>
        필터
      </Chip>,
    );

    const state = chip().props.accessibilityState;

    expect(state?.selected).toBe(true);
    expect(state?.disabled).toBe(true);
  });

  it('비활성 라벨 색을 쓴다', async () => {
    await show(
      <Chip testID="chip" onPress={() => undefined} disabled>
        필터
      </Chip>,
    );

    expect((screen.getByText('필터').props.style as { color?: string }).color).toBe(
      T.color.text.disable,
    );
  });
});

describe('pressed', () => {
  /**
   * pressed 는 **색이 아니라 위치**다 — `component.pressedOffset`. 이 저장소의 정본 표현이고
   * Button·IconButton 이 같은 언어를 쓴다.
   */
  it('눌림을 오프셋으로 표현한다 — 색을 바꾸지 않는다', () => {
    const resting = resolveChipRootStyle(T, {
      size: 'md',
      variant: 'outlined',
      selected: false,
      disabled: false,
      pressed: false,
    });
    const pressed = resolveChipRootStyle(T, {
      size: 'md',
      variant: 'outlined',
      selected: false,
      disabled: false,
      pressed: true,
    });

    expect(resting.transform).toBeUndefined();
    expect(pressed.transform).toEqual([{ translateY: T.component.pressedOffset }]);
    // 색은 그대로다 — pressed 는 위치로만 표현한다.
    expect(pressed.backgroundColor).toBe(resting.backgroundColor);
    expect(pressed.borderColor).toBe(resting.borderColor);
  });
});

describe('size · variant', () => {
  it('기본값은 md · outlined 다', async () => {
    await show(<Chip testID="chip">태그</Chip>);

    const style = rootStyle();

    expect(style.paddingHorizontal).toBe(T.spacing.md);
    // outlined 는 면이 없다.
    expect(style.backgroundColor).toBe('transparent');
  });

  it('size=sm 은 더 좁은 padding 을 쓴다', async () => {
    await show(
      <Chip testID="chip" size="sm">
        태그
      </Chip>,
    );

    expect(rootStyle().paddingHorizontal).toBe(T.spacing.sm);
  });

  it('variant=filled 는 옅은 면을 갖는다', async () => {
    await show(
      <Chip testID="chip" variant="filled">
        태그
      </Chip>,
    );

    expect(rootStyle().backgroundColor).toBe(T.color.field.surfaceSubtle);
  });
});

describe('leading 슬롯', () => {
  it('라벨 앞에 렌더한다', async () => {
    await show(
      <Chip testID="chip" leading={<View testID="icon" />}>
        태그
      </Chip>,
    );

    expect(screen.getByTestId('icon')).toBeOnTheScreen();
    expect(screen.getByText('태그')).toBeOnTheScreen();
  });

  it('문자열 라벨이 아니면 Text 로 감싸지 않는다', async () => {
    await show(
      <Chip testID="chip">
        <Text testID="custom">직접 만든 라벨</Text>
      </Chip>,
    );

    expect(screen.getByTestId('custom')).toBeOnTheScreen();
  });
});

describe('style', () => {
  it('소비자 style 이 계산된 값을 덮는다 (터치 타깃 제외)', async () => {
    await show(
      <Chip testID="chip" style={{ backgroundColor: 'rgb(1, 2, 3)' }}>
        태그
      </Chip>,
    );

    expect(rootStyle().backgroundColor).toBe('rgb(1, 2, 3)');
  });
});

describe('공개 배럴', () => {
  it('Chip 만 내보낸다 — ButtonBase 는 비공개다', async () => {
    expect(Object.keys(barrel)).toEqual(['Chip']);
  });
});
