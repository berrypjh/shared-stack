import type { ReactNode } from 'react';

/** 경로·명령·ID 는 monospace. */
export const Mono = ({ children }: { children: ReactNode }) => (
  <code className="font-mono text-xxsm px-xs rounded-sm bg-background-default border border-stroke-light break-all">
    {children}
  </code>
);

export const Page = ({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) => (
  <div className="mx-auto w-full max-w-[1100px]">
    <header className="pb-xl mb-2xl border-b border-stroke-light">
      <h1 className="text-text-default text-xxl leading-xxl font-bold tracking-tight">{title}</h1>
      <p className="text-text-light text-sm leading-sm mt-sm break-keep">{lead}</p>
    </header>
    <div className="flex flex-col gap-2xl">{children}</div>
  </div>
);

/** 공개된 run 이 없을 때. 숫자 seed 를 두지 않고 수집·export 명령만 안내한다. */
export const EmptyRuns = ({ level = 3 }: { level?: 2 | 3 }) => {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <section
      aria-labelledby="empty-runs-title"
      className="bg-background-surface border border-stroke-default rounded-md p-xl"
    >
      <Heading id="empty-runs-title" className="text-text-default text-lg leading-lg font-semiBold">
        아직 수집한 실행이 없습니다
      </Heading>
      <p className="text-text-light text-xsm leading-xsm mt-sm break-keep">
        Node 수집기가 만든 JSON 을 export 하면 이 화면이 공개 계약으로 검증한 뒤 보여줍니다.
        브라우저는 명령을 실행하지 않습니다.
      </p>
      <ol className="mt-md flex flex-col gap-xs text-xsm text-text-default">
        <li>
          <Mono>pnpm quality:collect --profile=static --run-id=local-static-01</Mono>
        </li>
        <li>
          <Mono>pnpm quality:export --run-id=local-static-01</Mono>
        </li>
      </ol>
    </section>
  );
};
