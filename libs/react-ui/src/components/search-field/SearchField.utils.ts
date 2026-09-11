import { getNextEnabledIndex } from '../select/Select.navigation';

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
 * 활성 제안을 한 칸 옮긴다. disabled 제안은 건너뛰고 끝에서 반대편으로 돈다.
 *
 * 활성 제안이 없으면(-1) 아래 방향은 첫 활성 제안, 위 방향은 마지막 활성 제안이 된다.
 * 전부 disabled 면 -1 이다.
 */
export const moveActiveIndex = (
  suggestions: readonly SearchFieldSuggestion[],
  activeIndex: number,
  direction: 1 | -1,
): number => {
  const start = activeIndex >= 0 ? activeIndex : direction === 1 ? -1 : suggestions.length;

  return getNextEnabledIndex(suggestions, start, direction, (suggestion) =>
    Boolean(suggestion.disabled),
  );
};

/**
 * SearchField 내부 inputProps를 병합합니다.
 *
 * 제안 표면(`suggestions`·`noSuggestionsText`)이 있을 때만 combobox 속성을 겁니다 — 없으면
 * `type="search"` 의 암묵 역할(searchbox)을 그대로 둡니다. `aria-controls` 는 listbox 가
 * 실제로 그려질 때만 가리킵니다.
 *
 * @param params 병합에 필요한 값 묶음
 * @param params.activeOptionId 활성 option 의 id. 없으면 `aria-activedescendant` 를 걸지 않는다
 * @param params.expanded listbox 가 그려져 있는지
 * @param params.hasPopup 제안 표면이 설정되어 있는지
 * @param params.inputProps 기존 inputProps
 * @param params.listboxId suggestion 목록 요소 id
 * @param params.onKeyDown 병합할 keyDown 핸들러
 * @returns 병합된 inputProps 객체
 */
export const getMergedInputProps = ({
  activeOptionId,
  expanded,
  hasPopup,
  inputProps,
  listboxId,
  onKeyDown,
}: {
  activeOptionId?: string;
  expanded: boolean;
  hasPopup: boolean;
  inputProps?: Record<string, unknown>;
  listboxId: string;
  onKeyDown: SearchFieldInputKeyDownHandler;
}) => {
  return {
    ...inputProps,
    ...(hasPopup
      ? {
          role: 'combobox' as const,
          'aria-expanded': expanded,
          'aria-controls': expanded ? listboxId : undefined,
          'aria-autocomplete': 'list' as const,
          'aria-activedescendant': activeOptionId,
        }
      : {}),
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
