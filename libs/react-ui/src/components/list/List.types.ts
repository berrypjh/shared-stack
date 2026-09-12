import type { ComponentPropsWithRef, ReactNode } from 'react';

/**
 * semantic HTML helper 의 prop.
 *
 * `component` prop 을 열지 않는다. 요소 선택이 **두 가지 시맨틱 중 하나**(`<ul>`/`<ol>`)라
 * boolean 하나로 충분하고, 임의 polymorphism 을 열면 소비자가 `<div>` 로 바꿔 목록 시맨틱을
 * 조용히 무너뜨릴 수 있다 — 그 회귀를 막을 가드가 아예 필요 없게 만드는 편이 낫다.
 *
 * 여백 prop 도 두지 않는다. `Box` 의 spacing 어휘를 반쯤 복제하는 대신 SCSS 의
 * `--ui-list-gap` 을 `className`·`style` 로 덮는다.
 */
export type ListProps = {
  /** `true` 면 `<ol>`, 기본은 `<ul>`. 순서가 의미를 갖는 목록에만 켠다. */
  ordered?: boolean;

  /**
   * native 목록 마커(•, 1.)를 보인다. 기본값은 `false` — UI 목록은 대개 마커가 없다.
   *
   * **시각 결정과 시맨틱 결정을 분리한다**: 마커를 끄는 것은 시각이고, 목록이라는 사실은
   * 그대로 남아야 한다. 그 보장은 `List.tsx` 의 `role` 처리가 한다.
   */
  marker?: boolean;

  children?: ReactNode;
} & Omit<ComponentPropsWithRef<'ul'>, 'children' | 'type'>;
