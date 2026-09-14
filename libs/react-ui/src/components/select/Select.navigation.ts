/**
 * web 리스트박스의 키보드 이동 규칙 (옵션 인덱스 계산).
 * `<Select>`가 소유하고 `<SearchField>`의 제안 목록도 같은 규칙("비활성 옵션을 건너뛰며 순환한다")을 쓴다.
 * 순수 제네릭이지만 web 리스트박스의 의미론이라 ui-core로 올리지 않는다 — RN 목록에는 하드웨어 키보드 이동이 없다.
 */
type IsOptionDisabled<T> = (option: T) => boolean;
type IsOptionSelected<T> = (option: T) => boolean;

/** 첫 활성 옵션 인덱스, 없으면 -1 */
export const getFirstEnabledIndex = <T>(
  options: readonly T[],
  isDisabled: IsOptionDisabled<T>,
): number => {
  return options.findIndex((option) => !isDisabled(option));
};

/** 마지막 활성 옵션 인덱스, 없으면 -1 */
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

/** 선택된 옵션 인덱스, 없으면 -1 (`getInitialHighlightedIndex` 전용이라 export하지 않는다) */
const getSelectedIndex = <T>(options: readonly T[], isSelected: IsOptionSelected<T>): number => {
  return options.findIndex((option) => isSelected(option));
};

/**
 * 초기 highlighted 인덱스 계산.
 * 선택된 옵션이 있으면 그 인덱스를, 없으면 첫 활성 옵션 인덱스를 쓴다.
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
 * `startIndex` 다음 활성 옵션 인덱스, 없으면 -1.
 * `direction`이 1이면 아래, -1이면 위 방향으로 순환 탐색한다.
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
