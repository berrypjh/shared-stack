import type { ReactNode, Ref } from 'react';
import type { View, ViewProps } from 'react-native';

/**
 * 단일 선택 그룹. 선택 값을 그룹이 가진다 — RN 에는 native radio 그룹핑이 없다.
 *
 * - `value` 를 주면 controlled(`value !== undefined`), 안 주면 `defaultValue` 로 시작해 그룹이
 *   가진다. 콜백은 `onValueChange(next)` 다 (`Select` 와 같은 이름).
 * - 그룹 이름은 판별 유니온으로 강제한다: 문자열 `label` 이 곧 이름이고, 노드이거나 없으면
 *   `accessibilityLabel` 이 필수다. 컨테이너는 접근성 요소가 아니라서 자식 radio 는 각각 조작된다.
 */
export type RadioGroupProps = (
  | {
      /** 문자열 라벨이 보이고 그룹 이름이 된다. */
      label: string;
      accessibilityLabel?: string;
    }
  | {
      /** 노드 라벨이거나 라벨이 없으면 이름을 직접 줘야 한다. */
      label?: Exclude<ReactNode, string>;
      accessibilityLabel: string;
    }
) &
  Omit<ViewProps, 'accessibilityLabel' | 'accessibilityRole' | 'role' | 'children'> & {
    ref?: Ref<View>;

    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;

    /** 모든 선택지를 막는다. */
    disabled?: boolean;

    /** 시각 상태다. RN 에는 교차 플랫폼 오류 고지 수단이 없다 (Input 계열과 같다). */
    error?: boolean;

    children?: ReactNode;
  };
