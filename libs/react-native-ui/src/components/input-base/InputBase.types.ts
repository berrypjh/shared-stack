import type { InputFieldSemanticProps } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { StyleProp, TextInput, TextInputProps, TextStyle, ViewStyle } from 'react-native';

/** containerStyle 콜백이 받는 상태. disabled면 `focused`는 참이 되지 않는다. */
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
 * 시맨틱 어휘는 ui-core `InputFieldSemanticProps`, 나머지는 `TextInputProps`에서 온다.
 *
 * `TextInputProps`에서 제외하는 것: `editable`(disabled·readOnly에서 파생),
 * `readOnly`·`multiline`·`autoFocus`(계약과 겹쳐서 소유자를 계약 쪽으로 통일),
 * `style`(래퍼가 아니라 TextInput을 겨냥), `accessibilityLabel`(필수로 다시 선언).
 */
export type InputBaseProps = InputFieldSemanticProps &
  Omit<
    TextInputProps,
    'editable' | 'readOnly' | 'multiline' | 'autoFocus' | 'style' | 'accessibilityLabel'
  > & {
    ref?: Ref<TextInput>;

    /** 접근 가능한 이름. placeholder도 Android 전용 labelledBy도 대체재가 못 된다. */
    accessibilityLabel: string;

    /**
     * TextInput 앞/뒤 슬롯. 받은 노드를 그대로 렌더한다 — `cloneElement`로 색·크기를 주입하지
     * 않는다 (Button `startIcon`과 같은 규약).
     */
    startAdornment?: ReactNode;
    endAdornment?: ReactNode;

    /**
     * variant 기본 radius를 대신하는 내부 seam이다 — 공개 prop이 아니다.
     *
     * `containerStyle`로는 안 된다: error·disabled일 때 state-critical chrome이 radius까지
     * 다시 얹어 소비자 값을 덮는다. plain은 밑줄이라 무시된다.
     */
    radius?: number;

    /** 래퍼 View의 style. 상태에 따라 달라지면 콜백을 쓴다. */
    containerStyle?: InputContainerStyle;

    /** TextInput의 style. 래퍼가 아니다. */
    style?: StyleProp<TextStyle>;
  };
