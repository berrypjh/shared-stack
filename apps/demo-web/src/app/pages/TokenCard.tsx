import { CSSProperties, ReactNode } from 'react';

/**
 * 토큰 문서 카드. 위는 값을 그린 미리보기 면, 아래는 이름과 값이다.
 *
 * CSS 변수는 카드 폭에 한 줄로 들어가지 않아(최대 40자) 마우스를 올렸을 때 미리보기 면 위에
 * 줄바꿈해 덮는다. 합성 토큰처럼 catalog 에 단일 변수가 없으면 덮지 않는다 — 지어내지 않는다.
 */
export const TokenCard = ({
  testId,
  preview,
  name,
  value,
  cssVar,
}: {
  testId: string;
  preview: ReactNode;
  name: string;
  value: ReactNode;
  cssVar?: string;
}) => (
  <div
    className="group flex flex-col min-w-0 overflow-hidden rounded-sm border border-stroke-light bg-background-surface shadow-xs"
    data-testid={testId}
  >
    <div className="relative h-[72px] overflow-hidden">
      {preview}
      {/* 스크림은 테마와 무관하게 어두워야 글자가 읽히므로 neutral 램프 양 끝을 쓴다. */}
      {cssVar && (
        <code className="absolute inset-0 flex items-center justify-center p-xs text-center font-mono text-xxsm leading-xxsm break-all bg-neutral-ne900/80 text-neutral-ne100 opacity-0 transition-opacity group-hover:opacity-100">
          {cssVar}
        </code>
      )}
    </div>
    <div className="flex flex-col items-center gap-2xs px-xs py-sm text-center">
      <span className="text-text-default text-xxsm leading-none break-all">{name}</span>
      <span
        className="text-text-light text-xxsm leading-none truncate max-w-full"
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </span>
    </div>
  </div>
);

/** 미리보기 면을 꽉 채우는 층. 내용은 가운데 놓인다. */
export const PreviewFill = ({
  children,
  className = '',
  style,
}: {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => (
  <div className={`absolute inset-0 flex items-center justify-center ${className}`} style={style}>
    {children}
  </div>
);

/**
 * 카드 격자. 모든 계열이 같은 9열을 써서 계열이 달라도 같은 자리가 세로로 맞고, 9개를 넘으면
 * 다음 줄로 이어진다. 좁은 화면에서는 카드를 줄이지 않고 가로 스크롤로 둔다.
 * 음수 margin 은 스크롤 영역이 카드 그림자를 자르지 않게 하면서 제목과 왼쪽 선을 맞춘다.
 */
export const TokenGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-[repeat(9,112px)] gap-md overflow-x-auto p-xs -m-xs">
    {children}
  </div>
);
