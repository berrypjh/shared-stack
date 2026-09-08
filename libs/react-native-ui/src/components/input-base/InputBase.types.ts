import type { InputFieldSemanticProps } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { StyleProp, TextInput, TextInputProps, TextStyle, ViewStyle } from 'react-native';

/** containerStyle 콜백이 받는 상태. disabled면 `focused`는 참이 되지 않습니다. */
export interface InputState {
  readonly focused: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly error: boolean;
}

export type InputContainerStyle =
  | StyleProp<ViewStyle>
  | ((state: InputState) => StyleProp<ViewStyle>);

/**
 * 시맨틱 어휘는 ui-core `InputFieldSemanticProps`, 나머지는 `TextInputProps`에서 옵니다.
 *
 * `TextInputProps`에서 제외하는 것:
 * - `editable`: `disabled`·`readOnly`에서 파생합니다. 소비자가 주면 접근성 상태와 어긋납니다.
 * - `readOnly`·`multiline`·`autoFocus`: 계약과 겹치는 실제 충돌. 타입은 같지만 소유자를
 *   하나로 두려고 계약 쪽을 남깁니다. `readOnly`는 TextInput에 전달도 하지 않습니다 —
 *   RN이 그것으로 `editable`을 되계산합니다. 키보드·IME·선택 prop은 그대로 살립니다.
 * - `style`: 래퍼가 아니라 TextInput을 겨냥한다는 것을 드러내려고 다시 선언합니다.
 * - `accessibilityLabel`: 선택이 아니라 필수입니다.
 */
export type InputBaseProps = InputFieldSemanticProps &
  Omit<
    TextInputProps,
    'editable' | 'readOnly' | 'multiline' | 'autoFocus' | 'style' | 'accessibilityLabel'
  > & {
    ref?: Ref<TextInput>;

    /**
     * 접근 가능한 이름. placeholder는 이름이 되지 못하고 `accessibilityLabelledBy`는
     * Android 전용이라, 이것이 유일한 교차 플랫폼 수단입니다.
     */
    accessibilityLabel: string;

    /**
     * TextInput 앞/뒤 슬롯. 받은 노드를 그대로 렌더합니다 — `cloneElement`로 색·크기를 주입하지
     * 않습니다 (Button `startIcon`과 같은 규약). 배치만 통제하고, 상호작용 노드는 독립적으로
     * 접근 가능한 상태로 남습니다.
     */
    startAdornment?: ReactNode;
    endAdornment?: ReactNode;

    /** 래퍼 View의 style. 상태에 따라 달라지면 콜백을 씁니다. */
    containerStyle?: InputContainerStyle;

    /** TextInput의 style. 래퍼가 아닙니다. */
    style?: StyleProp<TextStyle>;
  };
