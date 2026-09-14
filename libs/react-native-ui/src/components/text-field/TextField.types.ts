import type { InputFieldSemanticProps } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { StyleProp, TextInput, TextInputProps, TextStyle, ViewStyle } from 'react-native';

import type { InputContainerStyle } from '../input-base/InputBase.types';

/**
 * 라벨·입력·헬퍼 합성. 값·포커스·chrome 은 전부 합성 대상이 소유합니다.
 *
 * 접근 가능한 이름을 판별 유니온으로 강제합니다: 문자열 `label`이 곧 이름이고, 노드이거나
 * 없으면 `accessibilityLabel`이 필수입니다. 어느 쪽이든 TextInput 은 이름을 갖습니다.
 * `ReactNode`에서 문자열을 뽑아내거나 placeholder 를 이름으로 쓰지 않습니다.
 *
 * 유니온을 앞에 두고 나머지를 익명으로 이어 붙입니다 — 이름 붙인 base 와 교차시키면
 * `dts-bundle-generator`가 그 base 를 공개 선언으로 끌어올립니다.
 */
export type TextFieldProps = (
  | {
      /** 문자열 라벨이 곧 이름입니다. 다르게 읽히길 원하면 아래를 덮어씁니다. */
      label: string;
      accessibilityLabel?: string;
    }
  | {
      /** 노드 라벨이거나 라벨이 없으면 이름을 직접 줘야 합니다. */
      label?: Exclude<ReactNode, string>;
      accessibilityLabel: string;
    }
) &
  InputFieldSemanticProps &
  Omit<
    TextInputProps,
    'editable' | 'readOnly' | 'multiline' | 'autoFocus' | 'style' | 'accessibilityLabel'
  > & {
    ref?: Ref<TextInput>;

    /** 필드 아래 보조/오류 텍스트. 없으면 `FormHelperText`를 그리지 않습니다. */
    helperText?: ReactNode;

    /** 라벨의 시각적 필수 표시(`*`). 접근성 고지가 아닙니다. */
    required?: boolean;

    /**
     * 포커스 시각 상태를 소비자가 통제합니다 — `FormControl` 로 그대로 넘어갑니다.
     * 주지 않으면 입력이 알린 실제 포커스를 씁니다. `disabled` 가 이것보다 우선입니다.
     */
    focused?: boolean;

    /** `FormControl` 루트 View 의 style. 합성 전체를 감싸는 바깥 상자입니다. */
    rootStyle?: StyleProp<ViewStyle>;

    /** 입력 래퍼(테두리·표면을 그리는 View)의 style. */
    containerStyle?: InputContainerStyle;

    /** TextInput 의 style. 래퍼도 루트도 아닙니다. */
    style?: StyleProp<TextStyle>;
  };
