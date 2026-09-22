import { basename, stem } from '@berrypjh/devhub-ui';

import { commandLine } from '../../domain/commands';
import type { Catalog } from '../../domain/model';
import { RECORD_KIND } from '../catalog/labels';
import {
  commandHref,
  documentHref,
  entityHref,
  journeyHref,
  recordHref,
  sourceHref,
  stepHref,
  symbolHref,
  testHref,
} from '../catalog/routes';
import { sourceUsage } from '../repository/source-usage';

/** 결과 종류. 순서는 같은 등급 안의 순서다. 화면은 종류를 색이 아니라 글자로 보인다. */
export const SEARCH_KINDS = [
  'journey',
  'step',
  'application',
  'package',
  'tool',
  'export',
  'document',
  'record',
  'command',
  'test',
  'source',
  'symbol',
] as const;

export type SearchKind = (typeof SEARCH_KINDS)[number];

export type SearchEntry = {
  key: string;
  kind: SearchKind;
  label: string;
  detail: string;
  href: string;
  /** 정확히 · 앞부분으로 맞춘다: ID · 이름 · 경로. */
  names: string[];
  /** 단어 · 부분 글자로 맞춘다: 설명 · 동작. */
  text: string[];
  /** 마지막으로만 맞춘다: 이 항목을 품거나 인용하는 것의 이름. */
  related: string[];
};

type Draft = Omit<SearchEntry, 'related'> & { related?: string[] };

const journeyEntries = (catalog: Catalog): Draft[] =>
  catalog.journeys.flatMap((journey) => [
    {
      key: `journey:${journey.id}`,
      kind: 'journey' as const,
      label: journey.title,
      detail: journey.goal,
      href: journeyHref(journey.id),
      names: [journey.id, journey.title],
      text: [journey.goal],
    },
    ...journey.steps.map((step, index) => ({
      key: `step:${journey.id}/${step.id}`,
      kind: 'step' as const,
      label: step.intent,
      detail: `${journey.title} · ${index + 1}단계`,
      href: stepHref(journey.id, step.id),
      names: [step.intent],
      text: [step.behavior, step.owner],
      related: [journey.id, journey.title, step.id],
    })),
  ]);

const entityEntries = (catalog: Catalog): Draft[] => [
  ...catalog.applications.map((app) => ({
    key: `application:${app.id}`,
    kind: 'application' as const,
    label: app.id,
    detail: app.root,
    href: entityHref('application', app.id),
    names: [app.id, app.root, app.nxProject],
    text: [app.purpose],
  })),
  ...catalog.packages.map((pkg) => ({
    key: `package:${pkg.id}`,
    kind: 'package' as const,
    label: pkg.id,
    detail: pkg.packageName,
    href: entityHref('package', pkg.id),
    names: [pkg.id, pkg.packageName, pkg.root],
    text: [pkg.purpose],
  })),
  ...catalog.tools.map((tool) => ({
    key: `tool:${tool.id}`,
    kind: 'tool' as const,
    label: tool.name,
    detail: tool.root,
    href: entityHref('tool', tool.id),
    names: [tool.id, tool.name, tool.root],
    text: [tool.purpose],
  })),
];

/** 공개(배포) 패키지의 `exports` specifier. 내부 패키지의 진입점은 소비자 API 가 아니라 넣지 않는다. */
const exportEntries = (catalog: Catalog): Draft[] =>
  catalog.packages
    .filter((pkg) => pkg.visibility === 'public')
    .flatMap((pkg) =>
      pkg.entries.map((entry) => ({
        key: `export:${entry.specifier}`,
        kind: 'export' as const,
        label: entry.specifier,
        detail: `${pkg.id} 진입점`,
        href: `${entityHref('package', pkg.id)}#inspector-exports`,
        names: [entry.specifier],
        text: [],
        related: [pkg.id, pkg.packageName],
      })),
    );

const documentEntries = (catalog: Catalog): Draft[] =>
  catalog.documents.map((doc) => ({
    key: `document:${doc.id}`,
    kind: 'document' as const,
    label: doc.path,
    detail: doc.title,
    href: documentHref(doc.id),
    names: [doc.id, doc.path, doc.title, stem(doc.path)],
    text: [],
  }));

const recordEntries = (catalog: Catalog): Draft[] =>
  catalog.records.map((record) => ({
    key: `record:${record.id}`,
    kind: 'record' as const,
    label: record.title,
    detail: `${record.date} · ${RECORD_KIND[record.kind]}`,
    href: recordHref(record.id),
    names: [record.id, record.title],
    text: [record.summary],
  }));

const engineeringEntries = (catalog: Catalog): Draft[] => [
  ...catalog.commands.map((command) => ({
    key: `command:${command.id}`,
    kind: 'command' as const,
    label: commandLine(command),
    detail: command.purpose,
    href: commandHref(command.id),
    names: [
      command.id,
      commandLine(command),
      command.source.kind === 'package-script' ? command.source.script : command.source.target,
    ],
    text: [command.purpose],
  })),
  ...catalog.tests.map((suite) => ({
    key: `test:${suite.id}`,
    kind: 'test' as const,
    label: suite.id,
    detail: `${suite.runner} · ${suite.config.path}`,
    href: testHref(suite.id),
    names: [suite.id],
    text: [suite.runner, suite.config.path],
    related: [...suite.subjects],
  })),
];

const sourceEntries = (catalog: Catalog): Draft[] =>
  [...sourceUsage(catalog).values()].flatMap((usage) => {
    const citing = usage.citations.map((citation) => citation.label);
    return [
      {
        key: `source:${usage.path}`,
        kind: 'source' as const,
        label: usage.path + (usage.directory ? '/' : ''),
        detail: `인용 ${usage.citations.length}곳`,
        href: sourceHref(usage.path),
        names: [usage.path, basename(usage.path), stem(usage.path)],
        text: [...usage.symbols, ...usage.quotes],
        related: citing,
      },
      ...usage.symbols.map((symbol) => ({
        key: `symbol:${usage.path}#${symbol}`,
        kind: 'symbol' as const,
        label: symbol,
        detail: usage.path,
        href: symbolHref(usage.path, symbol),
        names: [symbol],
        text: [usage.path],
        related: citing,
      })),
    ];
  });

/** 카탈로그 전체에서 검색 항목을 유도한다. 따로 적은 검색 목록이 없다. */
export const searchEntries = (catalog: Catalog): SearchEntry[] =>
  [
    ...journeyEntries(catalog),
    ...entityEntries(catalog),
    ...exportEntries(catalog),
    ...documentEntries(catalog),
    ...recordEntries(catalog),
    ...engineeringEntries(catalog),
    ...sourceEntries(catalog),
  ].map((draft) => ({ related: [], ...draft }));
