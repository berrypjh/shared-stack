import { Facts, InspectorHeader, InspectorSection, Pager } from '@berrypjh/devhub-ui';
import { Chip, List, ListItem } from '@berrypjh/react-ui';

import { catalog } from '@/data';
import { testsOf, verifiersOf } from '@/domain/graph';
import type { DocumentRef, Plugin, Tool } from '@/domain/model';
import type { Entity } from '@/lib/catalog/entities';
import { groupByOwner } from '@/lib/catalog/reference-groups';

import {
  countByRunner,
  DocumentRows,
  SourceGroups,
  sourceSummary,
  TestRows,
} from '../entity/inspector-parts';
import { FileRow } from '../source/file-row';
import { EntityLink } from '../ui/entity-link';

const OVERVIEW = { id: 'inspector-overview', title: '개요', icon: 'overview' } as const;
const SOURCE = { id: 'inspector-source', title: '소스', icon: 'source' } as const;
const DOCS = { id: 'inspector-documents', title: '문서', icon: 'document' } as const;
const TESTS = { id: 'inspector-tests', title: '테스트', icon: 'test' } as const;

/**
 * 플러그인의 근거 — 패키지 상세 정보와 같은 문법이다. 개요는 요약 · 분류 · 키워드와 위치,
 * 소스는 플러그인이 싣는 파일(매니페스트 · 스크립트 · 설정 예시)과 같은 id 의 도구가 드는 근거를 한 목록으로 합친 것이다.
 * 테스트에는 이 플러그인을 검증하는 도구도 잇는다 — 화면에 관계 절이 없어 여기가 그 자리다.
 * 섹션은 늘 같은 순서로 모두 보이고, 비면 이유를 쓴다.
 */
export const PluginInspector = ({
  plugin,
  tool,
  siblings,
}: {
  plugin: Plugin;
  tool: Tool;
  siblings: Entity[];
}) => {
  const documents = plugin.docs
    .map((id) => catalog.documents.find((doc) => doc.id === id))
    .filter((doc): doc is DocumentRef => Boolean(doc));
  const tests = testsOf(catalog, plugin.id);
  const verifiers = verifiersOf(catalog, plugin.id);
  const source = [plugin.manifest, ...plugin.scripts, ...plugin.examples, ...tool.source];
  const sourceCount = groupByOwner(catalog, source).reduce((n, g) => n + g.refs.length, 0);
  return (
    <div className="flex flex-col divide-y divide-stroke-light">
      <InspectorHeader
        kind="플러그인"
        title={plugin.id}
        pager={<Pager entities={siblings} current={plugin.id} unit="플러그인" />}
        sections={[OVERVIEW, SOURCE, DOCS, TESTS]}
      >
        <p className="typo-caption-small text-text-light">
          v{plugin.version} · {plugin.marketplace}
        </p>
      </InspectorHeader>
      <InspectorSection {...OVERVIEW}>
        <Facts
          facts={[
            { term: '요약', detail: plugin.description },
            { term: '분류', detail: <span className="devhub-code">{plugin.category}</span> },
            {
              term: '키워드',
              detail: (
                <List className="flex flex-wrap gap-xs">
                  {plugin.keywords.map((keyword) => (
                    <ListItem key={keyword}>
                      <Chip size="sm">{keyword}</Chip>
                    </ListItem>
                  ))}
                </List>
              ),
            },
          ]}
        />
        <List className="flex flex-col gap-sm">
          <FileRow source={{ path: plugin.root, directory: true }} label="위치" />
        </List>
      </InspectorSection>
      <InspectorSection {...SOURCE} count={sourceCount} summary={sourceSummary(source)}>
        <SourceGroups refs={source} />
      </InspectorSection>
      <InspectorSection {...DOCS} count={documents.length}>
        <DocumentRows items={documents} empty="이 플러그인을 설명하는 문서가 카탈로그에 없다" />
      </InspectorSection>
      <InspectorSection {...TESTS} count={tests.length} summary={countByRunner(tests)}>
        <TestRows items={tests} empty="이 플러그인을 직접 대상으로 하는 테스트 묶음이 없다" />
        {verifiers.length > 0 && (
          <p className="flex flex-wrap gap-x-sm typo-body-small">
            <span className="text-text-light">검증하는 쪽</span>
            {verifiers.map((relation) => (
              <EntityLink key={relation.id} id={relation.from} />
            ))}
          </p>
        )}
      </InspectorSection>
    </div>
  );
};
