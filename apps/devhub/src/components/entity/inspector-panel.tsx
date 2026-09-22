import { Empty, INSPECTOR_ID, InspectorSection, Pager } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import { catalog } from '@/data';
import type { Entity } from '@/lib/catalog/entities';
import type { Inspection, RelationItem } from '@/lib/catalog/inspection';
import { GAP_KIND, PLATFORM, RELATION_KIND } from '@/lib/catalog/labels';
import { groupByOwner } from '@/lib/catalog/reference-groups';

import { FileRow } from '../source/file-row';
import { EntityLink } from '../ui/entity-link';

import { CommandRows, DocumentRows, SourceGroups, TestRows } from './inspector-parts';

const SECTIONS = [
  ['overview', '개요'],
  ['visibility', '공개 여부 · 플랫폼'],
  ['exports', '진입점'],
  ['relations', '위 · 아래'],
  ['artifacts', '생성물'],
  ['commands', '명령'],
  ['source', '소스'],
  ['documents', '문서'],
  ['tests', '테스트'],
  ['related', '관련 항목'],
] as const;

type SectionKey = (typeof SECTIONS)[number][0];
const TITLE = Object.fromEntries(SECTIONS) as Record<SectionKey, string>;
const KIND = { application: '애플리케이션', package: '패키지', tool: '도구' } as const;

const Section = ({
  id,
  count,
  children,
}: {
  id: SectionKey;
  count?: number;
  children: ReactNode;
}) => (
  <InspectorSection id={`inspector-${id}`} title={TITLE[id]} count={count}>
    {children}
  </InspectorSection>
);

/** 관계 한 줄: 상대 항목(상세 정보로 이어지는 링크) · 종류 · 근거 파일. */
const RelationRows = ({ items, empty }: { items: RelationItem[]; empty: string }) =>
  items.length ? (
    <List className="flex flex-col gap-sm">
      {items.map(({ relation, other }) => (
        <ListItem key={relation.id} className="flex flex-col gap-2xs typo-body-small">
          <span>
            <EntityLink id={other} hash={INSPECTOR_ID} />{' '}
            <span className="text-text-light">· {RELATION_KIND[relation.kind]}</span>
          </span>
          {relation.kind === 'generated-artifact' && (
            <span className="devhub-code text-text-light">{relation.artifacts.join(' · ')}</span>
          )}
          {relation.kind === 'verification' && (
            <span className="typo-caption-small text-text-light">{relation.summary}</span>
          )}
          <span className="devhub-code text-text-light">근거 {relation.evidence.path}</span>
        </ListItem>
      ))}
    </List>
  ) : (
    <Empty reason={empty} />
  );

const Overview = ({ inspection }: { inspection: Inspection }) => {
  const { overview } = inspection;
  return (
    <Section id="overview">
      <p className="typo-body-small">{inspection.purpose}</p>
      <List className="flex flex-col gap-sm">
        <FileRow source={overview.root} label="위치" />
      </List>
      <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-md gap-y-xs typo-body-small">
        <dt className="text-text-light">Nx 프로젝트</dt>
        <dd className="devhub-code">
          {overview.nxProject ?? (
            <span className="font-sans text-text-light">없음 — Nx 프로젝트가 아니다</span>
          )}
        </dd>
        <dt className="text-text-light">패키지 이름</dt>
        <dd className="devhub-code">
          {overview.packageName ?? (
            <span className="font-sans text-text-light">없음 — package.json 이 없다</span>
          )}
        </dd>
      </dl>
      {overview.gaps.length > 0 && (
        <List className="flex flex-col gap-xs">
          {overview.gaps.map((gap) => (
            <ListItem key={gap.note} className="typo-caption-small text-text-warning">
              {GAP_KIND[gap.kind]} — {gap.note}
            </ListItem>
          ))}
        </List>
      )}
    </Section>
  );
};

const VisibilitySection = ({ inspection }: { inspection: Inspection }) => {
  const { visibility } = inspection;
  return (
    <Section id="visibility">
      {visibility.value === null ? (
        <Empty reason={visibility.reason} />
      ) : (
        <>
          <p className="typo-body-small">
            {visibility.value === 'public' ? (
              <>
                <strong>공개</strong> — package.json 에 private 이 없어 npm 에 배포된다
              </>
            ) : (
              <>
                <strong>Internal</strong> — package.json 의 private: true. 배포되지 않고
                워크스페이스 안에서만 쓴다
              </>
            )}
          </p>
          <List className="flex flex-col gap-sm">
            <FileRow source={visibility.evidence} label="근거" />
          </List>
        </>
      )}
      <p className="typo-body-small">플랫폼: {PLATFORM[inspection.platform]}</p>
    </Section>
  );
};

/**
 * 진입점은 package.json `exports`(없으면 main · files)에서만 온다. 빌드 산출물 경로는 위치를 알리는
 * 글일 뿐 import 대상이 아니다 — 소비자는 specifier 로만 쓴다.
 */
