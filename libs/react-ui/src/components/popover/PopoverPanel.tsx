'use client';

import { useEffect } from 'react';

import { cx } from '../../utils';

import { popoverClasses } from './Popover.constants';
import type { PopoverPanelProps } from './Popover.types';
import { usePopoverContext } from './PopoverContext';

export const PopoverPanel = ({
  children,
  asDialog = true,
  className,
  ...rest
}: PopoverPanelProps) => {
  const { open, setOpen, triggerRef, panelRef, panelId } = usePopoverContext('PopoverPanel');

  useEffect(() => {
    if (!open) return undefined;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen, triggerRef, panelRef]);

  if (!open) return null;

  return (
    <div
      {...rest}
      ref={panelRef}
      id={panelId}
      role={asDialog ? 'dialog' : rest.role}
      className={cx(popoverClasses.panel, className)}
    >
      {children}
    </div>
  );
};

PopoverPanel.displayName = 'PopoverPanel';
