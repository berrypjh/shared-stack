import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { useFormControl } from '../form-control/useFormControl';

import { resolveRadioGroupLabelStyle, resolveRadioGroupStyle } from './Radio.styles';
import type { RadioGroupProps } from './RadioGroup.types';
import { RadioGroupContext } from './RadioGroupContext';

/**
 * 단일 선택 그룹. `radiogroup` 역할 컨테이너이고 선택 값을 컴포넌트 로컬 상태로 가진다.
 *
 * 하드웨어 키보드 이동(방향키)은 없다 — SearchField·Select 와 같은 범위다. 선택은 누름과
 * 스크린리더 활성화로 하고, 각 radio 가 `accessibilityState.checked` 로 알린다.
 *
 * FormControl 에서 `disabled`·`error` 를 상속한다.
 */
export const RadioGroup = ({
  label,
  accessibilityLabel,
  value: valueProp,
  defaultValue,
  onValueChange,
  disabled,
  error,
  style,
  children,
  ...rest
}: RadioGroupProps) => {
  const { tokens } = useTheme();
  const formControl = useFormControl();

  // 기본값은 context 해석 뒤에 둔다 — destructuring 기본값은 상속을 가린다.
  const disabledValue = disabled ?? formControl?.disabled ?? false;
  const errorValue = error ?? formControl?.error ?? false;

  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : uncontrolledValue;

  const context = useMemo(
    () => ({
      value,
      disabled: disabledValue,
      error: errorValue,
      select: (next: string) => {
        if (valueProp === undefined) setUncontrolledValue(next);
        onValueChange?.(next);
      },
    }),
    [value, disabledValue, errorValue, valueProp, onValueChange],
  );

  return (
    <View
      {...rest}
      // `accessible` 을 켜지 않는다 — 켜면 자식 radio 를 하나로 삼켜 각각 누를 수 없다.
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel ?? (typeof label === 'string' ? label : undefined)}
      style={[resolveRadioGroupStyle(), style]}
    >
      {typeof label === 'string' || typeof label === 'number' ? (
        <Text style={resolveRadioGroupLabelStyle(tokens, disabledValue)}>{label}</Text>
      ) : (
        label
      )}
      <RadioGroupContext.Provider value={context}>{children}</RadioGroupContext.Provider>
    </View>
  );
};
