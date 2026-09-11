import type { ReactNode, Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

/**
 * 그룹 안의 선택지 하나. `RadioGroup` 밖에서는 쓸 수 없다 — RN 에는 native radio 그룹핑이 없어
 * 선택 값을 그룹이 가진다.
 *
 * 누름·역할·상태는 컴포넌트가 소유한다: `onPress`·`role`·`accessibilityRole` 을 받지 않고,
 * 소비자 `accessibilityState` 의 `checked`·`disabled` 는 실제 값으로 덮는다.
 * 이미 선택된 radio 를 누르면 아무 일도 없다 — 토글이 아니라 선택이다.
 */
export type RadioProps = (
  | {
      /** 문자열 라벨이 곧 이름이다. */
      label: string;
      accessibilityLabel?: string;
    }
  | {
      /** 노드 라벨이거나 라벨이 없으면 이름을 직접 줘야 한다. */
      label?: Exclude<ReactNode, string>;
      accessibilityLabel: string;
    }
) &
  Omit<
    PressableProps,
    | 'accessibilityLabel'
    | 'accessibilityRole'
    | 'role'
    | 'aria-checked'
    | 'aria-disabled'
    | 'children'
    | 'disabled'
    | 'onPress'
    | 'style'
  > & {
    ref?: Ref<View>;

    /** 그룹 안에서 선택을 가르는 키. */
    value: string;

    disabled?: boolean;

    /** 루트 Pressable style. 최소 터치 타깃은 줄일 수 없다. */
    style?: StyleProp<ViewStyle>;
  };
