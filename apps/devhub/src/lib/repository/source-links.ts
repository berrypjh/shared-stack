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

const encode = (path: string) => path.split('/').map(encodeURIComponent).join('/');
const kindOf = (ref: SourceRef) => (ref.directory ? 'tree' : 'blob');

/**
 * 보조 링크: 기본 브랜치의 같은 경로. 움직이는 브랜치라 DevHub 가 본 커밋과 다를 수 있다.
 * 스냅샷 커밋에 없는 경로는 브랜치에 있는지도 알 수 없어 `null` 이다.
 */
export const latestLink = (
  repository: Repository,
  snapshot: RepositorySnapshot,
  ref: SourceRef,
): string | null =>
  snapshot.uncommitted && isUncommitted(snapshot.uncommitted, ref.path)
    ? null
    : `${repository.webUrl}/${kindOf(ref)}/${repository.defaultBranch}/${encode(ref.path)}`;

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
  const latest = latestLink(repository, snapshot, ref);
  if (!latest) return { href: null, pinned: false, gap: 'uncommitted' };
  if (!snapshot.commit) return { href: latest, pinned: false, gap: 'unknown-commit' };
  return {
    href: `${repository.webUrl}/${kindOf(ref)}/${snapshot.commit}/${encode(ref.path)}`,
    pinned: true,
    ...(snapshot.uncommitted === null ? { gap: 'unverified' as const } : {}),
  };
};
