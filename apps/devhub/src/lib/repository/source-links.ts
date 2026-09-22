import type { Repository, RepositorySnapshot, SourceRef } from '../../domain/model';

/** 링크를 만들지 못했거나 스냅샷에 고정하지 못한 이유. 링크 대신 글로 보인다. */
export type LinkGap =
  /** 스냅샷 커밋에 없는 경로라 고정 링크가 404 다 */
  | 'uncommitted'
  /** 스냅샷 커밋을 몰라 기본 브랜치로 연결했다 */
  | 'unknown-commit'
  /** 커밋은 알지만 이 경로가 커밋에 있는지는 확인하지 못했다 */
  | 'unverified';

export type SourceLink = { href: string | null; pinned: boolean; gap?: LinkGap };

/** `uncommitted` 목록에 든 경로인지. `/` 로 끝나는 항목은 그 아래 전부다. */
export const isUncommitted = (uncommitted: readonly string[], path: string) =>
  uncommitted.some((entry) =>
    entry.endsWith('/')
      ? path === entry.slice(0, -1) || path.startsWith(entry)
      : path === entry || path.startsWith(`${entry}/`),
  );

/**
 * 저장소 경로 하나의 링크. 스냅샷 커밋으로 고정한 링크가 정본이다.
 * - 커밋에 없는 경로: 링크를 만들지 않는다(404 를 보여 주지 않는다)
 * - 커밋을 모름: 기본 브랜치로 잇고 그렇다고 적는다
 * href 는 저장소 주소 · 검증된 커밋 · 인코딩된 경로로만 만든다.
 */
export const sourceLink = (
  repository: Repository,
  snapshot: RepositorySnapshot,
  ref: SourceRef,
): SourceLink => {
  const path = ref.path.split('/').map(encodeURIComponent).join('/');
  const kind = ref.directory ? 'tree' : 'blob';
  if (snapshot.uncommitted && isUncommitted(snapshot.uncommitted, ref.path)) {
    return { href: null, pinned: false, gap: 'uncommitted' };
  }
  if (!snapshot.commit) {
    return {
      href: `${repository.webUrl}/${kind}/${repository.defaultBranch}/${path}`,
      pinned: false,
      gap: 'unknown-commit',
    };
  }
  return {
    href: `${repository.webUrl}/${kind}/${snapshot.commit}/${path}`,
    pinned: true,
    ...(snapshot.uncommitted === null ? { gap: 'unverified' as const } : {}),
  };
};
