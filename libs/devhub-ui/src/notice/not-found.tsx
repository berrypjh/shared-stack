'use client';

import type { ReactNode } from 'react';

import { useDevHubLink } from '../provider/devhub-provider';
import { Inspector } from '../shell/inspector';
import { WorkspaceFrame, WorkspaceHeader } from '../shell/workspace';
import type { IconName } from '../ui/icon';

/**
 * 화면은 있지만 고른 항목이 없을 때의 작업 영역. 무엇이 없는지와 목록으로 돌아가는 링크를 주고,
 * 옆 칸은 비워 둔다. 문서 제목은 앱이 정한다.
 */
export const NotFound = ({
  eyebrow,
  icon,
  title,
  message,
  backHref,
  backLabel,
}: {
  eyebrow: string;
  icon?: IconName;
  title: string;
  message: ReactNode;
  backHref: string;
  backLabel: string;
}) => {
  const Link = useDevHubLink();
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader eyebrow={eyebrow} icon={icon} title={title} />
        <p className="typo-body-small">{message}</p>
        <Link
          to={backHref}
          className="typo-body-small text-text-link underline-offset-2 hover:underline"
        >
          {backLabel}
        </Link>
      </WorkspaceFrame>
      <Inspector />
    </>
  );
};
