import { getNextEnabledIndex } from '../select/Select.navigation';

import type { SearchFieldInputKeyDownHandler, SearchFieldSuggestion } from './SearchField.types';

/** suggestion의 실제 값, `value`가 없으면 `label`로 대신한다 */
export const getSuggestionValue = (suggestion: SearchFieldSuggestion): string => {
  return suggestion.value ?? suggestion.label;
};

/**
 * 활성 제안 한 칸 이동.
 * disabled 제안은 건너뛰고 끝에서 반대편으로 돈다.
 * 활성 제안이 없으면(-1) 아래 방향은 첫 활성 제안, 위 방향은 마지막 활성 제안이 된다.
 * 전부 disabled면 -1이다.
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
 * SearchField 내부 inputProps 병합.
 * 제안 표면(`suggestions`·`noSuggestionsText`)이 있을 때(`hasPopup`)만 combobox 속성을 건다 — 없으면 `type="search"`의 암묵 역할(searchbox)을 그대로 둔다.
 * `aria-controls`는 listbox가 실제로 그려질 때(`expanded`)만 가리킨다.
 * `activeOptionId`가 없으면 `aria-activedescendant`를 걸지 않는다.
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

/** 입력값 → input 요소용 문자열, 배열·null·undefined는 빈 문자열 */
export const toInputString = (value: unknown): string => {
  if (Array.isArray(value)) {
    return '';
  }

  if (value == null) {
    return '';
  }

  return String(value);
};
