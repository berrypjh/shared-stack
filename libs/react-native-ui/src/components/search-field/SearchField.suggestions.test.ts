/**
 * 제안 순수 함수.
 *
 * `SelectOption` 과 모양이 겹치지만 합치지 않습니다 — Select 는 `value` 가 필수 식별자이고
 * Search 는 선택적 fallback 이라 규칙이 다릅니다.
 */
import { getSuggestionValue, isSuggestionSelected } from './SearchField.suggestions';

describe('getSuggestionValue', () => {
  it('value 가 있으면 value 다', () => {
    expect(getSuggestionValue({ id: 'a', label: '사과', value: 'apple' })).toBe('apple');
  });

  it('value 가 없으면 label 로 되돌아간다 — web 과 같은 시맨틱', () => {
    expect(getSuggestionValue({ id: 'a', label: '사과' })).toBe('사과');
  });

  it('빈 문자열 value 는 의도된 값이라 label 로 넘어가지 않는다', () => {
    expect(getSuggestionValue({ id: 'a', label: '사과', value: '' })).toBe('');
  });
});

describe('isSuggestionSelected', () => {
  it('현재 질의와 값이 같으면 선택이다', () => {
    expect(isSuggestionSelected('apple', { id: 'a', label: '사과', value: 'apple' })).toBe(true);
  });

  it('label fallback 도 같은 규칙으로 비교한다', () => {
    expect(isSuggestionSelected('사과', { id: 'a', label: '사과' })).toBe(true);
  });

  it('다르면 선택이 아니다', () => {
    expect(isSuggestionSelected('배', { id: 'a', label: '사과' })).toBe(false);
  });

  it('빈 질의는 아무것도 선택하지 않는다 — 빈 value 를 가진 제안도 마찬가지다', () => {
    expect(isSuggestionSelected('', { id: 'a', label: '사과' })).toBe(false);
    expect(isSuggestionSelected('', { id: 'b', label: '전체', value: '' })).toBe(false);
  });
});
