import type { AvatarSemanticProps, AvatarShape, AvatarSize } from '@berrypjh/ui-core';

import type { ComponentPropsWithRef, ReactEventHandler, ReactNode } from 'react';

export type { AvatarShape, AvatarSize };

type HtmlSpanProps = ComponentPropsWithRef<'span'>;

export type AvatarOwnProps = {
  /** 이미지 URL. 없거나 로드에 실패하면 `children` 이 대신 그려진다. */
  src?: string;

  /**
   * 접근 가능한 이름. DOM `alt` 와 같은 3-상태다.
   *
   * - 값이 있으면 이름이 된다. 이미지가 있으면 `<img alt>`, fallback 이면 루트가
   *   `role="img"` + `aria-label` 을 갖고 시각 글자는 트리에서 감춘다(중복 낭독 방지).
   * - `''` 는 **명시적 장식**이다. 이름을 만들지 않고 fallback 글자도 감춘다.
   * - 주지 않으면 이미지는 장식(`alt=""`)이 되고 fallback 글자는 그대로 읽힌다.
   *   이름을 지어내지 않는다 — 필요하면 소비자가 준다.
   */
  alt?: string;

  /** 이미지 로드 실패 시 그릴 것. 보통 이니셜이나 아이콘. */
  children?: ReactNode;

  /**
   * 이미지 로드 실패 알림. **`<img>` 의 이벤트다** — 루트 `<span>` 에는 의미 있는 error
   * 이벤트가 없어서 여기로 보낸다.
   *
   * Avatar 는 이 이벤트를 fallback 전환에 쓰지만 삼키지는 않는다. 소비자가 로깅하거나
   * 다른 URL 로 교체할 수 있도록 그대로 전달한다.
   */
  onError?: ReactEventHandler<HTMLImageElement>;
};

/**
 * 정적 identity visual.
 *
 * 시맨틱 어휘(`size`·`shape`)는 ui-core `AvatarSemanticProps` 가, 나머지는 `<span>` 의
 * DOM prop 이 온다. `component` prop 은 열지 않는다 — 루트를 바꾸면 `<img>`·`role="img"` 로
 * 세운 시맨틱이 무너진다 (`Box` 와 같은 이유로 polymorphic 이 아니다).
 *
 * 상호작용 prop 은 없다. 누를 수 있는 identity 컨트롤은 `ButtonBase`/`IconButton` 으로 감싼다.
 */
export type AvatarProps = AvatarSemanticProps &
  AvatarOwnProps &
  Omit<HtmlSpanProps, keyof AvatarOwnProps | keyof AvatarSemanticProps>;
