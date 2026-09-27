import { catalog } from '../../data';
import type {
  ConsumerJourney,
  DocumentRef,
  Package,
  PackageKind,
  RecordRef,
} from '../../domain/model';

import { ACTOR, DOCUMENT_GROUP, PACKAGE_KIND, RECORD_KIND, ROOT_DOCUMENT_GROUP } from './labels';
import { entityHref } from './routes';

/**
 * 탐색의 단일 출처. 상단 바 "보기", 탐색기, 좁은 화면 서랍, route 가 모두 여기서 읽는다.
 * 항목은 카탈로그에서 만든다 — 손으로 적은 목록이 없다.
 */

export const PRODUCT_NAME = 'Shared Stack DevHub';

export type SectionId = 'journeys' | 'packages' | 'documents' | 'records';

type EntityBase = { id: string; label: string; href: string; group?: string };

export type Entity =
  | (EntityBase & { section: 'journeys'; record: ConsumerJourney })
  | (EntityBase & { section: 'packages'; record: Package })
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

const DOCUMENT_GROUP_ORDER = [
  ROOT_DOCUMENT_GROUP,
  ...new Set(DOCUMENT_GROUP.map(([, title]) => title)),
];

/** 문서의 묶음. 어느 접두사에도 맞지 않으면 `undefined` 라 목록에서 빠진다(테스트가 막는다). */
export const documentGroupOf = (path: string) =>
  path.includes('/')
    ? DOCUMENT_GROUP.find(([prefix]) => path.startsWith(prefix))?.[1]
    : ROOT_DOCUMENT_GROUP;

/** 기록은 최신순으로 읽는다. 같은 날짜는 적힌 순서를 그대로 둔다. */
export const RECORDS_NEWEST_FIRST: RecordRef[] = [...catalog.records].sort((a, b) =>
  b.date.localeCompare(a.date),
);

export const SECTIONS: Section[] = [
  {
    id: 'journeys',
    title: '소비 흐름',
    path: '/journeys',
    entities: (['consumer', 'maintainer'] as const).flatMap((actor) =>
      catalog.journeys
        .filter((record) => record.actor === actor)
        .map((record) => ({
          section: 'journeys' as const,
          id: record.id,
          label: record.title,
          href: hrefOf('journeys', record.id),
          group: ACTOR[actor],
          record,
        })),
    ),
  },
  {
    id: 'records',
    title: '기록',
    path: '/records',
    entities: (Object.keys(RECORD_KIND) as RecordRef['kind'][]).flatMap((kind) =>
      RECORDS_NEWEST_FIRST.filter((record) => record.kind === kind).map((record) => ({
        section: 'records' as const,
        id: record.id,
        label: record.title,
        href: hrefOf('records', record.id),
        group: RECORD_KIND[kind],
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
          href: hrefOf('documents', record.id),
          group: title,
          record,
        })),
    ),
  },
];

/** 최상위 보기. 섹션이 없는 보기(개요 · 아키텍처) 다음에 섹션마다 보기 하나. 아이콘은 `components/ui/view-icons.ts` 가 `id` 로 고른다. */
export type ViewId = 'overview' | 'architecture' | 'evaluation' | SectionId;

export type View = { id: ViewId; label: string; path: string; section?: SectionId };

const viewOf = (section: Section): View => ({
  id: section.id,
  label: section.title,
  path: section.path,
  section: section.id,
});

const sectionOf = (id: SectionId) => SECTIONS.find((section) => section.id === id) as Section;

/**
 * 상단 바 순서. 개요 · 소비 흐름 · 아키텍처 · 평가 다음에 패키지 · 문서 · 기록이다.
 * 탐색기(`SECTIONS`)는 흐름 바로 다음에 기록을 두어 최근 결정이 먼저 보이고, 상단 바는 문서 옆에 기록을 둔다.
 */
export const VIEWS: View[] = [
  { id: 'overview', label: '개요', path: '/' },
  viewOf(sectionOf('journeys')),
  { id: 'architecture', label: '아키텍처', path: '/architecture' },
  { id: 'evaluation', label: '평가', path: '/evaluation' },
  ...(['packages', 'documents', 'records'] as const).map((id) => viewOf(sectionOf(id))),
];

export const findSection = (id: SectionId): Section =>
  SECTIONS.find((section) => section.id === id) as Section;

export const findEntity = (section: SectionId, id: string): Entity | undefined =>
  findSection(section).entities.find((entity) => entity.id === id);

/**
 * ID 가 가리키는 화면과 이름. 관계의 양 끝이나 흐름 단계의 담당처럼 종류를 모를 때.
 * 패키지는 자기 화면으로, 앱 · 도구는 자기 화면이 없어 아키텍처 그림의 그 노드로 간다.
 */
export const linkOf = (id: string): { href: string; label: string } | undefined => {
  const pkg = findEntity('packages', id);
  if (pkg) return pkg;
  const app = catalog.applications.find((candidate) => candidate.id === id);
  if (app) return { href: entityHref('application', app.id), label: app.id };
  const tool = catalog.tools.find((candidate) => candidate.id === id);
  return tool && { href: entityHref('tool', tool.id), label: tool.name };
};
