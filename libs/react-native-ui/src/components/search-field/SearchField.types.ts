import type { InputFieldSemanticProps } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { StyleProp, TextInput, TextInputProps, TextStyle } from 'react-native';

import type { InputContainerStyle } from '../input-base/InputBase.types';

/**
 * 검색 입력 필드.
 *
 * `InputBaseProps`를 재사용하지 않고 `TextInputProps`에서 다시 파생합니다 — 재사용하면
 * `dts-bundle-generator`가 내부 타입을 공개 선언으로 끌어올립니다 (Input 계열과 같은 규약).
 *
 * 장식 슬롯이 없습니다: 뒤 슬롯은 지우기 버튼이 쓰고, 앞 슬롯은 RN 코어에 아이콘 원시가
 * 없어 보류합니다.
 */
/**
 * 제안 하나. 소비자가 이미 좁혀 놓은 후보입니다.
 *
 * `label` 은 값 fallback 과 접근 가능한 이름 양쪽에 쓰이므로 안정적인 문자열이어야 합니다.
 */
export interface SearchFieldSuggestion {
  id: string;
  label: string;
  /** 없으면 `label` 이 질의 값이 됩니다. 빈 문자열은 의도된 값으로 존중됩니다. */
  value?: string;
  description?: ReactNode;
  disabled?: boolean;
}

export type SearchFieldProps = InputFieldSemanticProps &
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
     * 지우기 버튼의 접근 가능한 이름이자 버튼 자체의 유일한 관문 — 주지 않으면 렌더되지
     * 않습니다. web 의 `clearable: boolean` 은 이름 없는 버튼을 만들 수 있어 옮기지 않았습니다.
     */
    clearAccessibilityLabel?: string;

    /** 지우기 직후 알림. 값 반영은 `onChangeText('')`가 이미 했습니다. */
    onClear?: () => void;

    /** 지금 보여줄 후보. 컴포넌트는 거르지 않고 받은 순서 그대로 그립니다. */
    suggestions?: SearchFieldSuggestion[];

    /** 후보가 없을 때 보여줄 내용. 주지 않으면 빈 상자를 그리지 않습니다. */
    noSuggestionsText?: ReactNode;

    /** 활성 제안을 눌렀을 때. 질의 반영은 `onChangeText`가 이미 했습니다. */
    onSuggestionSelect?: (suggestion: SearchFieldSuggestion) => void;

    /** 래퍼 View의 style. 상태에 따라 달라지면 콜백을 씁니다. */
    containerStyle?: InputContainerStyle;

    /** TextInput의 style. 래퍼가 아닙니다. */
    style?: StyleProp<TextStyle>;
  };
