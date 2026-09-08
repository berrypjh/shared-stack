import type { SearchFieldSuggestion } from './SearchField.types';

/**
 * 제안이 실제로 넣을 질의 값.
 *
 * `??` 라서 빈 문자열 `value` 는 의도된 값으로 존중되고 label 로 넘어가지 않습니다.
 */
export const getSuggestionValue = (suggestion: SearchFieldSuggestion): string =>
  suggestion.value ?? suggestion.label;

/** 선택 상태는 저장하지 않고 현재 질의에서 파생합니다 — 두 번째 진실을 만들지 않습니다. */
export const isSuggestionSelected = (query: string, suggestion: SearchFieldSuggestion): boolean =>
  query !== '' && getSuggestionValue(suggestion) === query;
