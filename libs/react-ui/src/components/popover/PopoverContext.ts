import { createContext, type RefObject, useContext } from 'react';

import type { PopoverSemantics } from './Popover.types';

export type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  semantics: PopoverSemantics;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  panelId: string;
  triggerId: string;
};

export const PopoverContext = createContext<PopoverContextValue | null>(null);

export const usePopoverContext = (component: string): PopoverContextValue => {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error(`${component} must be used within <Popover>`);
  }
  return ctx;
};
