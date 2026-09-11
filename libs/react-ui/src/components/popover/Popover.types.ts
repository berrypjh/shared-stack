import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

/**
 * 팝업 시맨틱. 트리거의 `aria-haspopup` 과 패널의 `role` 이 **여기 한 곳에서** 나온다.
 *
 * 여기 없는 값(`menu`·`listbox`·`tree`·`grid`)은 일부러 뺐다. 그 역할들은 각자 키보드
 * 상호작용을 요구하는데 Popover 는 그것을 구현하지 않는다 — 이름만 붙이면 스크린리더
 * 사용자에게 없는 기능을 약속하는 셈이다.
 */
export type PopoverSemantics =
  /** 일반 비모달 팝업. `aria-expanded` 만으로 표현하고 패널에 role 을 붙이지 않는다. */
  | 'disclosure'
  /** 비모달 dialog. 열릴 때 포커스가 패널로 들어가고 접근 가능한 이름이 필요하다. */
  | 'dialog';

export type PopoverProps = {
  children: ReactNode;
  /** controlled open state */
  open?: boolean;
  /** uncontrolled 초기값 */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * 팝업 시맨틱. 기본 `'disclosure'`.
   *
   * `'dialog'` 로 올리면 `PopoverPanel` 에 `aria-label` 또는 `aria-labelledby` 로
   * 접근 가능한 이름을 반드시 줘야 한다 — 이름 없는 dialog 는 스크린리더에서 정체를 잃는다.
   */
  semantics?: PopoverSemantics;
};

export type PopoverTriggerProps = {
  /** 단일 React element. 클릭 핸들러와 aria 속성이 자동 주입된다. */
  children: ReactElement;
};

export type PopoverPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /**
   * @deprecated `<Popover semantics="dialog">` 를 쓴다.
   *
   * 이 prop 은 패널의 role 만 바꿀 수 있어서 트리거의 `aria-haspopup` 과 어긋날 수 있다.
   * 지정하면 `semantics` 보다 우선한다(하위 호환).
   */
  asDialog?: boolean;
};
