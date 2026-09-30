/** 항목 화면이 함께 쓰는 글자 조각. */

export const ROWS = 'grid grid-cols-[7rem_minmax(0,1fr)] gap-x-md gap-y-sm typo-body-small';

export const Code = ({ children }: { children: string }) => (
  <span className="devhub-code">{children}</span>
);
