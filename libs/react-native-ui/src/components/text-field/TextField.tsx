import type { ReactNode } from 'react';

import { BoxedInput } from '../boxed-input/BoxedInput';
import { FilledInput } from '../filled-input/FilledInput';
import { FormControl } from '../form-control/FormControl';
import { FormHelperText } from '../form-helper-text/FormHelperText';
import { InputLabel } from '../input-label/InputLabel';
import { PlainInput } from '../plain-input/PlainInput';

import type { TextFieldProps } from './TextField.types';

const inputForVariant = {
  plain: PlainInput,
  filled: FilledInput,
  boxed: BoxedInput,
} as const;

/** 빈 노드는 그리지 않습니다 — web `hasTextFieldContent` 와 같은 규칙입니다. */
const hasContent = (node: ReactNode): boolean => node != null && node !== '';

/**
 * 라벨·입력·헬퍼를 세우는 합성 계층. 값도 포커스도 chrome 도 소유하지 않습니다.
 *
 * 시맨틱은 `FormControl` 하나에만 넘기고 자식은 Context 로 상속합니다 — 같은 값을 자식마다
 * 다시 넘기면 우선순위 규칙이 두 벌이 됩니다.
 *
 * helper 는 보이는 텍스트까지만 보장합니다. `aria-describedby` 에 해당하는 교차 플랫폼 수단이
 * 없어서 입력의 설명으로 연결되지 않고, `accessibilityHint`(동작의 결과)로 옮기지도 않습니다.
 *
 * `select` prop 이 없습니다 — web 의 select 모드는 `<option>` children 과 `htmlFor` 연결 위에
 * 서 있고, RN Select 는 값 도메인·콜백·ref 대상이 달라 한 타입으로 묶으면 모호해집니다.
 */
export const TextField = ({
  label,
  helperText,
  accessibilityLabel,
  variant = 'boxed',
  color,
  size,
  disabled,
  error,
  required,
  fullWidth,
  focused,
  rootStyle,
  ...rest
}: TextFieldProps) => {
  const Input = inputForVariant[variant];

  // 문자열 라벨이면 그것이 이름이고, 아니면 타입이 명시 이름을 이미 강제했습니다.
  const spokenName = accessibilityLabel ?? (typeof label === 'string' ? label : '');

  return (
    <FormControl
      color={color}
      size={size}
      disabled={disabled}
      error={error}
      required={required}
      fullWidth={fullWidth}
      focused={focused}
      style={rootStyle}
    >
      {hasContent(label) ? <InputLabel>{label}</InputLabel> : null}

      {/* 시맨틱은 Context 로 상속합니다. `variant` 만 FormControl 밖이라 컴포넌트 선택입니다. */}
      <Input {...rest} accessibilityLabel={spokenName} />

      {hasContent(helperText) ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
};
