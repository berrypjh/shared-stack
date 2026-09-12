'use client';

import { cx } from '../../utils';

import { tableClasses } from './Table.constants';
import type { TableProps } from './Table.types';

/**
 * native HTML table 을 감싸는 **최소 wrapper**.
 *
 * `<caption>`·`<thead>`·`<tbody>`·`<tfoot>`·`<tr>`·`<th>`·`<td>` 는 소비자가 직접 쓴다.
 * `TableRow`·`TableCell` 같은 wrapper 를 만들지 않는 이유는 취향이 아니다 — HTML 은 `<table>` 과
 * `<tr>` 사이에 다른 요소를 허용하지 않으므로 그 wrapper 들은 **시맨틱을 더하지 못하고** 공개
 * 심볼·카탈로그·번들만 늘린다.
 *
 * `role="grid"` 를 붙이지 않는다. grid 는 셀 간 키보드 내비게이션을 약속하는 역할이고, 그것을
 * 구현하지 않은 채 붙이면 스크린리더 사용자에게 없는 조작을 약속하는 셈이다. 단순 data table 은
 * 브라우저가 이미 옳게 읽는다.
 *
 * **정렬 상태를 갖지 않는다.** 정렬은 합성이다 — `<th aria-sort>` 가 "정렬된 열" 이라는 사실을,
 * 그 안의 `<button>` 이 활성화를 맡는다. 시각 방향 표시는 `aria-sort` 속성 선택자가 정하므로
 * **접근성 상태와 시각이 갈라질 수 없다**. 정렬 로직·상태·데이터는 소비자 것이다.
 *
 * 가로 넘침은 `TableScroll` 이 따로 맡는다 — 스크롤 viewport 와 table 시맨틱을 섞지 않는다.
 *
 * `displayName` 을 두지 않는다 — 최상위 속성 할당은 tree-shaking 을 막는다
 * (`.size-limit.cjs` 머리말, Avatar·Badge·Chip·List 와 같은 관례).
 */
export const Table = ({ hiddenCaption = false, className, children, ...rest }: TableProps) => (
  <table
    {...rest}
    className={cx(tableClasses.root, hiddenCaption && tableClasses.hiddenCaption, className)}
  >
    {children}
  </table>
);
