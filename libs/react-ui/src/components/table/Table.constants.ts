export const tableClasses = {
  root: 'ui-table',
  hiddenCaption: 'ui-table--hidden-caption',
  scroll: 'ui-table-scroll',
  /**
   * 정렬 컨트롤에 소비자가 직접 붙이는 클래스. 컴포넌트가 아니다 — `<button>` 은 소비자가
   * 소유하고(타입·핸들러·이름) 시각만 여기서 온다. 방향 표시는 조상 `<th aria-sort>` 가 정한다.
   */
  sortButton: 'ui-table__sort-button',
} as const;
