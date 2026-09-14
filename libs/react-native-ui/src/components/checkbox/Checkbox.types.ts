import type { ReactNode, Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

/**
 * 체크박스 하나. 값은 `checked`(boolean)이고 혼합 상태 `indeterminate` 는 그와 **따로** 둔다 —
 * web native 모델과 같다. 둘이 겹치면 `accessibilityState.checked` 는 `'mixed'` 다.
 *
 * - `checked` 를 주면 controlled, 안 주면 `defaultChecked` 로 시작해 컴포넌트가 가진다.
 * - 값 콜백은 `onCheckedChange(next)` 다. prop 이름이 `checked` 라 짝을 맞췄다
 *   (값 prop 이 `value` 인 core `Switch`·`Select` 는 `onValueChange` 를 쓴다).
 * - 누름·역할·상태는 컴포넌트가 소유한다: `onPress`·`role`·`accessibilityRole` 을 받지 않고,
 *   소비자 `accessibilityState` 의 `checked`·`disabled` 는 실제 값으로 덮는다.
 *
 * 접근 가능한 이름은 판별 유니온으로 강제한다. 문자열 `label` 이 곧 이름이고, 노드이거나
 * 없으면 `accessibilityLabel` 이 필수다 (`TextField` 와 같은 규약).
 */
export type CheckboxProps = (
  | {
      /** 문자열 라벨이 곧 이름이다. 다르게 읽히길 원하면 아래를 덮어쓴다. */
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

    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;

    /** 혼합 상태. `checked` 와 무관하게 `'mixed'` 로 알린다. 누르면 `!checked` 를 알린다. */
    indeterminate?: boolean;

    disabled?: boolean;

    /** 시각 상태다. RN 에는 교차 플랫폼 오류 고지 수단이 없다 (Input 계열과 같다). */
    error?: boolean;

    /** 루트 Pressable style. 최소 터치 타깃은 줄일 수 없다. */
    style?: StyleProp<ViewStyle>;
  };
