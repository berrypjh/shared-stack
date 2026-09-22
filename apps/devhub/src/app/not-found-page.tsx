import { Inspector, useDocumentTitle, WorkspaceFrame, WorkspaceHeader } from '@berrypjh/devhub-ui';

import { Link, useLocation } from 'react-router-dom';

import { LINK } from '@/components/ui/entity-link';

/** 어느 화면에도 맞지 않는 주소. */
export const RouteNotFound = () => {
  const { pathname } = useLocation();
  useDocumentTitle('없는 화면');
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader eyebrow="주소" title="없는 화면" />
        <p className="typo-body-small">
          <span className="devhub-code">{pathname}</span> 에 해당하는 화면이 없습니다.
        </p>
        <Link to="/" className={`typo-body-small ${LINK}`}>
          개요로 가기
        </Link>
      </WorkspaceFrame>
      <Inspector />
    </>
  );
};
