import { Text, View } from 'react-native';

import type { ChipSize, ChipVariant } from '@berrypjh/ui-core';

import type { ReactNode } from 'react';
import type { GestureResponderEvent } from 'react-native';

import { useTheme } from '../../theme';
import { ButtonBase } from '../button-base/ButtonBase';

import { resolveChipLabelStyle, resolveChipRootStyle } from './Chip.styles';
import type { ChipProps } from './Chip.types';

/**
 * 판별 유니온을 런타임에서 한 번만 평평하게 펴는 내부 타입.
 *
 * **`ChipProps` 가 이 타입을 참조하지 않는다** — 그래서 `dts-bundle-generator` 가 공개 선언으로
 * 끌어올리지 않는다.
 */
type ChipRuntimeProps = {
  children?: ReactNode;
  leading?: ReactNode;
  size?: ChipSize;
  variant?: ChipVariant;
  style?: unknown;
  onPress?: (event: GestureResponderEvent) => void;
  selected?: boolean;
  disabled?: boolean;
  accessibilityState?: Record<string, unknown>;
} & Record<string, unknown>;

/**
 * compact label. 두 모드만 있다.
 *
 * - **passive** (`onPress` 없음) — `View`. 누를 수 없고 상태가 없고 터치 타깃도 없다.
 * - **interactive** (`onPress` 있음) — 내부 `ButtonBase`(Pressable). `selected` 를 함께 주면
 *   `accessibilityState.selected` 를 알린다.
 *
 * **`ButtonBase` 를 재사용한다.** `accessibilityRole="button"` 강제, `disabled` 강제(누름 차단 +
 * 접근성 상태), 최소 터치 타깃(`spacing.4xl`)을 소비자 style **뒤**에 얹어 줄일 수 없게 하는
 * 것을 이미 한다. 그것을 다시 만들면 그중 하나를 빠뜨린다. 공개되지 않는다 (배럴 없음).
 *
 * `selected` 를 주지 않으면 `accessibilityState.selected` 를 **두지 않는다** — 없는 토글
 * 시맨틱을 지어내면 스크린리더가 상태가 있다고 오해하게 만든다. `SegmentControl` 과 같은 모델이다.
 *
 * `accessibilityRole` 을 checkbox 로 바꾸지 않는다. 다중 선택 필터가 checkbox 처럼 보여도 그
 * 역할은 `Checkbox` 가 소유하고, 역할을 자동 전환하면 같은 컴포넌트가 문맥에 따라 다르게
 * 읽힌다.
 *
 * remove/delete 는 DEFER 다. chip 안에 두 번째 Pressable 을 넣으면 중첩 상호작용이 되고,
 * 그것을 피하는 구조는 실제 소비자 요구가 확인된 뒤에 설계한다.
 */
export const Chip = (props: ChipProps) => {
  const { tokens } = useTheme();

  const {
    children,
    leading,
    size = 'md',
    variant = 'outlined',
    style,
    onPress,
    selected,
    disabled = false,
    accessibilityState,
    ...rest
  } = props as ChipRuntimeProps;

  const interactive = onPress != null;

  const label =
    typeof children === 'string' || typeof children === 'number' ? (
      <Text style={resolveChipLabelStyle(tokens, { size, disabled })}>{children}</Text>
    ) : (
      children
    );

  const content = (
    <>
      {leading}
      {label}
    </>
  );

  const rootStyle = (pressed: boolean) =>
    resolveChipRootStyle(tokens, {
      size,
      variant,
      selected: selected ?? false,
      disabled,
      pressed,
    });

  if (!interactive) {
    return (
      <View {...rest} style={[rootStyle(false), style]}>
        {content}
      </View>
    );
  }

  return (
    <ButtonBase
      {...rest}
      onPress={onPress}
      disabled={disabled}
      // toggle 일 때만 둔다. `selected` 가 undefined 면 단순 action chip 이다.
      accessibilityState={
        selected == null ? accessibilityState : { ...accessibilityState, selected }
      }
      style={({ pressed }) => [rootStyle(pressed), style]}
    >
      {content}
    </ButtonBase>
  );
};
