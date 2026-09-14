import type { ButtonSemanticProps } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

/** style 콜백이 받는 상태. disabled·loading 중에는 `pressed` 가 참이 되지 않는다. */
export interface ButtonState {
  readonly pressed: boolean;
}

export type ButtonStyle = StyleProp<ViewStyle> | ((state: ButtonState) => StyleProp<ViewStyle>);

/**
 * 시맨틱 어휘(`variant`·`size`·`color`·`disabled`·`fullWidth`·`loading`·`loadingPosition`)는
 * ui-core의 `ButtonSemanticProps`가 가집니다. 렌더러 prop은 `PressableProps`에서 직접
 * 파생합니다 — 내부 `ButtonBaseProps`를 상속하면 `dts-bundle-generator`가 그 타입까지
 * 공개 선언으로 끌어올립니다. 두 목록이 어긋나지 않는지는 타입 테스트가 지킵니다.
 */
export type ButtonProps = ButtonSemanticProps &
  Omit<
    PressableProps,
    'accessibilityRole' | 'aria-disabled' | 'children' | 'disabled' | 'style'
  > & {
    ref?: Ref<View>;
    style?: ButtonStyle;

    /**
     * 라벨. 항상 RN `<Text>` 안에서 렌더된다 — RN 은 View 바로 아래 문자열을 허용하지 않는다.
     * 그래서 이 슬롯의 계약은 "텍스트"다: 문자열·숫자·중첩 `<Text>` 를 넣는다. 아이콘처럼
     * 텍스트가 아닌 노드는 `startIcon`/`endIcon` 슬롯을 쓴다.
     */
    children?: ReactNode;

    /**
     * 라벨 앞/뒤 슬롯. 받은 노드를 **그대로** 렌더한다 — `cloneElement` 로 크기·색을 주입하지
     * 않는다. 이 저장소에는 RN 아이콘 규약이 없어서 주입할 prop 이름을 지어내야 하기 때문이다.
     * 레이아웃(정렬·간격)만 Button 이 통제한다.
     */
    startIcon?: ReactNode;
    endIcon?: ReactNode;

    /** 없으면 라벨색을 쓰는 `ActivityIndicator`를 씁니다. */
    loadingIndicator?: ReactNode;
  };
