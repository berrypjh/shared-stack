'use client';

import { cx } from '../../utils';

import { listClasses } from './List.constants';
import type { ListItemProps } from './ListItem.types';

/**
 * `<li>`.
 *
 * 의도적으로 얇다. `onClick`·`selected`·`disabled` 를 두지 않는다 — 목록 항목이 눌려야 하면
 * 소비자가 `<a>` 나 `<button>` 을 **자식으로** 넣는다. `li` 를 clickable div 로 만드는 것은
 * 키보드·포커스·역할을 손으로 다시 만들어야 하는 흔한 접근성 결함이고, 그럴 이유가 없다.
 *
 * `role` 도 붙이지 않는다. native `<li>` 가 부모 목록 안에서 이미 `listitem` 이다.
 *
 * `ListItemButton`·`ListItemText`·`ListItemIcon` 을 만들지 않는다 — MUI API parity 는 근거가
 * 아니다. 실제 중복이 입증되면 그때 추가한다.
 */
export const ListItem = ({ className, children, ...rest }: ListItemProps) => (
  <li {...rest} className={cx(listClasses.item, className)}>
    {children}
  </li>
);
