import type { ElementType, ReactNode } from 'react';

import type { AccessibleNameProps, FabProps as FabSemanticProps, FabShape } from '../../types';
import type { ButtonBaseAutoAnchorProps, ButtonBaseProps } from '../button-base';

export type { FabShape };

/** shape 을 뺀 공통 어휘. shape 은 각 변형이 판별자로 다시 붙인다. */
type FabCommonOwnProps = Omit<FabSemanticProps, 'shape'> & {
  className?: string;
};

/**
 * 아이콘만 있는 원형 Fab.
 *
 * 보이는 글자가 없으므로 접근 가능한 이름을 타입에서 요구한다 — `aria-label` 이든
 * `aria-labelledby` 든 하나는 있어야 한다. 런타임 경고로 미루면 이름 없는 버튼이 그대로 배포된다.
 *
 * `children` 을 막는 것은 원판이 지름 고정이라 보이는 라벨이 밖으로 새거나 잘리기 때문이다.
 * 라벨이 필요하면 `shape="extended"` 를 쓴다. 타입만 막고 런타임 렌더는 그대로 둔다 —
 * JS 소비자의 기존 동작을 조용히 바꾸지 않는다.
 */
export type CircularFabOwnProps = FabCommonOwnProps &
  AccessibleNameProps & {
    shape?: 'circular';
    icon: ReactNode;
    children?: never;
  };

/** 라벨이 보이는 알약형 Fab. 보이는 글자가 이름이 되므로 명시 aria 는 선택이다. */
export type ExtendedFabOwnProps = FabCommonOwnProps & {
  shape: 'extended';
  children: ReactNode;
  icon?: ReactNode;
};

export type FabOwnProps = CircularFabOwnProps | ExtendedFabOwnProps;

/**
 * 상속된 optional `children`·`aria-*` 를 **먼저 지운다.** 남겨 두면 변형이 요구하는 키가
 * optional 선언과 겹쳐 판별이 흐려진다.
 *
 * `variant`·`fullWidth` 도 계속 지운다 — Fab 은 항상 contained 이고 폭은 shape 이 정한다.
 */
type FabHostProps<T> = Omit<
  T,
  'children' | 'size' | 'color' | 'variant' | 'fullWidth' | 'aria-label' | 'aria-labelledby'
>;

export type FabProps<C extends ElementType = 'button'> = FabHostProps<ButtonBaseProps<C>> &
  FabOwnProps;

export type FabAutoAnchorProps = FabHostProps<ButtonBaseAutoAnchorProps> & FabOwnProps;

export type FabRenderableProps = FabAutoAnchorProps | FabProps<ElementType>;
