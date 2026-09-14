import { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import {
  resolveSelectionLabelStyle,
  resolveSelectionRootStyle,
  resolveSelectionTouchTarget,
} from '../selection-control/selectionControl.styles';

import { resolveRadioCircleStyle, resolveRadioDotStyle } from './Radio.styles';
import type { RadioProps } from './Radio.types';
import { RadioGroupContext } from './RadioGroupContext';

/**
 * 그룹 안의 선택지. Pressable host 에 `radio` 역할과 `accessibilityState.checked` 를 단다.
 *
 * `ButtonBase` 를 쓰지 않는다 — 역할을 `button` 으로 고정한다. 최소 터치 타깃 정책
 * (`spacing.4xl`, 소비자 style 뒤)은 같다. 시각 원과 누를 수 있는 영역은 따로다.
 */
export const Radio = ({
  label,
  value,
  disabled,
  accessibilityState,
  style,
  ...rest
}: RadioProps) => {
  const { tokens } = useTheme();
  const group = useContext(RadioGroupContext);

  if (!group) throw new Error('Radio must be used within <RadioGroup>.');

  const checked = group.value === value;
  const disabledValue = (disabled ?? false) || group.disabled;

  // 토글이 아니라 선택이다 — 이미 선택된 것을 누르면 아무 일도 없다 (web native 와 같다).
  const handlePress = () => {
    if (!checked) group.select(value);
  };

  return (
    <Pressable
      {...rest}
      accessibilityRole="radio"
      accessibilityState={{ ...accessibilityState, checked, disabled: disabledValue }}
      // 항상 boolean 으로 넘긴다 — Pressable 은 non-null 일 때만 disabled 상태를 실제 값으로 덮는다.
      disabled={disabledValue}
      onPress={handlePress}
      style={[resolveSelectionRootStyle(tokens), style, resolveSelectionTouchTarget(tokens)]}
    >
      <View
        style={resolveRadioCircleStyle(tokens, {
          filled: checked,
          disabled: disabledValue,
          error: group.error,
        })}
      >
        {checked ? <View style={resolveRadioDotStyle(tokens)} /> : null}
      </View>
      {typeof label === 'string' || typeof label === 'number' ? (
        <Text style={resolveSelectionLabelStyle(tokens, disabledValue)}>{label}</Text>
      ) : (
        label
      )}
    </Pressable>
  );
};
