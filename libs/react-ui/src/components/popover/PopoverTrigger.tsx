'use client';

import {
  cloneElement,
  isValidElement,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type Ref,
} from 'react';

import { assignRef } from '../../utils';

import type { PopoverTriggerProps } from './Popover.types';
import { usePopoverContext } from './PopoverContext';

type TriggerChildProps = {
  id?: string;
  ref?: Ref<HTMLElement>;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  'aria-haspopup'?: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | true | false;
};

export const PopoverTrigger = ({ children }: PopoverTriggerProps) => {
  const { open, setOpen, semantics, triggerRef, panelId, triggerId } =
    usePopoverContext('PopoverTrigger');

  if (!isValidElement(children)) {
    throw new Error('PopoverTrigger requires a single React element child');
  }

  const child = children as ReactElement<TriggerChildProps>;
  const childProps = child.props;
  const childRef = childProps.ref;

  return cloneElement(child, {
    id: childProps.id ?? triggerId,
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      assignRef(childRef, node);
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      childProps.onClick?.(event);
      if (!event.defaultPrevented) setOpen(!open);
    },
    // 트리거에 포커스가 있을 때의 Escape. 중첩이면 안쪽 트리거가 바깥 패널 **안**에 있으므로
    // 여기서 전파를 끊어야 바깥까지 함께 닫히지 않는다.
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      childProps.onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== 'Escape' || !open) return;
      event.stopPropagation();
      setOpen(false);
    },
    'aria-expanded': open,
    'aria-controls': open ? panelId : undefined,
    // disclosure 는 `aria-haspopup` 을 붙이지 않는다 — ARIA 에서 `true` 는 menu 와 같은
    // 뜻이라 일반 팝업에 쓰면 없는 메뉴를 약속하게 된다.
    'aria-haspopup': childProps['aria-haspopup'] ?? (semantics === 'dialog' ? 'dialog' : undefined),
  } as Partial<TriggerChildProps> & Record<string, unknown>);
};

PopoverTrigger.displayName = 'PopoverTrigger';
