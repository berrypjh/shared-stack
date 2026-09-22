import { commandLine } from '../../domain/commands';
import { downstreamOf, testsOf, upstreamOf, verifiersOf } from '../../domain/graph';
import type {
  Application,
  Catalog,
  ConstraintRef,
  DocumentRef,
  EvidenceGap,
  Package,
  PackageEntry,
  Platform,
  Relation,
  SourceRef,
  TestSuite,
  Tool,
  Visibility,
} from '../../domain/model';

/**
 * 상세 정보 칸의 모델. 카탈로그에서만 만들고 화면은 그리기만 한다.
 * 섹션은 늘 같은 순서로 모두 있다 — 비면 숨기지 않고 `empty` 에 이유를 둔다.
 */

export type SubjectKind = 'application' | 'package' | 'tool';

export type RelationItem = {
  relation: Relation;
  /** 이 항목의 반대편. */
  other: string;
};

export type CommandItem = {
  id: string;
  line: string;
  purpose: string;
  constraints: readonly ConstraintRef[];
};

export type TestItem = { suite: TestSuite; line: string | null };

export type VisibilityFact =
  | { value: Visibility; evidence: SourceRef }
  | { value: null; reason: string };

export type Exports =
  | {
      visibility: Visibility;
      entries: readonly PackageEntry[];
      manifest: SourceRef;
      barrel?: SourceRef;
      guard?: SourceRef;
    }
  | { reason: string };

export type Inspection = {
  id: string;
  kind: SubjectKind;
  title: string;
  purpose: string;
  platform: Platform;
  visibility: VisibilityFact;
  overview: {
    root: SourceRef;
    nxProject: string | null;
    nxManifest: SourceRef | null;
    packageName: string | null;
    gaps: readonly EvidenceGap[];
  };
  exports: Exports;
  upstream: RelationItem[];
  downstream: RelationItem[];
  artifacts: RelationItem[];
  commands: CommandItem[];
  source: SourceRef[];
  documents: DocumentRef[];
  tests: TestItem[];
  related: RelationItem[];
  /** 빈 섹션마다의 이유. 섹션이 비었을 때만 쓴다. */
  empty: {
    upstream: string;
    downstream: string;
    artifacts: string;
    commands: string;
    documents: string;
    tests: string;
    related: string;
  };
};

type Subject =
  | { kind: 'application'; record: Application }
  | { kind: 'package'; record: Package }
  | { kind: 'tool'; record: Tool };

const subjectOf = (catalog: Catalog, id: string): Subject | undefined => {
  const app = catalog.applications.find((a) => a.id === id);
  if (app) return { kind: 'application', record: app };
  const pkg = catalog.packages.find((p) => p.id === id);
  if (pkg) return { kind: 'package', record: pkg };
  const tool = catalog.tools.find((t) => t.id === id);
  return tool && { kind: 'tool', record: tool };
};

const otherEnd = (relation: Relation, id: string) =>
  relation.from === id ? relation.to : relation.from;

const visibilityOf = (subject: Subject): VisibilityFact => {
  const { record } = subject;
  if (record.visibility && record.packageManifest) {
    return { value: record.visibility, evidence: record.packageManifest };
  }
  return {
    value: null,
    reason: 'package.json 이 없어 배포 단위가 아니다 — 공개 여부가 정의되지 않는다',
  };
};

const exportsOf = (subject: Subject): Exports => {
  if (subject.kind === 'package') {
    const pkg = subject.record;
    return {
      visibility: pkg.visibility,
      entries: pkg.entries,
      manifest: pkg.packageManifest,
      barrel: pkg.barrel,
      guard: pkg.surfaceGuard,
    };
  }
  return subject.record.packageManifest
    ? {
        reason:
          'package.json 에 exports · main 이 없다 — 다른 패키지가 import 하는 진입점이 아니다',
      }
    : { reason: 'package.json 이 없어 진입점이 없다' };
};

const rootRef = (subject: Subject): SourceRef =>
  subject.kind === 'tool' && subject.record.rootKind === 'file'
    ? { path: subject.record.root }
    : { path: subject.record.root, directory: true };

/** 항목 하나의 상세 정보. 카탈로그에 없는 ID 면 `undefined`. */
export const inspect = (catalog: Catalog, id: string): Inspection | undefined => {
  const subject = subjectOf(catalog, id);
  if (!subject) return undefined;
  const { record } = subject;

  const commandById = new Map(catalog.commands.map((command) => [command.id, command]));
  const documentById = new Map(catalog.documents.map((doc) => [doc.id, doc]));
  const flows = (relations: Relation[]) =>
    relations.map((relation) => ({ relation, other: otherEnd(relation, id) }));

  const upstream = upstreamOf(catalog, id);
  const downstream = downstreamOf(catalog, id);
  const nxManifest = 'nxManifest' in record ? record.nxManifest : null;
  const manifests = [
    ...(nxManifest ? [nxManifest] : []),
    ...(record.packageManifest && record.packageManifest.path !== nxManifest?.path
      ? [record.packageManifest]
      : []),
  ];
  const noTest = record.gaps?.find((gap) => gap.kind === 'no-test');

  return {
    id,
    kind: subject.kind,
    title: subject.kind === 'tool' ? subject.record.name : record.id,
    purpose: record.purpose,
    platform: record.platform,
    visibility: visibilityOf(subject),
    overview: {
      root: rootRef(subject),
      nxProject: record.nxProject ?? null,
      nxManifest,
      packageName: record.packageName ?? null,
      gaps: record.gaps ?? [],
    },
    exports: exportsOf(subject),
    upstream: flows(upstream.filter((relation) => relation.kind !== 'generated-artifact')),
    downstream: flows(downstream.filter((relation) => relation.kind !== 'generated-artifact')),
    artifacts: flows(
      [...upstream, ...downstream].filter((relation) => relation.kind === 'generated-artifact'),
    ),
    commands: record.commands.flatMap((commandId) => {
      const command = commandById.get(commandId);
      return command
        ? [
            {
              id: command.id,
              line: commandLine(command),
              purpose: command.purpose,
              constraints: command.constraints,
            },
          ]
        : [];
    }),
    source: [rootRef(subject), ...manifests, ...record.source],
    documents: record.docs.flatMap((docId) => documentById.get(docId) ?? []),
    tests: testsOf(catalog, id).map((suite) => {
      const command = commandById.get(suite.command);
      return { suite, line: command ? commandLine(command) : null };
    }),
    related: [
      ...flows(verifiersOf(catalog, id)),
      ...flows(catalog.relations.filter((r) => r.kind === 'verification' && r.from === id)),
    ],
    empty: {
      upstream: '이 항목이 기대는 의존 관계가 카탈로그에 없다',
      downstream: '이 항목에 기대는 의존 관계가 카탈로그에 없다',
      artifacts: '이 항목이 만들거나 싣는 생성물 관계가 카탈로그에 없다',
      commands: '이 항목의 명령이 카탈로그에 없다',
      documents: '이 항목을 설명하는 문서가 카탈로그에 없다',
      tests: noTest ? noTest.note : '이 항목을 확인하는 테스트 묶음이 카탈로그에 없다',
      related: '이 항목을 검증하거나 이 항목이 검증하는 관계가 없다',
    },
  };
};
