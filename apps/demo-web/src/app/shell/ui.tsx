import { ReactNode } from 'react';

/**
 * 페이지 primitive. 반복이 실제로 생긴 것만 둔다.
 *
 * 섹션을 카드로 감싸지 않는다 — 구분은 divider·여백·surface 대비로 만들고, 카드는 독립
 * interaction surface(preview canvas, 비교 단위)에만 쓴다.
 *
 * 설명 문장에 `ch` 로 최대 폭을 걸지 않는다. `ch` 는 라틴 `0` 폭(약 0.5em) 기준이라
 * 글자당 약 1em 인 한글에서는 의도한 글자 수의 절반에서 줄이 꺾인다. 대신 `break-keep` 로
 * 어절 중간에서 끊기지 않게만 한다.
 */

export const Page = ({
  title,
  lead,
  actions,
  children,
  testId,
}: {
  title: string;
  lead?: string;
  actions?: ReactNode;
  children: ReactNode;
  testId?: string;
}) => (
  <div data-testid={testId}>
    <header className="flex flex-wrap items-start justify-between gap-lg pb-xl mb-2xl border-b border-stroke-light">
      <div className="min-w-0">
        <h1 className="text-text-default text-xxl leading-xxl font-bold tracking-tight">{title}</h1>
        {lead && <p className="text-text-light text-sm leading-sm mt-sm break-keep">{lead}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
    <div className="flex flex-col gap-3xl">{children}</div>
  </div>
);

export const Section = ({
  title,
  note,
  actions,
  children,
}: {
  title: string;
  note?: string;
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <section>
    {/*
      note 를 제목 옆이 아니라 아래에 둔다. 옆에 붙이면 제목과 설명이 한 줄에서 경쟁하고
      길면 잘려 나갔다. 아래 줄로 내리면 Page 의 제목·lead 와 같은 관계가 되어 층이 일정해진다.
    */}
    <div className="flex flex-wrap items-start justify-between gap-md mb-lg">
      <div className="min-w-0">
        <h2 className="text-text-default text-lg leading-lg font-semiBold">{title}</h2>
        {note && <p className="text-text-light text-xsm leading-xsm mt-xs break-keep">{note}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
    {children}
  </section>
);

/** 독립 surface. preview canvas 나 비교 단위처럼 경계가 의미 있을 때만 쓴다. */
export const Panel = ({
  children,
  className = '',
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) => (
  <div
    data-testid={testId}
    className={`bg-background-surface border border-stroke-default rounded-md p-xl ${className}`}
  >
    {children}
  </div>
);

/** 컴포넌트 결과가 가장 눈에 띄도록 배경만 다른 캔버스. */
export const Preview = ({ children }: { children: ReactNode }) => (
  <div className="bg-background-surface border border-stroke-default rounded-md p-xl flex flex-wrap gap-lg items-center">
    {children}
  </div>
);

export const Mono = ({ children }: { children: ReactNode }) => (
  <code className="font-mono text-xxsm text-text-light">{children}</code>
);

export const Swatch = ({ color, size = 20 }: { color: string; size?: number }) => (
  <span
    className="inline-block rounded-xs border border-stroke-light shrink-0"
    style={{ width: size, height: size, background: color }}
    aria-hidden
  />
);
