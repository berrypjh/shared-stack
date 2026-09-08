import type { FieldColor, FieldSize, FieldVariant } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { View, ViewProps } from 'react-native';

/**
 * 옵션 하나. 데이터입니다 — web 의 null 렌더 `MenuItem` 마커를 옮기지 않았습니다.
 *
 * 값 도메인은 문자열입니다. web 의 `unknown` + 참조 동일성은 DOM 폼 값에서 온 넓힘이고
 * 실제 소비자는 양쪽 다 문자열만 씁니다.
 */
export interface SelectOption<T extends string> {
  value: T;
  label: ReactNode;

  /** 텍스트가 아닌 label 일 때 접근 가능한 이름. */
  accessibilityLabel?: string;

  disabled?: boolean;
}

/**
 * 단일 선택 Select.
 *
 * `multiple` 은 없습니다 — "고른 뒤 닫지 않는다"는 별개의 개폐 규칙이고 web 구현에도 테스트가
 * 없습니다. `name`·`onChange` 도 없습니다: web 의 `{target:{name,value}}` 합성 이벤트는 HTML
 * 폼 호환용입니다. `displayEmpty` 는 "placeholder 를 주지 않는다"로 표현됩니다.
 */
export type SelectProps<T extends string> = Omit<ViewProps, 'children'> & {
  ref?: Ref<View>;

  /** 필드의 접근 가능한 이름. Input 계열과 같은 계약입니다. */
  accessibilityLabel: string;

  options: readonly SelectOption<T>[];

  /** 선택된 값. 비어 있음은 `undefined` 입니다 (web 의 `''` 은 DOM 폼 잔재입니다). */
  value?: NoInfer<T>;

  /** uncontrolled 초기값. 최초 한 번만 반영됩니다. */
  defaultValue?: NoInfer<T>;

  onValueChange?: (value: T) => void;

  /**
   * 개폐 상태. **선택 값 상태와 독립입니다.**
   * controlled 판정은 `open !== undefined` 입니다(값과 같은 규칙).
   */
  open?: boolean;
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;

  /**
   * 주면 배경이 접근 가능한 해제 버튼이 됩니다.
   *
   * 기본값을 두지 않습니다 — 저장소에 현지화 규약이 없어서 영어 문자열('Close'·'Done')을
   * API 불변식으로 박을 수 없습니다. 이것이 없어도 해제 경로는 있습니다:
   * Android 하드웨어 back(`onRequestClose`), iOS 스크린리더 escape(`onAccessibilityEscape`),
   * 그리고 배경 탭.
   */
  dismissAccessibilityLabel?: string;

  /** 값이 없을 때 보여줄 내용. */
  placeholder?: ReactNode;

  /** 트리거 표시를 통째로 대체합니다. 다른 모든 표시 규칙보다 우선합니다. */
  renderValue?: (value: T | undefined) => ReactNode;

  /** Select 가 가집니다 — FormControl Context 에 넣지 않습니다. */
  variant?: FieldVariant;

  size?: FieldSize;
  color?: FieldColor;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
};
