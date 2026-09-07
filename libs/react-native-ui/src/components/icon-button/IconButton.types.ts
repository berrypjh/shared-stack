import type { IconButtonSemanticProps } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

/** style 콜백이 받는 상태. disabled·loading 중에는 `pressed`가 참이 되지 않습니다. */
export interface IconButtonState {
  readonly pressed: boolean;
}

export type IconButtonStyle =
  | StyleProp<ViewStyle>
  | ((state: IconButtonState) => StyleProp<ViewStyle>);

/** 아이콘 슬롯이 함수일 때 넘겨받는 해석된 토큰 값. */
export interface IconButtonIconState {
  readonly color: string;
  readonly size: number;
  readonly disabled: boolean;
  readonly pressed: boolean;
}

/**
 * 아이콘 노드, 또는 해석된 토큰을 받는 함수.
 *
 * RN에는 색 상속이 없어 `<View>`에 color를 줘도 자식 아이콘에 내려가지 않고, 소비자 노드를
 * `cloneElement`로 건드리면 없는 아이콘 규약을 지어내야 합니다. 그래서 함수 형태를 열어 둡니다 —
 * disabled 색이 아이콘에 반영되려면 이 통로가 필요합니다.
 */
export type IconButtonIcon = ReactNode | ((state: IconButtonIconState) => ReactNode);

/**
 * `PressableProps`에서 직접 파생합니다 — 내부 `ButtonBaseProps`를 상속하면
 * `dts-bundle-generator`가 그 타입까지 공개 선언으로 끌어올립니다.
 *
 * web `edge`는 의도적으로 없습니다. 컨테이너 가장자리에 아이콘을 광학 정렬하려고 자체 padding을
 * 음수 margin으로 상쇄하는 웹 레이아웃 관용구이고, RN에 대응 개념이 없습니다.
 */
export type IconButtonProps = IconButtonSemanticProps &
  Omit<
    PressableProps,
    'accessibilityRole' | 'accessibilityLabel' | 'aria-disabled' | 'children' | 'disabled' | 'style'
  > & {
    ref?: Ref<View>;
    /** 루트(터치 타깃 상자)에 적용됩니다. */
    style?: IconButtonStyle;

    icon: IconButtonIcon;

    /**
     * 필수다. 보이는 글자가 없는 컨트롤이라 이것이 유일한 접근 가능한 이름이고, 아이콘 글리프
     * 이름에 기대면 스크린리더에서 정체불명이 된다.
     */
    accessibilityLabel: string;

    /**
     * RN 은 평범한 boolean 이다. web 의 `boolean | null` 3-상태는 로딩 래퍼의 자리를 미리
     * 잡아 두려던 DOM 사정이라 옮기지 않는다.
     */
    loading?: boolean;
    loadingIndicator?: ReactNode;

    /** 아이콘 전용 컨트롤이라 보이는 자식을 두지 않습니다. */
    children?: never;
  };
