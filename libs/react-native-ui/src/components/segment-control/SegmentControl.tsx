import { Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { ButtonBase } from '../button-base/ButtonBase';

import {
  resolveSegmentLabelStyle,
  resolveSegmentOptionStyle,
  resolveSegmentRootStyle,
} from './SegmentControl.styles';
import type { SegmentControlProps } from './SegmentControl.types';

/**
 * 상호배타 선택 컨트롤. controlled 전용입니다 — `value` 가 유일한 권한이고 내부 상태가
 * 없어서 누른다고 스스로 바뀌지 않습니다.
 *
 * 시맨틱은 web 의 `<button aria-pressed>` 에 대응합니다: `ButtonBase` +
 * `accessibilityState.selected`. 상호배타라는 이유만으로 radio/tab 으로 바꾸지 않고,
 * `togglebutton`(켜짐/꺼짐 하나)도 N 개 중 하나를 고르는 이 컨트롤과 다릅니다.
 *
 * 루트는 접근성 집합체가 아닙니다 — 켜면 세그먼트를 각각 누를 수 없게 됩니다.
 */
export const SegmentControl = <T extends string>({
  value,
  onChange,
  options,
  style,
  ...rest
}: SegmentControlProps<T>) => {
  const { tokens } = useTheme();

  return (
    <View {...rest} style={[resolveSegmentRootStyle(tokens), style]}>
      {options.map((option) => {
        const selected = option.value === value;
        const disabled = option.disabled ?? false;
        const state = { selected, disabled };

        return (
          <ButtonBase
            key={option.value}
            accessibilityLabel={option.accessibilityLabel}
            accessibilityState={{ selected }}
            disabled={disabled}
            // web `onClick={() => onChange(opt.value)}` 에 가드가 없습니다 — 이미 선택된
            // 옵션을 눌러도 알립니다. 같은 의미를 지킵니다.
            onPress={() => onChange(option.value)}
            style={resolveSegmentOptionStyle(tokens, state)}
          >
            {typeof option.label === 'string' || typeof option.label === 'number' ? (
              <Text style={resolveSegmentLabelStyle(tokens, state)}>{option.label}</Text>
            ) : (
              option.label
            )}
          </ButtonBase>
        );
      })}
    </View>
  );
};