const ExportsSection = ({ inspection }: { inspection: Inspection }) => {
  const { exports } = inspection;
  if ('reason' in exports) {
    return (
      <Section id="exports">
        <Empty reason={exports.reason} />
      </Section>
    );
  }
  return (
    <Section id="exports" count={exports.entries.length}>
      <p className="typo-caption-small text-text-light">
        {exports.visibility === 'public'
          ? '소비자가 import 하는 specifier 다. dist 안의 다른 파일을 직접 import 하지 않는다.'
          : 'Internal — 워크스페이스 안에서만 import 한다. 배포되지 않아 소비자 API 가 아니다.'}
      </p>
      <List className="flex flex-col gap-sm">
        {exports.entries.map((entry) => (
          <ListItem key={entry.specifier} className="flex flex-col gap-2xs">
            <code className="font-mono typo-body-small break-all">{entry.specifier}</code>
            <span className="typo-caption-small text-text-light">
              {entry.origin === 'build-output' ? '빌드 산출물 — 커밋되지 않는다' : '커밋된 파일'} ·{' '}
              <span className="devhub-code">{entry.target}</span>
            </span>
          </ListItem>
        ))}
      </List>
      <List className="flex flex-col gap-sm">
        <FileRow source={exports.manifest} label="exports 정의" />
        {exports.barrel && <FileRow source={exports.barrel} label="`.` 이 내보내는 것" />}
        {exports.guard && <FileRow source={exports.guard} label="표면 고정 테스트" />}
      </List>
    </Section>
  );
};

const SourceSection = ({ inspection }: { inspection: Inspection }) => (
  <Section
    id="source"
    count={groupByOwner(catalog, inspection.source).reduce((n, g) => n + g.refs.length, 0)}
  >
    <SourceGroups refs={inspection.source} />
  </Section>
);

/**
 * 오른쪽 칸: 고른 항목의 근거. 섹션은 늘 같은 순서로 모두 보이고, 비면 이유를 쓴다.
 * 관계 · 이전/다음 링크는 `#devhub-inspector` 로 이어져 이동한 뒤에도 이 칸에 머문다.
 */
export const InspectorPanel = ({
  inspection,
  siblings,
  unit,
}: {
  inspection: Inspection;
  siblings: Entity[];
  unit: string;
}) => (
  <div className="flex flex-col divide-y divide-stroke-light">
    <header className="flex flex-col gap-sm pb-lg">
      <div className="flex items-center justify-between gap-sm">
        <p className="typo-caption-small text-text-light">{KIND[inspection.kind]}</p>
        <Pager entities={siblings} current={inspection.id} unit={unit} />
      </div>
      <h2 className="typo-body-medium-strong break-all">{inspection.title}</h2>
      <p className="flex flex-wrap gap-x-md typo-caption-small">
        {inspection.visibility.value && (
          <span className="rounded-sm border border-stroke-default px-xs">
            {inspection.visibility.value === 'public' ? '공개(배포)' : 'Internal'}
          </span>
        )}
        <span className="text-text-light">{PLATFORM[inspection.platform]}</span>
      </p>
      <nav aria-label="상세 목차">
        <ul className="flex flex-wrap gap-x-md gap-y-xs">
          {SECTIONS.map(([id, title]) => (
            <li key={id}>
              <a
                href={`#inspector-${id}`}
                className="typo-caption-small text-text-link underline-offset-2 hover:underline"
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>

    <Overview inspection={inspection} />
    <VisibilitySection inspection={inspection} />
    <ExportsSection inspection={inspection} />
    <Section id="relations" count={inspection.upstream.length + inspection.downstream.length}>
      <h4 className="typo-caption-small text-text-light">기대는 쪽 (위)</h4>
      <RelationRows items={inspection.upstream} empty={inspection.empty.upstream} />
      <h4 className="typo-caption-small text-text-light">기대오는 쪽 (아래)</h4>
      <RelationRows items={inspection.downstream} empty={inspection.empty.downstream} />
    </Section>
    <Section id="artifacts" count={inspection.artifacts.length}>
      <RelationRows items={inspection.artifacts} empty={inspection.empty.artifacts} />
    </Section>
    <Section id="commands" count={inspection.commands.length}>
      <CommandRows items={inspection.commands} empty={inspection.empty.commands} />
    </Section>
    <SourceSection inspection={inspection} />
    <Section id="documents" count={inspection.documents.length}>
      <DocumentRows items={inspection.documents} empty={inspection.empty.documents} />
    </Section>
    <Section id="tests" count={inspection.tests.length}>
      <TestRows items={inspection.tests} empty={inspection.empty.tests} />
    </Section>
    <Section id="related" count={inspection.related.length}>
      <RelationRows items={inspection.related} empty={inspection.empty.related} />
    </Section>
  </div>
);
