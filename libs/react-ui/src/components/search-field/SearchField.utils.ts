import type { SearchFieldInputKeyDownHandler, SearchFieldSuggestion } from './SearchField.types';

/**
 * suggestion에서 실제로 사용할 값을 반환합니다.
 *
 * suggestion.value가 있으면 그 값을 사용하고,
 * 없으면 suggestion.label을 fallback 값으로 사용합니다.
 *
 * @param suggestion 선택 대상 suggestion
 * @returns suggestion의 실제 값
 */
export const getSuggestionValue = (suggestion: SearchFieldSuggestion): string => {
  return suggestion.value ?? suggestion.label;
};

/**
 * 현재 입력값과 suggestion의 값을 비교해 선택 상태인지 판별합니다.
 *
 * @param params 비교에 필요한 값 묶음
 * @param params.currentValue 현재 입력값
 * @param params.suggestion 비교할 suggestion
 * @returns suggestion 선택 여부
 */
export const isSuggestionSelected = ({
  currentValue,
  suggestion,
}: {
  currentValue: string;
  suggestion: SearchFieldSuggestion;
}) => {
  return currentValue === getSuggestionValue(suggestion);
};

/**
 * SearchField 내부 inputProps를 병합해 combobox 접근성 속성과
 * 기본 검색 입력 속성을 함께 구성합니다.
 *
 * @param params 병합에 필요한 값 묶음
 * @param params.expanded suggestion 목록 열림 여부
 * @param params.inputProps 기존 inputProps
 * @param params.listboxId suggestion 목록 요소 id
 * @param params.onKeyDown 병합할 keyDown 핸들러
 * @param params.showEmptyState suggestion이 없을 때 empty 상태 표시 여부
 * @returns 병합된 inputProps 객체
 */
export const getMergedInputProps = ({
  expanded,
  inputProps,
  listboxId,
  onKeyDown,
  showEmptyState,
}: {
  expanded: boolean;
  inputProps?: Record<string, unknown>;
  listboxId: string;
  onKeyDown: SearchFieldInputKeyDownHandler;
  showEmptyState: boolean;
}) => {
  return {
    ...inputProps,
    role: 'combobox' as const,
    'aria-expanded': expanded,
    'aria-controls': expanded || showEmptyState ? listboxId : undefined,
    'aria-autocomplete': 'list' as const,
    enterKeyHint:
      (inputProps?.enterKeyHint as
        | React.HTMLAttributes<HTMLInputElement>['enterKeyHint']
        | undefined) ?? 'search',
    inputMode:
      (inputProps?.inputMode as React.HTMLAttributes<HTMLInputElement>['inputMode'] | undefined) ??
      'search',
    onKeyDown,
  };
};

/**
 * 입력값을 input 요소에서 사용할 문자열로 변환합니다.
 *
 * 배열 값은 빈 문자열로 변환하고,
 * null 또는 undefined도 빈 문자열로 변환합니다.
 *
 * @param value 변환할 원본 값
 * @returns input 요소에 넣을 문자열 값
 */
export const toInputString = (value: unknown): string => {
  if (Array.isArray(value)) {
    return '';
  }

  if (value == null) {
    return '';
  }

  return String(value);
};
