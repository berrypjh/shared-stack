import { basename, stem } from '@berrypjh/devhub-ui';

import type { Catalog } from '../../domain/model';
import { RECORD_KIND } from '../catalog/labels';
import {
  documentHref,
  entityHref,
  journeyHref,
  pluginHref,
  pluginSkillAnchor,
  pluginToolAnchor,
  recordHref,
  sourceHref,
  stepHref,
  symbolHref,
} from '../catalog/routes';
import { sourceUsage } from '../repository/source-usage';

/** 결과 종류. 순서는 같은 등급 안의 순서다. 화면은 종류를 색이 아니라 글자로 보인다. */
export const SEARCH_KINDS = [
  'journey',
  'step',
  'application',
  'package',
  'tool',
  'plugin',
  'skill',
  'mcp-tool',
  'export',
  'document',
  'record',
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

/** 플러그인과 소비자가 부르는 이름(skill · MCP 도구). 둘 다 플러그인 화면의 그 자리로 간다. */
const pluginEntries = (catalog: Catalog): Draft[] =>
  catalog.plugins.flatMap((plugin) => [
    {
      key: `plugin:${plugin.id}`,
      kind: 'plugin' as const,
      label: plugin.id,
      detail: `v${plugin.version} · ${plugin.marketplace}`,
      href: pluginHref(plugin.id),
      names: [plugin.id, plugin.root],
      text: [plugin.description, ...plugin.keywords],
    },
    ...plugin.skills.map((skill) => ({
      key: `skill:${plugin.id}:${skill.name}`,
      kind: 'skill' as const,
      label: `/${plugin.id}:${skill.name}`,
      detail: `${plugin.id} skill`,
      href: `${pluginHref(plugin.id)}#${pluginSkillAnchor(skill.name)}`,
      names: [skill.name, `${plugin.id}:${skill.name}`],
      text: [skill.description],
      related: [plugin.id],
    })),
    ...plugin.mcpServers.flatMap((server) =>
      server.tools.map((tool) => ({
        key: `mcp-tool:${plugin.id}:${tool.name}`,
        kind: 'mcp-tool' as const,
        label: tool.name,
        detail: `${server.name} MCP 도구`,
        href: `${pluginHref(plugin.id)}#${pluginToolAnchor(tool.name)}`,
        names: [tool.name],
        text: [tool.title],
        related: [plugin.id, server.name],
      })),
    ),
  ]);

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
    ...pluginEntries(catalog),
    ...exportEntries(catalog),
    ...documentEntries(catalog),
    ...recordEntries(catalog),
    ...sourceEntries(catalog),
  ].map((draft) => ({ related: [], ...draft }));
