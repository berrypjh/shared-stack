import type { ComponentPropsWithRef } from 'react';

/**
 * 시각에서만 숨기는 래퍼의 prop.
 *
 * 자체 시맨틱 prop 이 **없다** — 하는 일이 하나뿐이고 그것을 켜고 끌 이유가 없다. 나머지는
 * `<span>` 의 DOM prop 이 온다.
 *
 * `component` prop 을 열지 않는다 — Box·Stack·Divider·List 와 같은 이유다. 요소 선택을 열면
 * 소비자가 블록 요소를 골라 버튼·라벨 안에 못 넣는 상태를 만들 수 있다. 숨은 제목처럼 다른
 * 요소가 필요하면 그 요소로 **감싼다**: `<h2><VisuallyHidden>제목</VisuallyHidden></h2>`.
 *
 * `revealOnFocus`·`focusable` 같은 prop 도 두지 않는다. 포커스로 드러나는 우회 링크는
 * `SkipLink` 가 이미 가진 책임이고, 그 동작은 `href`·fragment 이동과 함께 와야 의미가 있다.
 */
export type VisuallyHiddenProps = ComponentPropsWithRef<'span'>;
