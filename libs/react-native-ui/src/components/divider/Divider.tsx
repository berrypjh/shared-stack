import { View } from 'react-native';

import type { DividerOrientation, DividerSemanticProps } from '@berrypjh/ui-core';

import type { Ref } from 'react';
import type { StyleProp, View as RNView, ViewProps, ViewStyle } from 'react-native';

import { useTheme } from '../../theme';

export type { DividerOrientation };

/**
 * 구분선의 prop.
 *
 * 축 어휘(`orientation`)는 ui-core `DividerSemanticProps` 가, 나머지는 `ViewProps` 에서 온다.
 *
 * **web 의 `decorative` 가 없다.** RN 에는 끌 native separator 시맨틱이 아예 없어서
 * (`accessibilityRole` 유니온에 `separator` 가 없다) 켜고 끌 대상이 없다. 이름을 맞추려고
 * 아무 일도 하지 않는 prop 을 만들지 않는다.
 */
export type DividerProps = DividerSemanticProps &
  Omit<ViewProps, keyof DividerSemanticProps> & {
    /**
     * 호스트 `View`. `ViewProps` 에는 `ref` 필드가 없어서 공개 컴포넌트마다 직접 선언한다
     * (Box·Stack·Button 등과 같은 규약).
     */
    ref?: Ref<RNView>;

    style?: StyleProp<ViewStyle>;
  };

/**
 * 선 하나를 그리는 구분선.
 *
 * 두께와 색은 web 과 **같은 토큰**에서 온다 — `borderWidth.semantic.divider` 와
 * `color.stroke.light`. 두 값 모두 현재 7개 테마 전부에 있다.
 *
 * `backgroundColor` 가 아니라 **border** 로 그린다. web 쪽은 forced-colors 때문에 그래야
 * 하고, RN 은 그 제약이 없지만 두 렌더러가 같은 방식으로 그리는 편이 낫다 — 높이 0 짜리
 * View 에 배경을 칠하는 것보다 의도가 드러난다.
 *
 * `borderWidth` 만 주면 RN 기본값 때문에 테두리가 **검정**이 된다. 그래서 색을 항상 함께 준다.
 *
 * 세로선은 `alignSelf: 'stretch'` 로 형제 높이만큼 늘어난다 — 높이를 추측하지 않는다.
 *
 * **주변 여백을 갖지 않는다.** 구분선 위아래 간격은 `Stack` 의 `gap` 이 가진다.
 *
 * `Pressable` 이 아니라 `View` 다. 비상호작용이고 접근성 역할도 지어내지 않는다 — 내용이
 * 없는 View 는 스크린리더가 읽을 것이 없어 그대로 지나간다.
 *
 * `StyleSheet.create` 를 쓰지 않는다 — 색이 테마에 따라 달라져 정적 시트로 묶을 것이 없다
 * (Box·Stack 과 같은 판단).
 */
export const Divider = ({ orientation = 'horizontal', style, ...rest }: DividerProps) => {
  const { tokens } = useTheme();

  const width = tokens.borderWidth.semantic.divider;
  const color = tokens.color.stroke.light;

  const computed: ViewStyle =
    orientation === 'vertical'
      ? { alignSelf: 'stretch', borderLeftWidth: width, borderLeftColor: color }
      : { borderTopWidth: width, borderTopColor: color };

  return <View {...rest} style={[computed, style]} />;
};
