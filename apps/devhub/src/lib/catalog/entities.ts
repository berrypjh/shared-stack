import { catalog } from '../../data';
import type {
  DocumentRef,
  Evaluation,
  Journey,
  Package,
  PackageKind,
  Plugin,
  RecordRef,
  RecordTopic,
} from '../../domain/model';

import {
  DOCUMENT_GROUP,
  EVALUATION_KIND,
  JOURNEY_KIND,
  PACKAGE_KIND,
  PLUGIN_KIND,
  RECORD_TOPIC,
} from './labels';
import { entityHref } from './routes';

/**
 * 탐색의 단일 출처. 상단 바 "보기", 탐색기, 좁은 화면 서랍, route 가 모두 여기서 읽는다.
 * 항목은 카탈로그에서 만든다 — 손으로 적은 목록이 없다.
 */

export const PRODUCT_NAME = 'Shared Stack DevHub';

export type SectionId =
  | 'journeys'
  | 'evaluation'
  | 'packages'
  | 'plugins'
  | 'documents'
  | 'records';

type EntityBase = {
  id: string;
  label: string;
  href: string;
  group?: string;
  /** 탐색기에서만 쓰는 짧은 이름 — 묶음 제목이 이미 말하는 앞부분을 뗀다. 없으면 `label`. */
  navLabel?: string;
};

export type Entity =
  | (EntityBase & { section: 'journeys'; record: Journey })
  | (EntityBase & { section: 'evaluation'; record: Evaluation })
  | (EntityBase & { section: 'packages'; record: Package })
  | (EntityBase & { section: 'plugins'; record: Plugin })
  | (EntityBase & { section: 'documents'; record: DocumentRef })
  | (EntityBase & { section: 'records'; record: RecordRef });

export type Section = {
  id: SectionId;
  title: string;
  path: string;
  entities: Entity[];
};

const PACKAGE_ORDER: PackageKind[] = ['ui', 'foundation', 'contract', 'config'];

const hrefOf = (section: SectionId, id: string) => `/${section}/${id}`;

const DOCUMENT_GROUP_ORDER = [...new Set(DOCUMENT_GROUP.map(([, title]) => title))];

/** 문서가 속한 묶음 — 맞는 접두사 중 가장 긴 것. */
const documentPlaceOf = (path: string) =>
  DOCUMENT_GROUP.filter(([prefix]) => path.startsWith(prefix)).sort(
    ([a], [b]) => b.length - a.length,
  )[0];

/** 문서의 묶음. 어느 접두사에도 맞지 않으면 `undefined` 라 목록에서 빠진다(테스트가 막는다). */
export const documentGroupOf = (path: string) => documentPlaceOf(path)?.[1];

/** 기록은 최신순으로 읽는다. 같은 날짜는 적힌 순서를 그대로 둔다. */
export const RECORDS_NEWEST_FIRST: RecordRef[] = [...catalog.records].sort((a, b) =>
  b.date.localeCompare(a.date),
);

