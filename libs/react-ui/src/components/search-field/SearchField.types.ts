import type { FocusEventHandler, ReactNode } from 'react';

import type { FieldVariant } from '../../types';
import type { BoxedInputProps } from '../boxed-input';
import type { FilledInputProps } from '../filled-input';
import type { PlainInputProps } from '../plain-input';

export type SearchFieldSuggestion = {
  id: string;
  label: string;
  value?: string;
  description?: ReactNode;
  disabled?: boolean;
};

export type SearchFieldBaseProps = Omit<
  PlainInputProps,
  'children' | 'startAdornment' | 'endAdornment' | 'type'
>;

/**
 * 지우기 버튼은 **이름을 줘야** 켤 수 있다 — 라이브러리가 언어별 문구를 정하지 않는다.
 * 유니온은 익명으로 둔다: 이름을 붙이면 번들 선언에 공개 타입이 하나 더 생긴다.
 */
export type SearchFieldProps = SearchFieldBaseProps &
  (
    | {
        /** 값이 있고 편집 가능할 때(disabled·readOnly 아님) 지우기 버튼을 그린다. */
        clearable: true;
        /** 지우기 버튼의 접근 가능한 이름. 예: `"검색어 지우기"`. */
        clearAriaLabel: string;
      }
    | {
        clearable?: false;
        clearAriaLabel?: never;
      }
  ) & {
    variant?: FieldVariant;
    /**
     * 이미 걸러진 제안 목록. 주면 입력이 list-autocomplete combobox 가 된다.
     * 주지 않으면 native searchbox 로 남는다. 컴포넌트는 질의로 거르지 않는다.
     */
    suggestions?: SearchFieldSuggestion[];
    /** 제안이 비었을 때의 안내. 선택할 수 없으므로 option 이 아니라 `role="status"` 로 그린다. */
    noSuggestionsText?: ReactNode;
    /**
     * 지우기 요청 뒤에 불린다 — 순서는 `onValueChange('')` → `onClear()`.
     * DOM `onChange` 는 불리지 않는다(합성할 실제 입력 이벤트가 없다).
     */
    onClear?: () => void;
    onValueChange?: (value: string) => void;
    onSuggestionSelect?: (suggestion: SearchFieldSuggestion) => void;
  };

export type SearchFieldInputProps = PlainInputProps | FilledInputProps | BoxedInputProps;

export type SearchFieldInputKeyDownHandler = NonNullable<
  NonNullable<PlainInputProps['inputProps']>['onKeyDown']
>;

export type SearchFieldWrapperBlurHandler = FocusEventHandler<HTMLDivElement>;
