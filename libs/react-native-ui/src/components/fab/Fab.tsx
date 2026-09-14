import { Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { ButtonBase } from '../button-base/ButtonBase';

import { resolveFabStyles } from './Fab.styles';
import type { FabProps } from './Fab.types';

/**
 * RN Fab.
 *
 * 구조가 두 겹인 이유는 시각 크기와 터치 영역이 다르기 때문입니다. `sm`의 지름은 40이지만
 * 모바일 최소 터치 타깃은 48이라, 루트(`ButtonBase`)가 48 하한을 지키는 상자를 맡고 눈에
 * 보이는 원판·알약은 그 안의 View가 그립니다.
 *
 * pressed 피드백은 elevation으로 줍니다 (`shadow.lg` → `shadow.xl`). Fab은 원래 그림자로
 * 눌림을 표현하는 컴포넌트라, pressed 색 토큰이 없어도 우회가 아닙니다.
 */
export const Fab = ({
  shape = 'circular',
  size = 'lg',
  color = 'primary',
  disabled,
  icon,
  children,
  style,
  ...rest
}: FabProps) => {
  const { tokens } = useTheme();
  // RN은 `disabled?: boolean | null`입니다. `null`을 넘기면 Pressable의 non-null 분기가 풀려
  // 접근성 상태를 소비자가 덮을 수 있게 되므로 boolean으로 확정합니다.
  const isDisabled = disabled === true;

  return (
    <ButtonBase {...rest} disabled={isDisabled} style={style}>
      {({ pressed }) => {
        const s = resolveFabStyles({
          tokens,
          shape,
          size,
          color,
          disabled: isDisabled,
          pressed,
        });

        return (
          <View style={s.surface}>
            {/* 소비자 아이콘은 그대로 렌더합니다. 슬롯은 크기와 정렬만 통제합니다. */}
            {icon == null ? null : <View style={s.icon}>{icon}</View>}
            {shape === 'extended' && children != null ? (
              <Text style={s.label}>{children}</Text>
            ) : null}
          </View>
        );
      }}
    </ButtonBase>
  );
};