export const SECTIONS: Section[] = [
  {
    id: 'journeys',
    title: '작업 흐름',
    path: '/journeys',
    entities: (Object.keys(JOURNEY_KIND) as Journey['kind'][]).flatMap((kind) =>
      catalog.journeys
        .filter((record) => record.kind === kind)
        .map((record) => ({
          section: 'journeys' as const,
          id: record.id,
          label: record.title,
          navLabel: record.title.replace(`${JOURNEY_KIND[kind]} · `, ''),
          href: hrefOf('journeys', record.id),
          group: JOURNEY_KIND[kind],
          record,
        })),
    ),
  },
  {
    id: 'evaluation',
    title: '평가',
    path: '/evaluation',
    entities: (Object.keys(EVALUATION_KIND) as Evaluation['kind'][]).flatMap((kind) =>
      catalog.evaluations
        .filter((record) => record.kind === kind)
        .map((record) => ({
          section: 'evaluation' as const,
          id: record.id,
          label: record.title,
          href: hrefOf('evaluation', record.id),
          group: EVALUATION_KIND[kind],
          record,
        })),
    ),
  },
  {
    id: 'records',
    title: '기록',
    path: '/records',
    entities: (Object.keys(RECORD_TOPIC) as RecordTopic[]).flatMap((topic) =>
      RECORDS_NEWEST_FIRST.filter((record) => record.topic === topic).map((record) => ({
        section: 'records' as const,
        id: record.id,
        label: record.title,
        href: hrefOf('records', record.id),
        group: RECORD_TOPIC[topic],
        record,
      })),
    ),
  },
  {
    id: 'packages',
    title: '패키지',
    path: '/packages',
    entities: PACKAGE_ORDER.flatMap((kind) =>
      catalog.packages
        .filter((record) => record.kind === kind)
        .map((record) => ({
          section: 'packages' as const,
          id: record.id,
          label: record.id,
          href: hrefOf('packages', record.id),
          group: PACKAGE_KIND[kind],
          record,
        })),
    ),
  },
  {
    id: 'plugins',
    title: '플러그인',
    path: '/plugins',
    entities: (Object.keys(PLUGIN_KIND) as Plugin['kind'][]).flatMap((kind) =>
      catalog.plugins
        .filter((record) => record.kind === kind)
        .map((record) => ({
          section: 'plugins' as const,
          id: record.id,
          label: record.id,
          href: hrefOf('plugins', record.id),
          group: PLUGIN_KIND[kind],
          record,
        })),
    ),
  },
  {
    id: 'documents',
    title: '문서',
    path: '/documents',
    entities: DOCUMENT_GROUP_ORDER.flatMap((title) =>
      catalog.documents
        .filter((record) => documentGroupOf(record.path) === title)
        .map((record) => ({
          section: 'documents' as const,
          id: record.id,
          label: record.path,
          navLabel: record.path.slice(documentPlaceOf(record.path)?.[2].length),
          href: hrefOf('documents', record.id),
          group: title,
          record,
        })),
    ),
  },
];

/** 이동해 가는 곳. 아이콘은 `components/ui/view-icons.ts` 가 `id` 로 고른다. */
export type ViewId = 'overview' | 'architecture' | SectionId;

export type View = { id: 'overview' | 'architecture'; label: string; path: string };

/** 섹션이 없는 보기. 탐색기 맨 위에 이 순서로 선다. */
export const VIEWS: View[] = [
  { id: 'overview', label: '개요', path: '/' },
  { id: 'architecture', label: '아키텍처', path: '/architecture' },
];

export const findSection = (id: SectionId): Section =>
  SECTIONS.find((section) => section.id === id) as Section;

export const findEntity = (section: SectionId, id: string): Entity | undefined =>
  findSection(section).entities.find((entity) => entity.id === id);

/**
 * ID 가 가리키는 화면과 이름. 관계의 양 끝이나 흐름 단계의 담당처럼 종류를 모를 때.
 * 패키지 · 플러그인은 자기 화면으로, 앱 · 도구는 자기 화면이 없어 아키텍처 그림의 그 노드로 간다.
 * 플러그인은 같은 id 의 도구보다 먼저 — 소비자가 쓰는 표면이 그 화면에 있다.
 */
export const linkOf = (id: string): { href: string; label: string } | undefined => {
  if (id === catalog.repository.id)
    return { href: '/', label: `${catalog.repository.name} 저장소` };
  const pkg = findEntity('packages', id);
  if (pkg) return pkg;
  const plugin = findEntity('plugins', id);
  if (plugin) return plugin;
  const app = catalog.applications.find((candidate) => candidate.id === id);
  if (app) return { href: entityHref('application', app.id), label: app.id };
  const tool = catalog.tools.find((candidate) => candidate.id === id);
  return tool && { href: entityHref('tool', tool.id), label: tool.name };
};
