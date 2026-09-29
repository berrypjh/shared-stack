import { Facts, InspectorHeader, InspectorSection, Pager } from '@berrypjh/devhub-ui';

import { catalog } from '@/data';
import type { RecordRef } from '@/domain/model';
import { RECORDS_NEWEST_FIRST } from '@/lib/catalog/entities';
import { RECORD_KIND } from '@/lib/catalog/labels';
import { recordHref } from '@/lib/catalog/routes';

import {
  countByRunner,
  DocumentRows,
  SourceGroups,
  sourceSummary,
  TestRows,
} from './inspector-parts';

const OVERVIEW = { id: 'record-overview', title: '개요', icon: 'overview' } as const;
const SOURCE = { id: 'record-source', title: '소스', icon: 'source' } as const;
const DOCS = { id: 'record-documents', title: '문서', icon: 'document' } as const;
const TESTS = { id: 'record-tests', title: '테스트', icon: 'test' } as const;

/**
 * 기록의 근거 칸: 종류 · 날짜 · 요약, 원문과 이 기록이 다루는 파일, 규칙을 지금 담고 있는 문서,
 * 지키는 테스트. 섹션은 늘 같은 순서로 보이고 비면 이유를 쓴다. 이전 · 다음은 최신순이다.
 */
export const RecordInspector = ({ record }: { record: RecordRef }) => {
  const siblings = RECORDS_NEWEST_FIRST.map((r) => ({
    id: r.id,
    label: r.title,
    href: recordHref(r.id),
  }));
  const documents = record.docs.flatMap((id) => catalog.documents.find((d) => d.id === id) ?? []);
  const tests = record.tests.flatMap((id) => catalog.tests.find((s) => s.id === id) ?? []);
  const sources = [{ path: record.path }, ...record.sources];
  return (
    <div className="flex flex-col divide-y divide-stroke-light">
      <InspectorHeader
        kind="기록"
        title={record.title}
        pager={<Pager entities={siblings} current={record.id} unit="기록" />}
        sections={[OVERVIEW, SOURCE, DOCS, TESTS]}
        contentsLabel="기록 상세 목차"
      />

      <InspectorSection {...OVERVIEW}>
        <Facts
          facts={[
            { term: '종류', detail: RECORD_KIND[record.kind] },
            { term: '날짜', detail: <time dateTime={record.date}>{record.date}</time> },
            { term: '요약', detail: record.summary },
          ]}
        />
      </InspectorSection>

      <InspectorSection {...SOURCE} count={sources.length} summary={sourceSummary(sources)}>
        <SourceGroups refs={sources} />
      </InspectorSection>

      <InspectorSection {...DOCS} count={documents.length}>
        <DocumentRows items={documents} empty="이 기록이 정한 것을 지금 담은 문서가 없음" />
      </InspectorSection>

      <InspectorSection {...TESTS} count={tests.length} summary={countByRunner(tests)}>
        <TestRows
          items={tests}
          empty="이 기록을 지키는 테스트 묶음이 카탈로그에 없음. 확인 방법은 본문의 검증 절에"
        />
      </InspectorSection>
    </div>
  );
};
