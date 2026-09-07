/**
 * Select 의 값 비교·표시 규칙.
 *
 * `<Select>` 하나만 쓰는 도메인 로직이라 컴포넌트 폴더가 소유한다.
 * 순수 함수지만 "옵션 값이 현재 선택과 같은가"는 Select 의 의미론이지 플랫폼 공유 계약이 아니다.
 */

/**
 * 참조 비교 대상인지 — 즉 원시값이 아닌지 판별한다.
 *
 * 배열·`Date`·`Map`·클래스 인스턴스가 모두 `true` 다. 이름이 약속하는 것은 딱 그것뿐이다.
 * (예전 `isObjectRecord` 는 `value is Record<string, unknown>` 을 주장했지만 실제로는
 * 모든 object 형에 `true` 를 돌려줘 이름과 런타임이 어긋나 있었다.)
 */
const isReferenceValue = (value: unknown): boolean => typeof value === 'object' && value !== null;

/**
 * 값을 비교 및 data attribute 용 문자열로 정규화합니다.
 *
 * 배열은 각 항목을 문자열로 변환한 뒤 쉼표로 연결합니다.
 *
 * @param value 문자열로 변환할 값
 * @returns 정규화된 문자열 값
 */
export const stringifyValue = (value: unknown): string => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => stringifyValue(item)).join(',');
  }

  return String(value);
};

/**
 * 현재 값이 화면에 표시할 수 있는 값인지 판별합니다.
 *
 * multiple 모드에서는 비어 있지 않은 배열만 표시 가능한 값으로 봅니다.
 *
 * @param value 현재 값
 * @param multiple 다중 선택 여부
 * @returns 표시 가능한 값 여부
 */
export const hasDisplayValue = (value: unknown, multiple: boolean): boolean => {
  if (multiple) {
    return Array.isArray(value) && value.length > 0;
  }

  return value !== '' && value != null;
};

/**
 * 두 값을 선택 비교용 기준으로 비교합니다.
 *
 * 한쪽이라도 객체면 참조 동일성으로 비교하고,
 * 원시값끼리는 문자열로 정규화해서 비교합니다.
 *
 * @param optionValue 옵션 값
 * @param currentValue 현재 선택 값
 * @returns 두 값의 선택 동등 여부
 */
export const isValueEqual = (optionValue: unknown, currentValue: unknown): boolean => {
  if (isReferenceValue(optionValue) || isReferenceValue(currentValue)) {
    return optionValue === currentValue;
  }

  return stringifyValue(optionValue) === stringifyValue(currentValue);
};

/**
 * 특정 옵션이 현재 선택 상태인지 판별합니다.
 *
 * multiple 모드에서는 배열 내 포함 여부를 확인하고,
 * 단일 선택 모드에서는 단일 값과 비교합니다.
 *
 * @param optionValue 옵션 값
 * @param currentValue 현재 선택 값
 * @param multiple 다중 선택 여부
 * @returns 선택 여부
 */
export const isOptionSelected = (
  optionValue: unknown,
  currentValue: unknown,
  multiple: boolean,
): boolean => {
  if (multiple) {
    if (!Array.isArray(currentValue)) {
      return false;
    }

    return currentValue.some((item) => isValueEqual(optionValue, item));
  }

  return isValueEqual(optionValue, currentValue);
};
