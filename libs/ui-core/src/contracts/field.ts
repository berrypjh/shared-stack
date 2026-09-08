/**
 * Field 계열의 시맨틱 계약.
 *
 * 두 렌더러가 같은 불변식을 실제로 구현해서 공유합니다:
 * - `variant`·`size`·`color` — 같은 값 집합을 각각 토큰으로 풉니다
 * - `disabled` — 편집 불가 + 비활성 고지 (web `disabled`, RN `editable=false` + a11y state)
 * - `readOnly` — 편집 불가지만 비활성은 아님
 * - `error` — 시각 상태. 오류 **고지**는 양쪽 다 여기 없습니다
 * - `multiline` — 여러 줄 입력 (web `<textarea>`, RN `multiline`)
 * - `autoFocus` — 마운트 시 포커스
 * - `fullWidth` — 뜻이 같고 수단만 다릅니다 (web `width: 100%`, RN `alignSelf: 'stretch'`)
 *
 * 승격하지 않은 것:
 * - `required` — RN에 폼 검증도 접근성 고지도 없습니다. react-ui가 가집니다
 * - `margin`·`hiddenLabel` — web 폼 밀도/레이블 규약
 * - `value`·`defaultValue` — 도메인이 다릅니다. RN TextInput은 문자열 편집기입니다
 *
 * 렌더러 prop(이벤트·접근성·슬롯·style·키보드)은 각 렌더러의 `*.types.ts`가 덧붙입니다.
 */
export type FieldVariant = 'plain' | 'filled' | 'boxed';
export type FieldSize = 'sm' | 'md';
export type FieldColor = 'primary' | 'secondary';

export interface FieldSemanticProps {
  variant?: FieldVariant;
  size?: FieldSize;
  color?: FieldColor;

  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
}

/** 입력 요소만 가지는 시맨틱. 레이블·헬퍼 텍스트에는 해당하지 않습니다. */
export interface InputFieldSemanticProps extends FieldSemanticProps {
  autoFocus?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
}
