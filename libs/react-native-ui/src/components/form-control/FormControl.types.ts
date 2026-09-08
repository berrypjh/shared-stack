import type { FieldColor, FieldSize } from '@berrypjh/ui-core';

import type { Ref } from 'react';
import type { View, ViewProps } from 'react-native';

/**
 * 라벨·입력·헬퍼가 공유할 필드 상태를 자손에게 내려보내는 컨테이너.
 *
 * `component`·`className`·`htmlFor`는 DOM 개념이라 없다. `margin`·`hiddenLabel`은 web 폼
 * 규약이고 RN에서 할 일이 없어 두지 않는다.
 */
export type FormControlProps = ViewProps & {
  ref?: Ref<View>;

  color?: FieldColor;
  size?: FieldSize;
  disabled?: boolean;
  error?: boolean;

  /** 라벨의 필수 표시용. 접근성 고지는 아직 없다. */
  required?: boolean;

  /** 루트를 늘리고 자손에게도 내려보낸다. */
  fullWidth?: boolean;

  /** 포커스를 소비자가 통제한다. `disabled`가 이것보다 우선이다. */
  focused?: boolean;
};
