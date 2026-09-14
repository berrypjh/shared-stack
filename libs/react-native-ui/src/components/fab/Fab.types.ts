import type { FabSemanticProps } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

export type { FabShape } from '@berrypjh/ui-core';

/** style 콜백이 받는 상태. disabled 중에는 `pressed`가 참이 되지 않습니다. */
export interface FabState {
  readonly pressed: boolean;
}

export type FabStyle = StyleProp<ViewStyle> | ((state: FabState) => StyleProp<ViewStyle>);

/**
 * `PressableProps`에서 직접 파생합니다 — 내부 `ButtonBaseProps`를 상속하면
 * `dts-bundle-generator`가 그 타입까지 공개 선언으로 끌어올립니다.
 *
 * `accessibilityLabel`은 여기서 빼고 shape별로 다시 붙입니다. circular은 필수, extended는
 * 선택이기 때문입니다.
 */
type FabCommonProps = Omit<FabSemanticProps, 'shape'> &
  Omit<
    PressableProps,
    'accessibilityRole' | 'accessibilityLabel' | 'aria-disabled' | 'children' | 'disabled' | 'style'
  > & {
    ref?: Ref<View>;
    /** 루트(터치 타깃 상자)에 적용됩니다 — Fab 배치용입니다. 표면 외형은 토큰이 정합니다. */
    style?: FabStyle;
  };

/**
 * 아이콘만 있는 원형 Fab.
 *
 * 보이는 글자가 없으므로 접근 가능한 이름을 타입에서 요구합니다. 런타임 경고로 미루면
 * 이름 없는 버튼이 그대로 배포됩니다.
 */
export type CircularFabProps = FabCommonProps & {
  shape?: 'circular';
  icon: ReactNode;
  accessibilityLabel: string;
  /** 원형 Fab에는 보이는 라벨을 두지 않습니다. 라벨이 필요하면 `shape="extended"`를 씁니다. */
  children?: never;
};

/** 라벨이 보이는 알약형 Fab. 보이는 글자가 이름이 됩니다. */
export type ExtendedFabProps = FabCommonProps & {
  shape: 'extended';
  children: ReactNode;
  icon?: ReactNode;
  accessibilityLabel?: string;
};

export type FabProps = CircularFabProps | ExtendedFabProps;
