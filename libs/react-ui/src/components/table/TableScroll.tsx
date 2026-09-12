'use client';

import { cx } from '../../utils';

import { tableClasses } from './Table.constants';
import type { TableScrollProps } from './Table.types';

/**
 * 가로로 넘치는 table 을 담는 스크롤 viewport.
 *
 * **table 시맨틱과 섞지 않는다** — 이것은 뷰포트이고 `Table` 은 데이터다. 그래서 별도
 * 컴포넌트이고, 감싸도 table 의 역할·이름·헤더 관계가 그대로 남는다.
 *
 * 세 속성이 함께 가야 의미가 있다:
 *
 * - `overflow-x: auto` (CSS) — 넘치면 스크롤한다.
 * - `tabIndex={0}` — **키보드로도 스크롤할 수 있어야 한다** (WCAG 2.1.1). 휠·드래그만 되는
 *   영역은 키보드 사용자에게 잘린 열이 도달 불가가 된다. CSS 만으로는 해결할 수 없다.
 * - `role="region"` + 이름 — 포커스를 받는 요소는 이름이 있어야 한다. 그래서 `label` 이 필수다.
 *
 * 소비자가 `aria-label`·`aria-labelledby`·`role` 을 직접 주면 그것이 이긴다.
 */
export const TableScroll = ({ label, className, children, ...rest }: TableScrollProps) => (
  <div
    role="region"
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- 스크롤 영역은 키보드로도 스크롤돼야 한다 (WCAG 2.1.1). role="region" + aria-label 로 이름을 준다
    tabIndex={0}
    aria-label={label}
    {...rest}
    className={cx(tableClasses.scroll, className)}
  >
    {children}
  </div>
);
