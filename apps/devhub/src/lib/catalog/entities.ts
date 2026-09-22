import { catalog } from '../../data';
import type {
  Application,
  ConsumerJourney,
  DocumentRef,
  Package,
  PackageKind,
  RecordRef,
  Tool,
} from '../../domain/model';

import { ACTOR, PACKAGE_KIND } from './labels';

/**
 * 탐색의 단일 출처. 상단 바 "보기", 탐색기, 좁은 화면 서랍, route 가 모두 여기서 읽는다.
 * 항목은 카탈로그에서 만든다 — 손으로 적은 목록이 없다.
 */

export const PRODUCT_NAME = 'Shared Stack DevHub';

export type SectionId =
  | 'journeys'
  | 'applications'
  | 'packages'
  | 'documents'
  | 'records'
  | 'engineering';

type EntityBase = { id: string; label: string; href: string; group?: string };

export type Entity =
  | (EntityBase & { section: 'journeys'; record: ConsumerJourney })
  | (EntityBase & { section: 'applications'; record: Application })
  | (EntityBase & { section: 'packages'; record: Package })
  | (EntityBase & { section: 'engineering'; record: Tool })
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
    entities: RECORDS_NEWEST_FIRST.map((record) => ({
      section: 'records',
      id: record.id,
      label: record.title,
      href: hrefOf('records', record.id),
      record,
    })),
  },
  {
    id: 'applications',
    title: '애플리케이션',
    path: '/applications',
    entities: catalog.applications.map((record) => ({
      section: 'applications',
      id: record.id,
      label: record.id,
      href: hrefOf('applications', record.id),
      record,
    })),
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
    entities: catalog.documents.map((record) => ({
      section: 'documents',
      id: record.id,
      label: record.path,
      href: hrefOf('documents', record.id),
      record,
    })),
  },
  {
    id: 'engineering',
    title: '엔지니어링',
    path: '/engineering',
    entities: catalog.tools.map((record) => ({
      section: 'engineering',
      id: record.id,
      label: record.name,
      href: hrefOf('engineering', record.id),
      record,
    })),
  },
];

/** 최상위 보기. 섹션이 없는 보기(개요 · 아키텍처) 다음에 섹션마다 보기 하나. 아이콘은 `components/ui/view-icons.ts` 가 `id` 로 고른다. */
export type ViewId = 'overview' | 'architecture' | SectionId;

export type View = { id: ViewId; label: string; path: string; section?: SectionId };

const viewOf = (section: Section): View => ({
  id: section.id,
  label: section.title,
  path: section.path,
  section: section.id,
});

const sectionOf = (id: SectionId) => SECTIONS.find((section) => section.id === id) as Section;

/**
 * 상단 바 순서. 개요 · 소비 흐름 · 아키텍처 다음에 항목 · 문서 · 기록 · 엔지니어링이다.
 * 탐색기(`SECTIONS`)는 흐름 바로 다음에 기록을 두어 최근 결정이 먼저 보이고, 상단 바는 문서 옆에 기록을 둔다.
 */
export const VIEWS: View[] = [
  { id: 'overview', label: '개요', path: '/' },
  viewOf(sectionOf('journeys')),
  { id: 'architecture', label: '아키텍처', path: '/architecture' },
  ...(['applications', 'packages', 'documents', 'records', 'engineering'] as const).map((id) =>
    viewOf(sectionOf(id)),
  ),
];

export const findSection = (id: SectionId): Section =>
  SECTIONS.find((section) => section.id === id) as Section;

export const findEntity = (section: SectionId, id: string): Entity | undefined =>
  findSection(section).entities.find((entity) => entity.id === id);

/** 앱 · 패키지 · 도구를 ID 로 찾는다. 관계의 양 끝이나 흐름 단계의 담당처럼 섹션을 모를 때. */
export const entityById = (id: string): Entity | undefined =>
  SECTIONS.flatMap((section) => section.entities).find(
    (entity) =>
      entity.section !== 'documents' &&
      entity.section !== 'records' &&
      entity.section !== 'journeys' &&
      entity.id === id,
  );
