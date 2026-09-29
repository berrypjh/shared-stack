import { VisuallyHidden } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import { Icon } from '../ui/icon';

/** 파일에서 인용한 symbol 들을 코드 칩으로. */
const Symbols = ({ symbols }: { symbols: readonly string[] }) =>
  symbols.length ? (
    <ul aria-label="symbol" className="flex flex-wrap gap-xs">
      {symbols.map((symbol) => (
        <li key={symbol} className="devhub-code rounded-sm bg-background-default px-xs py-2xs">
          {symbol}
        </li>
      ))}
    </ul>
  ) : null;

/**
 * 파일 한 줄(`<li>`): 이름이 새 창 링크, 폴더는 흐리게, 오른쪽은 파일마다의 동작(`actions`).
 * 링크 주소와 그 정책(커밋 고정 · 이유)은 앱이 정해 넘긴다. `href` 가 없으면 이름만 글자다.
 */
export const FileLine = ({
  name,
  folder,
  href,
  linkDescription,
  label,
  actions,
  symbols = [],
  warning,
  children,
}: {
  name: string;
  folder?: string;
  href?: string;
  /** 링크 뒤에 스크린 리더만 읽는 설명. 예: `— docs/a.md, 저장소에서 보기, 새 창`. */
  linkDescription?: string;
  /** 파일의 역할. 이름 앞에 보인다(`위치`, `설정`). */
  label?: string;
  /** 오른쪽 끝의 아이콘 버튼들. 예: 에디터로 열기 · 경로 복사. */
  actions?: ReactNode;
  symbols?: readonly string[];
  /** 링크를 만들지 못했거나 대신 이은 이유. 경고 아이콘과 함께 보인다. */
  warning?: ReactNode;
  /** 파일이 담은 것(문서 제목 · 테스트 제목). */
  children?: ReactNode;
}) => (
  <li className="flex min-w-0 flex-col gap-xs">
    <div className="flex items-start justify-between gap-sm">
      <div className="flex min-w-0 flex-col">
        <span className="flex flex-wrap items-center gap-x-xs">
          {label && <span className="typo-caption-small text-text-light">{label}</span>}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-w-0 items-center gap-xs text-text-link"
            >
              <span className="typo-body-small-strong break-all underline-offset-2 group-hover:underline">
                {name}
              </span>
              <Icon name="external" />
              {linkDescription && <VisuallyHidden> {linkDescription}</VisuallyHidden>}
            </a>
          ) : (
            <span className="typo-body-small-strong break-all">{name}</span>
          )}
        </span>
        {folder && <span className="devhub-code break-all text-text-light">{folder}</span>}
      </div>
      {actions && <span className="flex shrink-0 items-center gap-xs">{actions}</span>}
    </div>
    <Symbols symbols={symbols} />
    {children}
    {warning && (
      <p className="flex items-center gap-xs typo-caption-small text-text-warning">
        <Icon name="warning" />
        {warning}
      </p>
    )}
  </li>
);

/** 작은 제목 아래 왼쪽 선으로 묶은 파일 줄들. 경로마다 같은 접두사가 반복되지 않게 한다. */
export const FileList = ({ title, children }: { title: ReactNode; children: ReactNode }) => (
  <div className="flex flex-col gap-sm">
    <h4 className="flex flex-wrap items-center gap-x-sm typo-caption-small text-text-light">
      {title}
    </h4>
    <ul className="flex flex-col gap-md border-l border-stroke-light pl-md">{children}</ul>
  </div>
);
