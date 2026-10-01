import { Empty, Facts, INSPECTOR_ID, InspectorHeader, InspectorSection } from '@berrypjh/devhub-ui';

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { catalog } from '@/data';
import type { DocumentRef } from '@/domain/model';
import { citationsOf } from '@/lib/catalog/document-citations';
import { stepHref } from '@/lib/catalog/routes';
import { titleText } from '@/lib/markdown/documents';

import { SourceGroups } from '../entity/inspector-parts';
import { EntityLink, LINK } from '../ui/entity-link';

const OVERVIEW = { id: 'document-overview', title: '개요', icon: 'overview' } as const;
const SOURCE = { id: 'document-source', title: '소스', icon: 'source' } as const;
const DOCS = { id: 'document-documents', title: '문서', icon: 'document' } as const;
const TESTS = { id: 'document-tests', title: '테스트', icon: 'test' } as const;

/** 빈 목록 대신 한 줄의 이유. 사실 표 안에서도 비었다는 것을 숨기지 않는다. */
const orNone = (items: ReactNode[], reason: string) =>
  items.length
    ? items
    : [
        <span key="none" className="text-text-light">
          없음 — {reason}
        </span>,
      ];

/**
 * 문서의 근거 칸. 다른 항목과 같은 네 구획이다: 개요(인용한 항목 · 흐름 단계 · 깨진 링크),
 * 소스(문서 파일), 문서 · 테스트(문서 자체라 없음). 역참조는 카탈로그의 `docs` 에서만 온다.
 */
export const DocumentInspector = ({ doc }: { doc: DocumentRef }) => {
  const { entities, steps } = citationsOf(catalog, doc.id);
  const broken = doc.brokenLinks ?? [];
  return (
    <div className="flex flex-col divide-y divide-stroke-light">
      <InspectorHeader
        kind="문서"
        title={titleText(doc)}
        sections={[OVERVIEW, SOURCE, DOCS, TESTS]}
      />

      <InspectorSection {...OVERVIEW}>
        <Facts
          facts={[
            {
              term: '인용한 항목',
              details: orNone(
                entities.map((id) => <EntityLink key={id} id={id} hash={INSPECTOR_ID} />),
                '앱 · 패키지 · 도구 중 이 문서를 근거로 드는 것이 없음',
              ),
            },
            {
              term: '인용한 흐름 단계',
              details: orNone(
                steps.map((step) => (
                  <span key={`${step.journeyId}/${step.stepId}`} className="flex flex-col">
                    <Link
                      to={`${stepHref(step.journeyId, step.stepId)}#${INSPECTOR_ID}`}
                      className={LINK}
                    >
                      {step.order}. {step.intent}
                    </Link>
                    <span className="typo-caption-small text-text-light">{step.journeyTitle}</span>
                  </span>
                )),
                '어느 흐름 단계도 이 문서를 근거로 들지 않음',
              ),
            },
            {
              term: '깨진 링크',
              details: orNone(
                broken.map((link) => (
                  <span key={link.href} className="flex flex-col gap-2xs">
                    <code className="devhub-code break-all">{link.href}</code>
                    <span className="typo-caption-small text-text-warning">{link.note}</span>
                  </span>
                )),
                '저장소 안 링크는 모두 대상이 있음(테스트가 확인함)',
              ),
            },
          ]}
        />
      </InspectorSection>

      <InspectorSection {...SOURCE} count={1}>
        <SourceGroups refs={[{ path: doc.path }]} />
      </InspectorSection>

      <InspectorSection {...DOCS} count={0}>
        <Empty reason="문서 자체" />
      </InspectorSection>

      <InspectorSection {...TESTS} count={0}>
        <Empty reason="이 문서만 겨냥한 테스트 묶음이 없음. 저장소 안 링크는 카탈로그 테스트가 확인함" />
      </InspectorSection>
    </div>
  );
};
