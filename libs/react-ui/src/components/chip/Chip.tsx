'use client';

import type { ChipSize, ChipVariant } from '@berrypjh/ui-core';

import type { MouseEventHandler, ReactNode } from 'react';

import { cx } from '../../utils';

import { chipClasses } from './Chip.constants';
import type { ChipProps } from './Chip.types';

const SIZE_CLASS = {
  sm: chipClasses.sizeSm,
  md: chipClasses.sizeMd,
} as const;

const VARIANT_CLASS = {
  outlined: chipClasses.variantOutlined,
  filled: chipClasses.variantFilled,
} as const;

/**
 * 판별 유니온을 런타임에서 한 번만 평평하게 펴는 내부 타입.
 *
 * **`ChipProps` 가 이 타입을 참조하지 않는다** — 그래서 `dts-bundle-generator` 가 공개 선언으로
 * 끌어올리지 않는다 (`TextFieldInputModeProps` 가 새지 않아야 하는 것과 같은 이유).
 */
type ChipRuntimeProps = {
  children?: ReactNode;
  leading?: ReactNode;
  size?: ChipSize;
  variant?: ChipVariant;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  selected?: boolean;
  disabled?: boolean;
} & Record<string, unknown>;

/**
 * compact label. 두 모드만 있다.
 *
 * - **passive** (`onClick` 없음) — `<span>`. 포커스 대상이 아니고 상태가 없다.
 * - **interactive** (`onClick` 있음) — native `<button type="button">`. `selected` 를 함께 주면
 *   `aria-pressed` toggle 이 된다.
 *
 * **native button 을 재구현하지 않는다.** `div role="button"` 은 Enter/Space 활성화, `disabled`
 * 의 클릭·키보드·탭 순서 차단, 폼 밖 동작을 전부 손으로 다시 만들어야 하고 그중 하나라도
 * 빠지면 조용히 접근성이 깨진다. 브라우저가 이미 옳게 하는 일이다.
 *
 * `selected` 를 주지 않으면 `aria-pressed` 를 **달지 않는다** — 없는 토글 시맨틱을 지어내면
 * 스크린리더가 "누름 안 됨" 을 읽어 상태가 있다고 오해하게 만든다.
 *
 * `leading` 슬롯은 `aria-hidden` 이다. interactive 모드에서 접근 가능한 이름은 **내용에서
 * 계산되므로**, 글리프 문자("◆")가 트리에 남으면 이름이 "◆ 필터" 로 오염된다. 라벨이 이름이다.
 *
 * menu item·listbox option·checkbox 역할로 자동 전환하지 않는다 — 그 셋은 다른 ARIA 계약과
 * 키보드 모델을 요구하고 이미 `Select`·`Checkbox` 가 소유한다.
 *
 * remove/delete 는 DEFER 다. chip 안에 두 번째 button 을 넣으면 중첩 상호작용이 되고, 그것을
 * 피하는 유일한 구조(별도 toolbar/grid 키보드 모델)는 실제 소비자 요구가 확인된 뒤에 설계한다.
 *
 * `displayName` 을 두지 않는다 — 최상위 속성 할당은 tree-shaking 을 막는다
 * (`.size-limit.cjs` 머리말, Avatar·Badge·Checkbox 와 같은 관례).
 */
export const Chip = (props: ChipProps) => {
  const {
    children,
    leading,
    size = 'md',
    variant = 'outlined',
    className,
    onClick,
    selected,
    disabled,
    ...domProps
  } = props as ChipRuntimeProps;

  const interactive = onClick != null;

  const rootClassName = cx(
    chipClasses.root,
    SIZE_CLASS[size],
    VARIANT_CLASS[variant],
    interactive && chipClasses.interactive,
    selected && chipClasses.selected,
    className,
  );

  const content = (
    <>
      {leading == null ? null : (
        <span className={chipClasses.leading} aria-hidden="true">
          {leading}
        </span>
      )}
      <span className={chipClasses.label}>{children}</span>
    </>
  );

  if (!interactive) {
    return (
      <span {...domProps} className={rootClassName}>
        {content}
      </span>
    );
  }

  return (
    <button
      {...domProps}
      type="button"
      className={rootClassName}
      onClick={onClick}
      disabled={disabled}
      // toggle 일 때만 단다. `selected` 가 undefined 면 단순 action chip 이다.
      aria-pressed={selected == null ? undefined : selected}
    >
      {content}
    </button>
  );
};
