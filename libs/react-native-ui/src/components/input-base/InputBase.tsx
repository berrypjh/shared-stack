import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { useTheme } from '../../theme';

import { resolveInputBaseStyles } from './InputBase.styles';
import type { InputBaseProps, InputState } from './InputBase.types';

/**
 * Plain·Filled·Boxed가 공유하는 TextInput 동작 원시. **내부 전용** — 배럴을 만들면 공개
 * API로 승격됩니다 (`components/<name>/index.ts`가 공개 표시입니다).
 *
 * 담당: editable 계산, 접근성 상태, focus 상태 전달, 장식 배치, style 우선순위.
 *
 * style 우선순위 (뒤로 갈수록 우선):
 * - 래퍼: 토큰 배치·chrome → `fullWidth` → `containerStyle` → error·disabled chrome → 터치 타깃
 * - 입력: 토큰 타이포 → `style` → disabled 텍스트 색
 *
 * 뒤 둘은 소비자가 덮을 수 없습니다.
 */
export const InputBase = ({
  variant,
  disabled = false,
  readOnly = false,
  error = false,
  size = 'md',
  color = 'primary',
  fullWidth = false,
  startAdornment,
  endAdornment,
  containerStyle,
  style,
  accessibilityState,
  placeholderTextColor,
  onFocus,
  onBlur,
  ...rest
}: InputBaseProps) => {
  const { tokens } = useTheme();
  const [focusedState, setFocusedState] = useState(false);

  // 파생값입니다. 따로 동기화하면 disabled로 바뀌는 프레임에 focus 표현이 남습니다.
  const focused = focusedState && !disabled;

  const styles = resolveInputBaseStyles({
    tokens,
    variant,
    size,
    color,
    focused,
    error,
    disabled,
  });
  const state: InputState = { focused, disabled, readOnly, error };

  // 이벤트 타입은 prop에서 파생합니다. RN의 onFocus/onBlur는 TextInputFocusEventData가 아니라
  // TargetedEvent 기반이라 손으로 적으면 어긋납니다.
  const handleFocus: NonNullable<InputBaseProps['onFocus']> = (event) => {
    setFocusedState(true);
    onFocus?.(event);
  };

  const handleBlur: NonNullable<InputBaseProps['onBlur']> = (event) => {
    setFocusedState(false);
    onBlur?.(event);
  };

  return (
    <View
      style={[
        styles.container,
        fullWidth ? { alignSelf: 'stretch' } : null,
        typeof containerStyle === 'function' ? containerStyle(state) : containerStyle,
        styles.containerStateCritical,
        { minHeight: styles.container.minHeight },
      ]}
    >
      {startAdornment}
      <TextInput
        {...rest}
        // readOnly는 넘기지 않습니다 — RN이 그것으로 editable을 되계산합니다 (TextInput.js:909).
        editable={!disabled && !readOnly}
        // TextInput은 Pressable과 달리 editable에서 접근성 상태를 파생하지 않습니다. 시맨틱
        // disabled가 최종 진실이라 소비자 값 뒤에 얹습니다.
        accessibilityState={{ ...accessibilityState, disabled }}
        placeholderTextColor={placeholderTextColor ?? styles.placeholderTextColor}
        style={[styles.input, style, styles.inputStateCritical]}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {endAdornment}
    </View>
  );
};
