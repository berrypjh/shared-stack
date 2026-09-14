import type {
  BadgeIntent,
  BadgePlacement,
  BadgeSemanticProps,
  BadgeSize,
  BadgeVariant,
} from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type { StyleProp, View, ViewProps, ViewStyle } from 'react-native';

export type { BadgeIntent, BadgePlacement, BadgeSize, BadgeVariant };

/** 파일 내부 조립용. 배럴로 내보내지 않는다 — RN 은 `*OwnProps` 를 공개하지 않는 관례다. */
type BadgeOwnProps = {
  /** 앵커. 배지가 얹힐 대상이고 **그대로 렌더된다** — 역할·이름·누름을 건드리지 않는다. */
  children?: ReactNode;

  /** 임의 표시자 내용. 주면 `count`·`max` 를 이긴다. 문자열·숫자는 토큰 타이포로 감싼다. */
  content?: ReactNode;

  /**
   * 표시자의 접근 가능한 이름. **의미 있는 정보의 유일한 통로다.**
   *
   * 주면 표시자가 하나의 접근성 요소로 합쳐져 이 이름만 읽힌다 — 화면의 축약(`99+`)과 낭독
   * 내용이 갈리는 자리다. "구십구 플러스" 는 정보가 아니므로 실제 수를 담은 문장을 소비자가 준다.
   *
   * 주지 않으면 이름을 **지어내지 않는다**: `count` 는 보이는 숫자가 그대로 읽히고,
   * `dot` 은 읽을 것이 없어 트리에서 빠진다(순수 장식).
   *
   * 앵커의 이름을 덮지 않는다 — 루트 `View` 에는 `accessible` 을 걸지 않기 때문이다.
   */
  label?: string;

  /** 호스트 `View`. `ViewProps` 에 `ref` 가 없어 공개 컴포넌트마다 직접 선언한다. */
  ref?: Ref<View>;

  /** 루트(앵커를 감싸는 래퍼)에 적용된다. 표시자 위치는 컴포넌트가 소유한다. */
  style?: StyleProp<ViewStyle>;
};

/**
 * overlay indicator.
 *
 * 시맨틱 어휘(`variant`·`size`·`intent`·`placement`·`count`·`max`·`invisible`)는 ui-core
 * `BadgeSemanticProps` 가, 나머지는 `ViewProps` 에서 온다.
 *
 * `Pressable` 이 아니고 자체 이벤트도 없다 — 누를 수 있는 알림은 앵커를 `Pressable`/
 * `IconButton` 으로 만든다.
 */
export type BadgeProps = BadgeSemanticProps &
  BadgeOwnProps &
  Omit<ViewProps, keyof BadgeOwnProps | keyof BadgeSemanticProps>;
