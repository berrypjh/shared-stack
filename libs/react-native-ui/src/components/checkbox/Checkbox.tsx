import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { useFormControl } from '../form-control/useFormControl';
import {
  resolveSelectionLabelStyle,
  resolveSelectionRootStyle,
  resolveSelectionTouchTarget,
} from '../selection-control/selectionControl.styles';

import {
  resolveCheckboxBoxStyle,
  resolveCheckmarkStyle,
  resolveDashStyle,
} from './Checkbox.styles';
import type { CheckboxProps } from './Checkbox.types';

/**
 * 체크박스. Pressable host 에 `checkbox` 역할과 `accessibilityState.checked` 를 단다.
 *
 * `ButtonBase` 를 쓰지 않는다 — 역할을 `button` 으로 고정한다. 최소 터치 타깃 정책
 * (`spacing.4xl`, 소비자 style 뒤)은 같다. 시각 상자와 누를 수 있는 영역은 따로다.
 *
 * FormControl 에서는 `disabled`·`error` 만 상속한다. `required`·`size`·`color` 는 받지 않는다.
 */
export const Checkbox = ({
  label,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  indeterminate = false,
  disabled,
  error,
  accessibilityState,
  style,
  ...rest
}: CheckboxProps) => {
  const { tokens } = useTheme();
  const formControl = useFormControl();

  // 기본값은 context 해석 뒤에 둔다 — destructuring 기본값은 상속을 가린다.
  const disabledValue = disabled ?? formControl?.disabled ?? false;
  const errorValue = error ?? formControl?.error ?? false;

  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const checked = checkedProp ?? uncontrolledChecked;

  const handlePress = () => {
    const next = !checked;
    if (checkedProp === undefined) setUncontrolledChecked(next);
    onCheckedChange?.(next);
  };

  const boxState = { filled: checked || indeterminate, disabled: disabledValue, error: errorValue };

  return (
    <Pressable
      {...rest}
      accessibilityRole="checkbox"
      accessibilityState={{
        ...accessibilityState,
        checked: indeterminate ? 'mixed' : checked,
        disabled: disabledValue,
      }}
      // 항상 boolean 으로 넘긴다 — Pressable 은 non-null 일 때만 disabled 상태를 실제 값으로 덮는다.
      disabled={disabledValue}
      onPress={handlePress}
      style={[resolveSelectionRootStyle(tokens), style, resolveSelectionTouchTarget(tokens)]}
    >
      <View style={resolveCheckboxBoxStyle(tokens, boxState)}>
        {indeterminate ? (
          <View style={resolveDashStyle(tokens)} />
        ) : checked ? (
          <View style={resolveCheckmarkStyle(tokens)} />
        ) : null}
      </View>
      {typeof label === 'string' || typeof label === 'number' ? (
        <Text style={resolveSelectionLabelStyle(tokens, disabledValue)}>{label}</Text>
      ) : (
        label
      )}
    </Pressable>
  );
};
