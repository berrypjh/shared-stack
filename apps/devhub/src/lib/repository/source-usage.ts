import type { Catalog, SourceRef } from '../../domain/model';
import {
  commandHref,
  entityHref,
  type EntityKind,
  recordHref,
  stepHref,
  testHref,
  workflowHref,
} from '../catalog/routes';

/** 경로를 인용하는 자리. 종류는 글자로 보인다. */
export type Citation = { kind: CitationKind; label: string; href: string };

export type CitationKind =
  | 'repository'
  | 'application'
  | 'package'
  | 'tool'
  | 'relation'
  | 'step'
  | 'record'
  | 'test'
  | 'command'
  | 'workflow';

export type SourceUsage = {
  path: string;
  directory: boolean;
  /** 이 경로에서 인용된 코드 symbol. 처음 나온 순서. */
  symbols: string[];
  /** 식별자가 아닌 인용 글자(설정 줄 · 문장). symbol 이 아니다. */
  quotes: string[];
  citations: Citation[];
};

type Cited = { ref: SourceRef; by: Citation };

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * `SourceRef.symbol` 은 "파일에 그대로 있는 글자"다. 식별자 모양(쉼표로 나열한 것 포함)이면 코드 symbol,
 * 아니면 인용 글자다. 모양으로만 가른다 — 추측하지 않는다.
 */
export const symbolsIn = (text: string): string[] | null => {
  const parts = text.split(/,\s*/);
  return parts.every((part) => IDENTIFIER.test(part)) ? parts : null;
};

const entityRefs = (catalog: Catalog): Cited[] => {
  const groups: [EntityKind, Catalog['applications'] | Catalog['packages'] | Catalog['tools']][] = [
    ['application', catalog.applications],
    ['package', catalog.packages],
    ['tool', catalog.tools],
  ];
  return groups.flatMap(([kind, list]) =>
    list.flatMap((entity) => {
      const by: Citation = {
        kind,
        label: 'name' in entity ? entity.name : entity.id,
        href: entityHref(kind, entity.id),
      };
      const refs: SourceRef[] = [
        ...entity.source,
        ...(entity.gaps ?? []).flatMap((gap) => gap.evidence),
        ...('nxManifest' in entity ? [entity.nxManifest] : []),
        ...(entity.packageManifest ? [entity.packageManifest] : []),
        ...('barrel' in entity && entity.barrel ? [entity.barrel] : []),
        ...('surfaceGuard' in entity && entity.surfaceGuard ? [entity.surfaceGuard] : []),
      ];
      return refs.map((ref) => ({ ref, by }));
    }),
  );
};

/** 카탈로그가 인용하는 모든 저장소 경로(문서 경로는 문서로 따로 있다). */
const citedRefs = (catalog: Catalog): Cited[] => [
  ...[
    ...catalog.repository.evidence,
    catalog.repository.purpose.source,
    ...(catalog.repository.gaps ?? []).flatMap((gap) => gap.evidence),
  ].map((ref) => ({ ref, by: { kind: 'repository' as const, label: '저장소 개요', href: '/' } })),
  ...entityRefs(catalog),
  ...catalog.relations.map((relation) => ({
    ref: relation.evidence,
    by: {
      kind: 'relation' as const,
      label: `${relation.from} → ${relation.to}`,
      href: `/architecture/${relation.from}`,
    },
  })),
  ...catalog.journeys.flatMap((journey) =>
    journey.steps.flatMap((step) =>
      [...step.source, ...(step.gaps ?? []).flatMap((gap) => gap.evidence)].map((ref) => ({
        ref,
        by: {
          kind: 'step' as const,
          label: `${journey.title} · ${step.intent}`,
          href: stepHref(journey.id, step.id),
        },
      })),
    ),
  ),
  ...catalog.records.flatMap((record) =>
    record.sources.map((ref) => ({
      ref,
      by: { kind: 'record' as const, label: record.title, href: recordHref(record.id) },
    })),
  ),
  ...catalog.tests.flatMap((suite) =>
    [suite.config, ...(suite.files ?? [])].map((ref) => ({
      ref,
      by: { kind: 'test' as const, label: suite.id, href: testHref(suite.id) },
    })),
  ),
  ...catalog.commands.flatMap((command) =>
    command.constraints.map(({ evidence }) => ({
      ref: evidence,
      by: { kind: 'command' as const, label: command.id, href: commandHref(command.id) },
    })),
  ),
  ...catalog.workflows.flatMap((workflow) =>
    [{ path: workflow.path }, ...(workflow.notes ?? []).map((note) => note.evidence)].map(
      (ref) => ({
        ref,
        by: { kind: 'workflow' as const, label: workflow.name, href: workflowHref(workflow.id) },
      }),
    ),
  ),
];

/**
 * 경로마다 그 경로를 인용하는 자리와 인용된 symbol. 같은 자리는 한 번만 센다.
 * 저장소 경로가 카탈로그의 어디에 나오든 여기 모인다 — 손으로 적은 목록이 없다.
 */
export const sourceUsage = (catalog: Catalog): Map<string, SourceUsage> => {
  const usage = new Map<string, SourceUsage>();
  for (const { ref, by } of citedRefs(catalog)) {
    const entry = usage.get(ref.path) ?? {
      path: ref.path,
      directory: ref.directory === true,
      symbols: [],
      quotes: [],
      citations: [],
    };
    if (ref.symbol) {
      const symbols = symbolsIn(ref.symbol);
      for (const text of symbols ?? [ref.symbol]) {
        const list = symbols ? entry.symbols : entry.quotes;
        if (!list.includes(text)) list.push(text);
      }
    }
    if (!entry.citations.some((c) => c.href === by.href && c.label === by.label)) {
      entry.citations.push(by);
    }
    usage.set(ref.path, entry);
  }
  return usage;
};
