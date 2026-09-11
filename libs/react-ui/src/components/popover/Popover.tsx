'use client';

import { useCallback, useId, useMemo, useRef, useState } from 'react';

import type { PopoverProps } from './Popover.types';
import { PopoverContext } from './PopoverContext';

export const Popover = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  semantics = 'disclosure',
}: PopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const triggerId = useId();

  const value = useMemo(
    () => ({ open, setOpen, semantics, triggerRef, panelRef, panelId, triggerId }),
    [open, setOpen, semantics, panelId, triggerId],
  );

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
};

Popover.displayName = 'Popover';
