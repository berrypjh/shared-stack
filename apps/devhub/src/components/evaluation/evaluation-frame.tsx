import { Inspector, useDocumentTitle, WorkspaceFrame, WorkspaceHeader } from '@berrypjh/devhub-ui';

import type { ReactNode } from 'react';

import { type ScreenId, screenOf } from '@/lib/evaluation/screens';

import { VIEW_ICON } from '../ui/view-icons';

import { RunInspector } from './run-inspector';
import type { RunData } from './use-run-data';

/**
 * 평가 화면 하나의 틀: 가운데는 화면 이름 · 설명 · 내용, 오른쪽은 고른 실행의 정보.
 * 이름 · 설명은 `screens.ts` 에서 읽는다 — 탐색기와 화면 머리가 같은 글이다.
 */
export const EvaluationFrame = ({
  screen,
  data,
  children,
}: {
  screen: ScreenId;
  /** 실행을 읽는 화면만. 없으면 상세 칸이 그 이유를 말한다. */
  data?: RunData;
  children: ReactNode;
}) => {
  const item = screenOf(screen);
  useDocumentTitle(`${item.label} · 평가`);
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader eyebrow="평가" icon={VIEW_ICON.evaluation} title={item.label} />
        <p className="typo-body-small break-keep text-text-light">{item.lead}</p>
        {children}
      </WorkspaceFrame>
      <Inspector>
        <RunInspector data={data} />
      </Inspector>
    </>
  );
};
