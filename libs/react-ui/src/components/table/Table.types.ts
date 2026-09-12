import type { ComponentPropsWithRef, ReactNode } from 'react';

export type TableProps = {
  /**
   * `<caption>` 을 **시각만** 숨긴다. DOM 에서 제거하지 않으므로 table 의 접근 가능한 이름은
   * 남는다 — 제거하면 이름이 사라진다.
   *
   * `form-control` 의 `hiddenLabel` 과 같은 정본 패턴을 쓴다.
   */
  hiddenCaption?: boolean;

  /** `<caption>`·`<thead>`·`<tbody>`·`<tfoot>` — native 요소를 직접 쓴다. */
  children?: ReactNode;
} & Omit<ComponentPropsWithRef<'table'>, 'children'>;

export type TableScrollProps = {
  /**
   * 스크롤 영역의 접근 가능한 이름. **필수다.**
   *
   * 이 영역은 키보드로 스크롤할 수 있어야 해서(WCAG 2.1.1) 포커스를 받고, 포커스 가능한
   * region 은 이름이 있어야 한다 — 없으면 스크린리더에서 정체불명의 랜드마크가 된다.
   */
  label: string;

  children?: ReactNode;
} & Omit<ComponentPropsWithRef<'div'>, 'children'>;
