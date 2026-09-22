import type { Catalog, SourceRef } from '../../domain/model';

/** 어느 항목의 디렉터리에도 들지 않는 경로(루트 파일 · docs/ · .claude-plugin/)의 묶음. */
export const REPOSITORY_GROUP = '저장소';

export type RefGroup = { owner: string; refs: SourceRef[] };

/**
 * 경로를 그 경로를 품은 항목(앱 · 패키지 · 도구의 루트)별로 묶는다. 처음 나온 순서를 지키고
 * 같은 경로는 한 번만 둔다 — 파일 하나의 링크가 한 번만 보인다.
 */
export const groupByOwner = (catalog: Catalog, refs: readonly SourceRef[]): RefGroup[] => {
  const roots = [...catalog.applications, ...catalog.packages, ...catalog.tools]
    .map((entity) => ({ id: entity.id, root: entity.root }))
    .sort((a, b) => b.root.length - a.root.length);
  const ownerOf = (path: string) =>
    roots.find(({ root }) => path === root || path.startsWith(`${root}/`))?.id ?? REPOSITORY_GROUP;

  const groups = new Map<string, SourceRef[]>();
  for (const ref of refs) {
    const owner = ownerOf(ref.path);
    const list = groups.get(owner) ?? [];
    if (!list.some((seen) => seen.path === ref.path)) list.push(ref);
    groups.set(owner, list);
  }
  return [...groups].map(([owner, list]) => ({ owner, refs: list }));
};
