import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { useTheme } from '../../theme';
import { useFormControl } from '../form-control/useFormControl';

import { resolveInputBaseStyles } from './InputBase.styles';
import type { InputBaseProps, InputState } from './InputBase.types';

/**
 * Plain·Filled·Boxed가 공유하는 TextInput 동작 원시. 내부 전용 — 배럴을 만들면 공개 API로
 * 승격된다.
 *
 * FormControl 안이면 `color`·`size`·`disabled`·`error`·`fullWidth`를 상속하고 focus를
 * 알린다. `readOnly`·`multiline`·`autoFocus`·값·키보드 prop·장식은 상속하지 않는다.
 *
 * style 우선순위 (뒤가 이김):
 * - 래퍼: 토큰 chrome → `fullWidth` → `containerStyle` → error·disabled chrome → 터치 타깃
 * - 입력: 토큰 타이포 → `style` → disabled 텍스트 색
 */
export const InputBase = ({
  variant,
  disabled,
  readOnly = false,
  error,
  size,
  color,
  fullWidth,
  radius,
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
  const formControl = useFormControl();
  const [focusedState, setFocusedState] = useState(false);

  // 기본값을 destructuring이 아니라 여기서 준다 — destructuring 기본값은 prop을 준 것처럼
  // 보여서 FormControl 상속을 가린다.
  const disabledValue = disabled ?? formControl?.disabled ?? false;
  const errorValue = error ?? formControl?.error ?? false;
  const sizeValue = size ?? formControl?.size ?? 'md';
  const colorValue = color ?? formControl?.color ?? 'primary';
  const fullWidthValue = fullWidth ?? formControl?.fullWidth ?? false;

  // focus 권한은 하나다. FormControl 안이면 FormControl, 밖이면 로컬 상태 — 둘을 동기화하지
  // 않는다. disabled가 그보다 우선이다(명시 prop이 context를 이길 때 FormControl은 focused를
  // 참으로 유지할 수 있다).
  const focused = (formControl ? formControl.focused : focusedState) && !disabledValue;

  /**
   * disabled 가 되면 로컬 focus 상태를 버린다.
   *
   * 위 파생은 값을 **가릴 뿐**이라, 가려진 사이 `true` 로 남은 상태가 다시 켤 때 되살아난다 —
   * `editable={false}` 동안 네이티브 포커스는 이미 사라졌는데 테두리만 포커스를 주장한다.
   * FormControl 안에서는 FormControl 이 같은 이유로 자기 상태를 버리고, 이 경로는 그 밖이다.
   *
   * blur 알림이 반드시 온다고 기대하지 않는다 — `editable={false}` 가 네이티브 blur 를
   * 부르는지는 플랫폼 구현에 달렸다. `disabled` 가 참일 때만 정리한다: 마운트 때 비우면
   * `autoFocus` 가 알린 포커스를 지운다.
   */
  useEffect(() => {
    if (disabledValue) setFocusedState(false);
  }, [disabledValue]);

  const styles = resolveInputBaseStyles({
    tokens,
    variant,
    size: sizeValue,
    color: colorValue,
    focused,
    error: errorValue,
    disabled: disabledValue,
    radius,
  });
  const state: InputState = {
    focused,
    disabled: disabledValue,
    readOnly,
    error: errorValue,
  };

  // 이벤트 타입은 prop에서 파생한다. RN의 onFocus/onBlur는 TextInputFocusEventData가 아니라
  // TargetedEvent 기반이라 손으로 적으면 어긋난다.
  const handleFocus: NonNullable<InputBaseProps['onFocus']> = (event) => {
    onFocus?.(event);
    if (formControl) formControl.onInputFocus();
    else setFocusedState(true);
  };

  const handleBlur: NonNullable<InputBaseProps['onBlur']> = (event) => {
    onBlur?.(event);
    if (formControl) formControl.onInputBlur();
    else setFocusedState(false);
  };

  return (
    <View
      style={[
        styles.container,
        fullWidthValue ? { alignSelf: 'stretch' } : null,
        typeof containerStyle === 'function' ? containerStyle(state) : containerStyle,
        styles.containerStateCritical,
        { minHeight: styles.container.minHeight },
      ]}
    >
      {startAdornment}
      <TextInput
        {...rest}
        // readOnly는 넘기지 않는다 — RN이 그것으로 editable을 되계산한다 (TextInput.js:909).
        editable={!disabledValue && !readOnly}
        // TextInput은 Pressable과 달리 editable에서 접근성 상태를 파생하지 않는다. 시맨틱
        // disabled가 최종 진실이라 소비자 값 뒤에 얹는다.
        accessibilityState={{ ...accessibilityState, disabled: disabledValue }}
        placeholderTextColor={placeholderTextColor ?? styles.placeholderTextColor}
        style={[styles.input, style, styles.inputStateCritical]}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {endAdornment}
    </View>
  );
};
