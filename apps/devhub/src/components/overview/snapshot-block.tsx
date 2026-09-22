import { WorkspaceSection } from '@berrypjh/devhub-ui';

import type { RepositorySnapshot } from '@/domain/model';

const TREE = { true: '커밋 이후 로컬 변경 있음', false: '커밋과 같음' } as const;

/**
 * 이 화면을 만든 시점의 저장소 상태. build · 개발 서버가 뜰 때 git 으로 읽었다.
 * 읽지 못한 값은 "알 수 없음"과 이유로 남긴다 — 커밋 · 브랜치를 추측하지 않는다.
 */
export const SnapshotBlock = ({ snapshot }: { snapshot: RepositorySnapshot }) => (
  <WorkspaceSection id="overview-snapshot" title="스냅샷">
    {snapshot.commit ? (
      <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-md gap-y-sm typo-body-small">
        <dt className="text-text-light">커밋</dt>
        <dd className="devhub-code">{snapshot.commit}</dd>
        <dt className="text-text-light">브랜치</dt>
        <dd>{snapshot.branch ?? '알 수 없음 — detached HEAD 이거나 읽지 못했다'}</dd>
        <dt className="text-text-light">작업 트리</dt>
        <dd className={snapshot.dirty ? 'text-text-warning' : undefined}>
          {snapshot.dirty === null
            ? '알 수 없음 — git status 를 읽지 못했다'
            : TREE[`${snapshot.dirty}`]}
        </dd>
        <dt className="text-text-light">읽은 때</dt>
        <dd>build · 개발 서버를 시작할 때</dd>
      </dl>
    ) : (
      <p className="typo-body-small text-text-warning">
        스냅샷 커밋을 알 수 없습니다 — build 시점에 git 을 읽지 못했습니다. 커밋 · 브랜치 · 작업
        트리 상태를 추측하지 않습니다.
      </p>
    )}
  </WorkspaceSection>
);
