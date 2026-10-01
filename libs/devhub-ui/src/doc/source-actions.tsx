import { Fragment, type ReactNode } from 'react';

import { VisuallyHidden } from '@berrypjh/react-ui';

import { Icon, type IconName } from '../ui/icon';

/** 저장소 호스트에서 경로를 보는 길 하나. 예: 커밋에 고정한 보기 · 최신 브랜치 보기. */
export type RemoteView = { href: string; label: string; icon: IconName };

const Dot = () => (
  <span aria-hidden="true" className="typo-caption-small text-text-light">
    ·
  </span>
);

/**
 * 저장소 경로와 그 경로를 여는 길들. 첫 줄은 `lead`(기록의 날짜 · 종류) · 경로 칩 · 오른쪽 아이콘
 * 동작, 아래 줄은 원격 보기 링크다. 링크 주소와 정책은 앱이 정해 넘긴다.
 */
export const SourceActions = ({
  path,
  lead,
  actions,
  views = [],
  warning,
}: {
  path: string;
  lead?: ReactNode;
  /** 경로 칩 오른쪽의 아이콘 버튼들. 예: 에디터로 열기 · 경로 복사. */
  actions?: ReactNode;
  views?: readonly RemoteView[];
  /** 링크를 만들지 못한 이유. */
  warning?: ReactNode;
}) => (
  <div className="flex flex-col gap-xs">
    <div className="flex flex-wrap items-center gap-x-sm gap-y-xs">
      {lead}
      {lead && <Dot />}
      <span className="inline-flex min-w-0 items-center gap-xs rounded-sm bg-background-default px-sm py-2xs">
        <Icon name="document" className="text-text-light" />
        <span className="devhub-code min-w-0 break-all">{path}</span>
      </span>
      {actions && <span className="flex shrink-0 items-center gap-xs">{actions}</span>}
    </div>
    {views.length > 0 && (
      <div className="flex flex-wrap items-center gap-x-sm">
        {views.map((view, index) => (
          <Fragment key={view.href}>
            {index > 0 && <Dot />}
            <a
              href={view.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-xs typo-caption-small text-text-link underline-offset-2 hover:underline"
            >
              <Icon name={view.icon} />
              {view.label}
              <VisuallyHidden> — {path}, 새 창</VisuallyHidden>
            </a>
          </Fragment>
        ))}
      </div>
    )}
    {warning && <p className="typo-caption-small text-text-warning">{warning}</p>}
  </div>
);
