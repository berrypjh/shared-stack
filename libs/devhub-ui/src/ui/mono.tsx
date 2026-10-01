import type { ReactNode } from 'react';

/** 경로 · 명령 · ID 처럼 그대로 읽어야 하는 글. monospace 칩으로 보인다. */
export const Mono = ({ children }: { children: ReactNode }) => (
  <code className="devhub-code rounded-sm border border-stroke-light bg-background-default px-xs break-all">
    {children}
  </code>
);

/** 사람이 읽는 이름과 그 아래 작은 코드 이름. 둘이 같으면 이름만 보인다. */
export const NamedCode = ({ name, code }: { name: string; code: string }) => (
  <>
    {name}
    {name !== code && (
      <span className="block typo-caption-small text-text-light">
        <Mono>{code}</Mono>
      </span>
    )}
  </>
);
