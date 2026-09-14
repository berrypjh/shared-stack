import { View } from 'react-native';

import type {
  RNTokens,
  StackAlign,
  StackDirection,
  StackJustify,
  StackSemanticProps,
} from '@berrypjh/ui-core';

import type { Ref } from 'react';
import type { StyleProp, View as RNView, ViewProps, ViewStyle } from 'react-native';

import { useTheme } from '../../theme';

export type { StackAlign, StackDirection, StackJustify };

/**
 * 계약 어휘를 native 값으로 푼다.
 *
 * `satisfies` 라서 계약에 값이 늘면 **여기서 컴파일이 깨진다** — 그게 의도다. 빠진 값은
 * `undefined` 로 조용히 흘러가 레이아웃이 말없이 틀어진다.
 */
const ALIGN_ITEMS = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
} as const satisfies Record<StackAlign, ViewStyle['alignItems']>;

const JUSTIFY_CONTENT = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
} as const satisfies Record<StackJustify, ViewStyle['justifyContent']>;

/**
 * 토큰 이름이면 현재 테마에서 해석하고, 숫자면 원시 길이로 그대로 쓴다.
 *
 * Box 의 `spacingToNumber` 와 같은 규칙이지만 그쪽은 모듈 내부 const 라 가져올 수 없다.
 * 다섯 줄을 공유하려고 Box 의 표면을 넓히지 않는다 — ui-core 에 올릴 것도 아니다. RN 의
 * "숫자 = density-independent pixel" 은 **렌더러 해석**이고, 계약은 값 도메인만 가진다.
 */
const gapToNumber = (tokens: RNTokens, value: StackSemanticProps['gap']): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  return tokens.spacing[value];
};

/**
 * 1차원 레이아웃 primitive.
 *
 * 시맨틱 어휘(`direction`·`gap`·`align`·`justify`·`wrap`)는 ui-core `StackSemanticProps` 가,
 * 나머지는 `ViewProps` 에서 온다.
 *
 * `Pressable` 이 아니라 `View` 다. 상호작용 prop 도, 최소 터치 타깃도 없다 — 누를 수 있는
 * 레이아웃은 소비자가 자식을 `ButtonBase`/`Pressable` 로 만든다.
 *
 * **Box 와 합성 관계다.** 면·여백·모서리는 Box 가 가지므로 여기서 복제하지 않는다:
 * `<Box p="lg" bg="background.surface"><Stack gap="md">…</Stack></Box>`.
 *
 * web 의 `display: flex` 를 옮기지 않는다 — RN View 는 이미 flex 컨테이너다. 반면
 * `flexDirection` 은 native 기본값과 같더라도 **항상 내보낸다**: 계약이 정한 기본값
 * (`column`)을 관측 가능하게 만들고, web 렌더러(CSS 기본값이 `row` 라 명시가 강제된다)와
 * 계산 결과를 같게 하기 위해서다.
 *
 * 나머지 축은 주지 않으면 선언을 만들지 않는다 — Box 의 "미지정은 미적용" 과 같은 규칙이고,
 * `gap={0}` · `wrap={false}` 는 미지정이 아니라 명시한 값이다.
 *
 * 소비자 `style` 이 계산된 레이아웃보다 **뒤에 온다**. 그래야 escape hatch 가 성립한다.
 *
 * `StyleSheet.create` 를 쓰지 않는다 — 조합이 prop 마다 달라 정적 시트로 묶을 것이 없다
 * (Box 와 같은 판단).
 */
export type StackProps = StackSemanticProps &
  Omit<ViewProps, keyof StackSemanticProps> & {
    /**
     * 호스트 `View`. `ViewProps` 에는 `ref` 필드가 없어서 공개 컴포넌트마다 직접 선언한다
     * (Box·Button·Select 등과 같은 규약).
     */
    ref?: Ref<RNView>;

    style?: StyleProp<ViewStyle>;
  };

export const Stack = ({
  direction = 'column',
  gap,
  align,
  justify,
  wrap,
  style,
  ...rest
}: StackProps) => {
  const theme = useTheme();

  const computed: ViewStyle = { flexDirection: direction };

  const gapValue = gapToNumber(theme.tokens, gap);

  if (gapValue !== undefined) computed.gap = gapValue;
  if (align !== undefined) computed.alignItems = ALIGN_ITEMS[align];
  if (justify !== undefined) computed.justifyContent = JUSTIFY_CONTENT[justify];
  if (wrap !== undefined) computed.flexWrap = wrap ? 'wrap' : 'nowrap';

  return <View {...rest} style={[computed, style]} />;
};
