import type { ReactNode } from 'react';

/** 경로·명령·ID 는 monospace. */
export const Mono = ({ children }: { children: ReactNode }) => (
  <code className="font-mono text-xxsm px-xs rounded-sm bg-background-default border border-stroke-light break-all">
    {children}
  </code>
);
