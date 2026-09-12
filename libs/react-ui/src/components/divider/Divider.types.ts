import type { DividerOrientation, DividerSemanticProps } from '@berrypjh/ui-core';

import type { ComponentPropsWithRef } from 'react';

export type { DividerOrientation };

type HtmlHrProps = ComponentPropsWithRef<'hr'>;

/**
 * 구분선의 prop.
 *
 * 축 어휘(`orientation`)는 ui-core `DividerSemanticProps` 가, 나머지는 `<hr>` 의 DOM prop 이
 * 온다. `decorative` 는 **web 전용**이다 — RN 에는 끌 native separator 시맨틱이 없다.
 *
 * 두께·색 prop 을 열지 않는다. `semanticBorder.divider` 와 `stroke.light` 가 정하고, 예외가
 * 필요하면 `className`·`style` 로 덮는다.
 *
 * `component` prop 을 열지 않는다 — Box·Stack 과 같은 이유다. 요소 선택이 시맨틱을 조용히
 * 무너뜨릴 수 있는데(`<div>` 로 바꾸면 separator 역할이 사라진다) 그것을 막을 가드를 두느니
 * 열지 않는 편이 낫다.
 */
export type DividerProps = DividerSemanticProps &
  Omit<HtmlHrProps, keyof DividerSemanticProps> & {
    /**
     * 시각 장식으로만 쓸 때 `true`.
     *
     * native separator 시맨틱을 `role="presentation"` 으로 끈다. 접근성 트리에 구분자를 하나
     * 더 만들 이유가 없는 경우 — 카드 테두리·행 경계 같은 순수 크롬 — 에 쓴다.
     */
    decorative?: boolean;
  };
