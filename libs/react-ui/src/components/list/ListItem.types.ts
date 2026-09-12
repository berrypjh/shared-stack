import type { ComponentPropsWithRef, ReactNode } from 'react';

/**
 * `<li>` 의 prop.
 *
 * `onClick`·`selected`·`disabled` 를 두지 않는다. 목록 항목이 눌려야 하면 소비자가 `<a>` 나
 * `<button>` 을 **자식으로** 넣는다 — 그러면 키보드·포커스·disabled 를 브라우저가 이미 옳게
 * 하고, `li` 를 clickable div 로 만드는 흔한 접근성 결함을 처음부터 피한다.
 */
export type ListItemProps = {
  children?: ReactNode;
} & Omit<ComponentPropsWithRef<'li'>, 'children'>;
