import { InspectorSection, Pager, RecordMeta } from '@berrypjh/devhub-ui';
import { List } from '@berrypjh/react-ui';

import { catalog } from '@/data';
import { commandLine } from '@/domain/commands';
import type { RecordRef } from '@/domain/model';
import { RECORDS_NEWEST_FIRST } from '@/lib/catalog/entities';
import { RECORD_KIND } from '@/lib/catalog/labels';
import { recordHref } from '@/lib/catalog/routes';

import { FileRow } from '../source/file-row';

import { DocumentRows, SourceGroups, TestRows } from './inspector-parts';

const SECTIONS = [
  ['overview', '개요'],
  ['source', '소스'],
  ['documents', '문서'],
  ['tests', '테스트'],
] as const;

const TITLE = Object.fromEntries(SECTIONS) as Record<(typeof SECTIONS)[number][0], string>;
const idOf = (key: string) => `record-${key}`;

/**
 * 기록의 근거 칸: 원문, 이 기록이 다루는 파일, 규칙을 지금 담고 있는 문서, 지키는 테스트.
 * 섹션은 늘 같은 순서로 보이고 비면 이유를 쓴다. 이전 · 다음은 최신순이다.
 */
export const RecordInspector = ({ record }: { record: RecordRef }) => {
  const siblings = RECORDS_NEWEST_FIRST.map((r) => ({
    id: r.id,
    label: r.title,
    href: recordHref(r.id),
  }));
  const documents = record.docs.flatMap((id) => catalog.documents.find((d) => d.id === id) ?? []);
  const tests = record.tests.flatMap((id) => {
    const suite = catalog.tests.find((s) => s.id === id);
    const command = suite && catalog.commands.find((c) => c.id === suite.command);
    return suite ? [{ suite, line: command ? commandLine(command) : null }] : [];
  });
  return (
    <div className="flex flex-col divide-y divide-stroke-light">
      <header className="flex flex-col gap-sm pb-lg">
        <div className="flex items-center justify-between gap-sm">
          <p className="typo-caption-small text-text-light">기록</p>
          <Pager entities={siblings} current={record.id} unit="기록" />
        </div>
        <h2 className="typo-body-medium-strong">{record.title}</h2>
        <RecordMeta date={record.date} kind={RECORD_KIND[record.kind]} />
        <nav aria-label="기록 상세 목차">
          <ul className="flex flex-wrap gap-x-md gap-y-xs">
            {SECTIONS.map(([key, title]) => (
              <li key={key}>
                <a
                  href={`#${idOf(key)}`}
                  className="typo-caption-small text-text-link underline-offset-2 hover:underline"
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <InspectorSection id={idOf('overview')} title={TITLE.overview}>
        <p className="typo-body-small">{record.summary}</p>
        <List className="flex flex-col gap-sm">
          <FileRow source={{ path: record.path }} label="원문" />
        </List>
      </InspectorSection>

      <InspectorSection id={idOf('source')} title={TITLE.source} count={record.sources.length}>
        <SourceGroups refs={record.sources} empty="이 기록이 가리키는 파일이 없다" />
      </InspectorSection>

      <InspectorSection id={idOf('documents')} title={TITLE.documents} count={documents.length}>
        <DocumentRows items={documents} empty="이 기록이 정한 것을 지금 담은 문서가 없다" />
      </InspectorSection>

      <InspectorSection id={idOf('tests')} title={TITLE.tests} count={tests.length}>
        <TestRows
          items={tests}
          empty="이 기록을 지키는 테스트 묶음이 카탈로그에 없다. 확인 방법은 본문의 검증 절에"
        />
      </InspectorSection>
    </div>
  );
};
