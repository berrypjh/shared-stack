/**
 * Select의 값 비교·표시 규칙.
 * `<Select>` 하나만 쓰는 도메인 로직이라 컴포넌트 폴더가 소유한다.
 * 순수 함수지만 "옵션 값이 현재 선택과 같은가"는 Select의 의미론이지 플랫폼 공유 계약이 아니다.
 */

/**
 * 참조 비교 대상인지, 즉 원시값이 아닌지 판별.
 * 배열·`Date`·`Map`·클래스 인스턴스가 모두 `true`다.
 * 이름이 약속하는 것은 딱 그것뿐이다.
 * 예전 `isObjectRecord`는 `value is Record<string, unknown>`을 주장했지만 실제로는 모든 object 형에 `true`를 돌려줘 이름과 런타임이 어긋나 있었다.
 */
const isReferenceValue = (value: unknown): boolean => typeof value === 'object' && value !== null;

/** 값 → 비교·data attribute용 문자열, 배열은 항목을 쉼표로 연결 (`[1, 'a']` → `'1,a'`) */
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

/** 현재 값이 화면에 표시할 수 있는 값인지 판별, multiple 모드는 비어 있지 않은 배열만 */
export const hasDisplayValue = (value: unknown, multiple: boolean): boolean => {
  if (multiple) {
    return Array.isArray(value) && value.length > 0;
  }

  return value !== '' && value != null;
};

/**
 * 두 값의 선택 동등 비교.
 * 한쪽이라도 객체면 참조 동일성으로, 원시값끼리는 문자열로 정규화해서 비교한다.
 */
export const isValueEqual = (optionValue: unknown, currentValue: unknown): boolean => {
  if (isReferenceValue(optionValue) || isReferenceValue(currentValue)) {
    return optionValue === currentValue;
  }

  return stringifyValue(optionValue) === stringifyValue(currentValue);
};

/** 옵션이 현재 선택 상태인지 판별, multiple 모드는 배열 포함 여부로 본다 */
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
