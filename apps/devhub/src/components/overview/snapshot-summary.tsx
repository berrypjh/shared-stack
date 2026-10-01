import type { RepositorySnapshot } from '@/domain/model';

/** 빌드 · 개발 서버가 뜰 때 읽은 커밋. 모르면 모른다고만 쓴다 — SHA 를 만들지 않는다. */
export const SnapshotSummary = ({ snapshot }: { snapshot: RepositorySnapshot }) =>
  snapshot.commit ? (
    <span>
      커밋 <span className="font-mono">{snapshot.commit.slice(0, 7)}</span>
      {snapshot.dirty && <span className="text-text-warning"> · 로컬 변경 있음</span>}
    </span>
  ) : (
    <span className="text-text-warning">스냅샷 커밋을 알 수 없음</span>
  );
