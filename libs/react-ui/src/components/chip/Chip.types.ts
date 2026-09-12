import type { ChipSemanticProps, ChipSize, ChipVariant } from '@berrypjh/ui-core';

import type { ComponentPropsWithRef, MouseEventHandler, ReactNode } from 'react';

export type { ChipSize, ChipVariant };

/** 두 모드가 함께 갖는 것. 어휘는 ui-core, 슬롯은 web 이 소유한다. */
type ChipSharedProps = Omit<ChipSemanticProps, 'selected' | 'disabled'> & {
  /** 라벨. Chip 의 접근 가능한 이름이 된다. */
  children?: ReactNode;

  /**
   * 라벨 앞 슬롯. 아이콘이나 `Avatar` 를 넣는다.
   *
   * `Avatar` 에 강결합하지 않는다 — 그냥 노드다. 상호작용 요소를 넣으면 interactive 모드에서
   * button 안 button 이 되므로 넣지 않는다.
   */
  leading?: ReactNode;
};

/**
 * Chip 의 prop. **두 모드의 판별 유니온**이다.
 *
 * - `onClick` 이 없으면 **passive**: `<span>` 으로 렌더되고 `selected`·`disabled` 를 받지 않는다.
 * - `onClick` 을 주면 **interactive**: native `<button type="button">` 이 되고 `selected`·
 *   `disabled` 가 열린다.
 *
 * `selected?: never` 로 막는 것이 핵심이다 — 누를 수 없는 것에 선택 시각만 주면 시맨틱 없는
 * 상태가 되고, 타입이 그것을 컴파일 타임에 거부한다.
 *
 * 보조 타입을 이름 붙여 교차시키지 않는다 — `dts-bundle-generator` 가 그 이름을 공개 선언으로
 * 끌어올린다 (`Checkbox.types.ts`·`TextField` 모드 분기와 같은 이유).
 */
export type ChipProps =
  | (ChipSharedProps & {
      onClick?: never;
      selected?: never;
      disabled?: never;
    } & Omit<ComponentPropsWithRef<'span'>, 'children' | 'onClick' | keyof ChipSharedProps>)
  | (ChipSharedProps & {
      /** 있으면 interactive 모드가 된다. */
      onClick: MouseEventHandler<HTMLButtonElement>;

      /** toggle 선택 상태. 주면 `aria-pressed` 가 붙고, 주지 않으면 단순 action chip 이다. */
      selected?: boolean;

      /** native `disabled`. 클릭·키보드·탭 순서를 브라우저가 차단한다. */
      disabled?: boolean;
    } & Omit<
        ComponentPropsWithRef<'button'>,
        'children' | 'onClick' | 'type' | 'disabled' | keyof ChipSharedProps
      >);
