import { downstreamOf, testsOf, upstreamOf, verifiersOf } from '../../domain/graph';
import type {
  Catalog,
  DocumentRef,
  EvidenceGap,
  PackageEntry,
  Platform,
  Relation,
  SourceRef,
  TestSuite,
  Visibility,
} from '../../domain/model';

/**
 * 패키지 화면의 상세 정보 칸 모델. 카탈로그에서만 만들고 화면은 그리기만 한다.
 * 섹션은 늘 같은 순서로 모두 있다 — 비면 숨기지 않고 `empty` 에 이유를 둔다.
 */

export type RelationItem = {
  relation: Relation;
  /** 이 항목의 반대편. */
  other: string;
};

export type Inspection = {
  id: string;
  title: string;
  purpose: string;
  platform: Platform;
  /** 매니페스트의 `private` 에서 온다. */
  visibility: { value: Visibility; evidence: SourceRef };
  overview: {
    root: SourceRef;
    nxProject: string;
    packageName: string;
    gaps: readonly EvidenceGap[];
  };
  exports: {
    visibility: Visibility;
    entries: readonly PackageEntry[];
    manifest: SourceRef;
    barrel?: SourceRef;
    guard?: SourceRef;
  };
  upstream: RelationItem[];
  downstream: RelationItem[];
  artifacts: RelationItem[];
  source: SourceRef[];
  documents: DocumentRef[];
  tests: TestSuite[];
  related: RelationItem[];
  /** 빈 섹션마다의 이유. 섹션이 비었을 때만 쓴다. */
  empty: {
    upstream: string;
    downstream: string;
    artifacts: string;
    documents: string;
    tests: string;
    related: string;
  };
};

const otherEnd = (relation: Relation, id: string) =>
  relation.from === id ? relation.to : relation.from;

/** 패키지 하나의 상세 정보. 카탈로그의 패키지가 아니면 `undefined`. */
export const inspect = (catalog: Catalog, id: string): Inspection | undefined => {
  const record = catalog.packages.find((pkg) => pkg.id === id);
  if (!record) return undefined;

  const documentById = new Map(catalog.documents.map((doc) => [doc.id, doc]));
  const flows = (relations: Relation[]) =>
    relations.map((relation) => ({ relation, other: otherEnd(relation, id) }));

  const upstream = upstreamOf(catalog, id);
  const downstream = downstreamOf(catalog, id);
  const root: SourceRef = { path: record.root, directory: true };
  const noTest = record.gaps?.find((gap) => gap.kind === 'no-test');

  return {
    id,
    title: record.id,
    purpose: record.purpose,
    platform: record.platform,
    visibility: { value: record.visibility, evidence: record.packageManifest },
    overview: {
      root,
      nxProject: record.nxProject,
      packageName: record.packageName,
      gaps: record.gaps ?? [],
    },
    exports: {
      visibility: record.visibility,
      entries: record.entries,
      manifest: record.packageManifest,
      barrel: record.barrel,
      guard: record.surfaceGuard,
    },
    upstream: flows(upstream.filter((relation) => relation.kind !== 'generated-artifact')),
    downstream: flows(downstream.filter((relation) => relation.kind !== 'generated-artifact')),
    artifacts: flows(
      [...upstream, ...downstream].filter((relation) => relation.kind === 'generated-artifact'),
    ),
    source: [root, record.nxManifest, record.packageManifest, ...record.source],
    documents: record.docs.flatMap((docId) => documentById.get(docId) ?? []),
    tests: testsOf(catalog, id),
    related: [
      ...flows(verifiersOf(catalog, id)),
      ...flows(catalog.relations.filter((r) => r.kind === 'verification' && r.from === id)),
    ],
    empty: {
      upstream: '이 항목이 기대는 의존 관계가 카탈로그에 없음',
      downstream: '이 항목에 기대는 의존 관계가 카탈로그에 없음',
      artifacts: '이 항목이 만들거나 싣는 생성물 관계가 카탈로그에 없음',
      documents: '이 항목을 설명하는 문서가 카탈로그에 없음',
      tests: noTest ? noTest.note : '이 항목을 확인하는 테스트 묶음이 카탈로그에 없음',
      related: '이 항목을 검증하거나 이 항목이 검증하는 관계가 없음',
    },
  };
};
