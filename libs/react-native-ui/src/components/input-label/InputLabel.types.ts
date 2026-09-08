import type { FieldColor, FieldSize } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { Text, TextProps } from 'react-native';

/**
 * 필드 위 정적 라벨. 뜨거나 줄어들지 않는다 — web InputLabel도 그렇다.
 *
 * `htmlFor`는 없다. RN에 교차 플랫폼 라벨 연결 수단이 없어서
 * (`accessibilityLabelledBy`는 Android 전용) 연결을 흉내 내는 prop을 두지 않는다.
 * `filled`·`adornedStart`·`variant`도 web InputLabel이 소비하지 않아 없다.
 */
export type InputLabelProps = Omit<TextProps, 'children'> & {
  ref?: Ref<Text>;
  children?: ReactNode;

  color?: FieldColor;
  size?: FieldSize;
  disabled?: boolean;
  error?: boolean;
  focused?: boolean;

  /** 시각적 필수 표시(`*`)만 그린다. 접근성 고지는 아직 없다. */
  required?: boolean;
};
