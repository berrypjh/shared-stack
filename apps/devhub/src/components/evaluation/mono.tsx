import type { ReactNode } from 'react';

/** 경로 · 명령 · ID 는 monospace. */
export const Mono = ({ children }: { children: ReactNode }) => (
  <code className="devhub-code rounded-sm border border-stroke-light bg-background-default px-xs break-all">
    {children}
  </code>
);
