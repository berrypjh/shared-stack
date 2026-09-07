/**
 * Select 의 키보드 이동 규칙 (옵션 인덱스 계산).
 *
 * `<Select>` 하나만 쓰는 도메인 로직이라 컴포넌트 폴더가 소유한다.
 * 순수 제네릭이지만 "비활성 옵션을 건너뛰며 순환한다"는 것은 web 리스트박스의 의미론이다.
 */
type IsOptionDisabled<T> = (option: T) => boolean;
type IsOptionSelected<T> = (option: T) => boolean;

/**
 * 비활성화되지 않은 첫 번째 옵션의 인덱스를 찾습니다.
 *
 * @param options 옵션 배열
 * @param isDisabled 비활성화 여부 판별 함수
 * @returns 첫 번째 활성 옵션 인덱스, 없으면 -1
 */
export const getFirstEnabledIndex = <T>(
  options: readonly T[],
  isDisabled: IsOptionDisabled<T>,
): number => {
  return options.findIndex((option) => !isDisabled(option));
};

/**
 * 비활성화되지 않은 마지막 옵션의 인덱스를 찾습니다.
 *
 * @param options 옵션 배열
 * @param isDisabled 비활성화 여부 판별 함수
 * @returns 마지막 활성 옵션 인덱스, 없으면 -1
 */
export const getLastEnabledIndex = <T>(
  options: readonly T[],
  isDisabled: IsOptionDisabled<T>,
): number => {
  for (let index = options.length - 1; index >= 0; index -= 1) {
    const option = options[index];

    if (option != null && !isDisabled(option)) {
      return index;
    }
  }

  return -1;
};

/**
 * 현재 선택된 옵션의 인덱스를 찾습니다. `getInitialHighlightedIndex` 전용이라 export 하지 않는다.
 *
 * @param options 옵션 배열
 * @param isSelected 선택 여부 판별 함수
 * @returns 선택된 옵션 인덱스, 없으면 -1
 */
const getSelectedIndex = <T>(options: readonly T[], isSelected: IsOptionSelected<T>): number => {
  return options.findIndex((option) => isSelected(option));
};

/**
 * 초기 highlighted 인덱스를 계산합니다.
 *
 * 선택된 옵션이 있으면 해당 인덱스를 사용하고,
 * 없으면 첫 번째 활성 옵션 인덱스를 사용합니다.
 *
 * @param options 옵션 배열
 * @param isDisabled 비활성화 여부 판별 함수
 * @param isSelected 선택 여부 판별 함수
 * @returns 초기 highlighted 인덱스
 */
export const getInitialHighlightedIndex = <T>(
  options: readonly T[],
  isDisabled: IsOptionDisabled<T>,
  isSelected: IsOptionSelected<T>,
): number => {
  const selectedIndex = getSelectedIndex(options, isSelected);

  if (selectedIndex >= 0) {
    return selectedIndex;
  }

  return getFirstEnabledIndex(options, isDisabled);
};

/**
 * 현재 인덱스를 기준으로 다음 활성 옵션 인덱스를 계산합니다.
 *
 * direction이 1이면 아래 방향, -1이면 위 방향으로 순환 탐색합니다.
 *
 * @param options 옵션 배열
 * @param startIndex 시작 인덱스
 * @param direction 이동 방향
 * @param isDisabled 비활성화 여부 판별 함수
 * @returns 다음 활성 옵션 인덱스, 없으면 -1
 */
export const getNextEnabledIndex = <T>(
  options: readonly T[],
  startIndex: number,
  direction: 1 | -1,
  isDisabled: IsOptionDisabled<T>,
): number => {
  if (!options.length) {
    return -1;
  }

  let index = startIndex;

  for (let step = 0; step < options.length; step += 1) {
    index = (index + direction + options.length) % options.length;

    const option = options[index];

    if (option != null && !isDisabled(option)) {
      return index;
    }
  }

  return -1;
};
