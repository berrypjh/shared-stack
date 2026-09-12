import type {
  BadgeIntent,
  BadgePlacement,
  BadgeSemanticProps,
  BadgeSize,
  BadgeVariant,
} from '@berrypjh/ui-core';

import type { ComponentPropsWithRef, ReactNode } from 'react';

export type { BadgeIntent, BadgePlacement, BadgeSize, BadgeVariant };

type HtmlSpanProps = ComponentPropsWithRef<'span'>;

export type BadgeOwnProps = {
  /** 앵커. 배지가 얹힐 대상이고 **그대로 렌더된다** — role·이름·이벤트를 건드리지 않는다. */
  children?: ReactNode;

  /** 임의 표시자 내용. 주면 `count`·`max` 를 이긴다 (`max` 는 숫자 규칙이다). */
  content?: ReactNode;

  /**
   * 표시자의 접근 가능한 이름. **의미 있는 정보의 유일한 통로다.**
   *
   * 주면 표시자가 `role="img"` + `aria-label` 을 갖고 시각 글자는 `aria-hidden` 이 된다 —
   * 화면의 축약(`99+`)과 낭독 내용이 갈리는 자리다. "구십구 플러스" 는 정보가 아니므로
   * 실제 수를 담은 문장을 소비자가 준다.
   *
   * 주지 않으면 이름을 **지어내지 않는다**: `count` 는 보이는 글자가 그대로 읽히고,
   * `dot` 은 읽을 것이 없어 트리에서 감춰진다(순수 장식).
   *
   * 앵커의 이름을 덮지 않는다. 앵커 자체의 이름에 개수를 넣고 싶으면 앵커의
   * `aria-label` 을 소비자가 직접 쓴다.
   */
  label?: string;
};

/**
 * overlay indicator.
 *
 * 시맨틱 어휘(`variant`·`size`·`intent`·`placement`·`count`·`max`·`invisible`)는 ui-core
 * `BadgeSemanticProps` 가, 나머지는 `<span>` 의 DOM prop 이 온다.
 *
 * 자체 이벤트를 제공하지 않는다 — 누를 수 있는 알림은 앵커를 `ButtonBase`/`IconButton` 으로
 * 만든다. `component` prop 도 열지 않는다.
 */
export type BadgeProps = BadgeSemanticProps &
  BadgeOwnProps &
  Omit<HtmlSpanProps, keyof BadgeOwnProps | keyof BadgeSemanticProps>;
