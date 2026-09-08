import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import type { FormControlProps } from './FormControl.types';
import { FormControlContext, type FormControlContextValue } from './FormControlContext';

/**
 * 라벨·입력·헬퍼가 공유할 필드 상태를 자손에게 내려보내는 컨테이너.
 *
 * 포커스는 입력이 `onInputFocus`/`onInputBlur`로 알린다. RN View는 포커스를 버블링하지
 * 않아서 web처럼 루트에서 받아 `relatedTarget`으로 거를 수 없다.
 */
export const FormControl = ({
  color = 'primary',
  size = 'md',
  disabled = false,
  error = false,
  required = false,
  fullWidth = false,
  focused: focusedProp,
  style,
  children,
  ...rest
}: FormControlProps) => {
  const [internalFocused, setInternalFocused] = useState(false);

  // disabled > 소비자 focused > 입력이 알린 상태. 파생값이라 controlled일 때 내부 상태를
  // 따로 동기화하지 않는다.
  const effectiveFocused = disabled ? false : (focusedProp ?? internalFocused);

  const onInputFocus = useCallback(() => setInternalFocused(true), []);
  const onInputBlur = useCallback(() => setInternalFocused(false), []);

  const value = useMemo<FormControlContextValue>(
    () => ({
      color,
      size,
      disabled,
      error,
      required,
      fullWidth,
      focused: effectiveFocused,
      onInputFocus,
      onInputBlur,
    }),
    [
      color,
      size,
      disabled,
      error,
      required,
      fullWidth,
      effectiveFocused,
      onInputFocus,
      onInputBlur,
    ],
  );

  return (
    <FormControlContext.Provider value={value}>
      {/* `accessible`을 켜면 라벨·입력·헬퍼가 하나로 뭉쳐 각각 조작할 수 없게 된다. */}
      <View {...rest} style={[fullWidth ? { alignSelf: 'stretch' } : null, style]}>
        {children}
      </View>
    </FormControlContext.Provider>
  );
};
