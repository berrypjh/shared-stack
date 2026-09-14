import type { ChipSemanticProps, ChipSize, ChipVariant } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type {
  GestureResponderEvent,
  PressableProps,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

export type { ChipSize, ChipVariant };

/** 두 모드가 함께 갖는 것. 어휘는 ui-core, 슬롯은 RN 이 소유한다. */
type ChipSharedProps = Omit<ChipSemanticProps, 'selected' | 'disabled'> & {
  /** 라벨. 문자열·숫자는 토큰 타이포로 감싸고, element 는 그대로 렌더한다. */
  children?: ReactNode;

  /**
   * 라벨 앞 슬롯. 아이콘이나 `Avatar` 를 넣는다.
   *
   * `Avatar` 에 강결합하지 않는다 — 그냥 노드다. 누를 수 있는 요소를 넣으면 interactive
   * 모드에서 Pressable 안 Pressable 이 되므로 넣지 않는다.
   */
  leading?: ReactNode;

  ref?: Ref<View>;

  style?: StyleProp<ViewStyle>;
};

/**
 * Chip 의 prop. **두 모드의 판별 유니온**이다.
 *
 * - `onPress` 가 없으면 **passive**: `View` 로 렌더되고 `selected`·`disabled` 를 받지 않는다.
 * - `onPress` 를 주면 **interactive**: 내부 `ButtonBase`(Pressable)가 되고 `selected`·
 *   `disabled` 가 열린다.
 *
 * `selected?: never` 로 막는 것이 핵심이다 — 누를 수 없는 것에 선택 시각만 주면 시맨틱 없는
 * 상태가 되고, 타입이 그것을 컴파일 타임에 거부한다.
 *
 * 보조 타입을 이름 붙여 교차시키지 않는다 — `dts-bundle-generator` 가 그 이름을 공개 선언으로
 * 끌어올린다.
 */
export type ChipProps =
  | (ChipSharedProps & {
      onPress?: never;
      selected?: never;
      disabled?: never;
    } & Omit<ViewProps, 'children' | 'style' | keyof ChipSharedProps>)
  | (ChipSharedProps & {
      /** 있으면 interactive 모드가 된다. */
      onPress: (event: GestureResponderEvent) => void;

      /**
       * toggle 선택 상태. 주면 `accessibilityState.selected` 를 알리고, 주지 않으면 단순
       * action chip 이다.
       */
      selected?: boolean;

      /** 누름을 실제로 차단하고 `accessibilityState.disabled` 를 알린다. */
      disabled?: boolean;
    } & Omit<
        PressableProps,
        | 'children'
        | 'style'
        | 'onPress'
        | 'disabled'
        | 'accessibilityRole'
        | 'aria-disabled'
        | keyof ChipSharedProps
      >);
