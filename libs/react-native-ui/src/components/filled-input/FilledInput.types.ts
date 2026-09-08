import type { InputFieldSemanticProps } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { StyleProp, TextInput, TextInputProps, TextStyle } from 'react-native';

import type { InputContainerStyle } from '../input-base/InputBase.types';

/**
 * 채워진 표면과 사방 테두리를 가지는 필드. `variant`는 컴포넌트가 고정하므로 prop에 없습니다.
 *
 * `InputBaseProps`를 재사용하지 않고 `TextInputProps`에서 다시 파생합니다 — 재사용하면
 * `dts-bundle-generator`가 내부 타입을 공개 선언으로 끌어올립니다. 두 목록의 드리프트는
 * 테스트의 타입 가드가 막습니다.
 */
export type FilledInputProps = Omit<InputFieldSemanticProps, 'variant'> &
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

    /** TextInput 앞/뒤 슬롯. 받은 노드를 그대로 렌더합니다. */
    startAdornment?: ReactNode;
    endAdornment?: ReactNode;

    /** 래퍼 View의 style. 상태에 따라 달라지면 콜백을 씁니다. */
    containerStyle?: InputContainerStyle;

    /** TextInput의 style. 래퍼가 아닙니다. */
    style?: StyleProp<TextStyle>;
  };
