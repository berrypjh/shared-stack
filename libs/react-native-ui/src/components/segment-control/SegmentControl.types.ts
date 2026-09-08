import type { ReactNode, Ref } from 'react';
import type { View, ViewProps } from 'react-native';

/** 하나의 세그먼트. 값 도메인은 web 과 같은 문자열이고 per-option `className` 은 없습니다. */
export type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;

  /** 텍스트가 아닌 라벨(아이콘 등)일 때의 이름. 문자열 라벨이면 그 텍스트가 이름이 됩니다. */
  accessibilityLabel?: string;

  disabled?: boolean;
};

/**
 * 상호배타 선택 컨트롤. controlled 전용입니다.
 *
 * `defaultValue`·`size`·`fullWidth`·루트 `disabled` 는 web 에도 없어서 두지 않았습니다.
 */
export type SegmentControlProps<T extends string> = Omit<ViewProps, 'children'> & {
  ref?: Ref<View>;

  options: readonly SegmentOption<T>[];

  /**
   * 선택 상태의 유일한 권한.
   *
   * `NoInfer` 로 `T` 가 `options` 에서만 추론되게 합니다 — 그러지 않으면 목록에 없는 값을 줘도
   * `T` 가 넓어질 뿐 오류가 나지 않습니다.
   */
  value: NoInfer<T>;
  onChange: (value: T) => void;
};
