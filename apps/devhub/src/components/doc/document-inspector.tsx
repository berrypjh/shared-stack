import { Empty, INSPECTOR_ID, InspectorSection } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { catalog } from '@/data';
import type { DocumentRef } from '@/domain/model';
import { citationsOf } from '@/lib/catalog/document-citations';

import { stepHref } from '../flow/presentation';
import { FileRow } from '../source/file-row';
import { EntityLink, LINK } from '../ui/entity-link';

/**
 * 문서의 근거 칸: 원문(스냅샷 고정 링크 · 경로 복사), 이 문서를 드는 항목과 흐름 단계, 기록된 깨진 링크.
 * 역참조는 카탈로그의 `docs` 에서만 온다.
 */
export const DocumentInspector = ({ doc }: { doc: DocumentRef }) => {
  const { entities, steps } = citationsOf(catalog, doc.id);
  const broken = doc.brokenLinks ?? [];
  return (
    <div className="flex flex-col divide-y divide-stroke-light">
      <header className="flex flex-col gap-sm pb-lg">
        <p className="typo-caption-small text-text-light">문서</p>
        <h2 className="typo-body-medium-strong break-all">{doc.title}</h2>
        <List className="flex flex-col gap-sm">
          <FileRow source={{ path: doc.path }} label="원문" />
        </List>
      </header>

      <InspectorSection id="document-entities" title="이 문서를 드는 항목" count={entities.length}>
        {entities.length ? (
          <List className="flex flex-col gap-xs typo-body-small">
            {entities.map((id) => (
              <ListItem key={id}>
                <EntityLink id={id} hash={INSPECTOR_ID} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Empty reason="앱 · 패키지 · 도구 중 이 문서를 근거로 드는 것이 없다" />
        )}
      </InspectorSection>

      <InspectorSection id="document-steps" title="이 문서를 드는 흐름 단계" count={steps.length}>
        {steps.length ? (
          <List className="flex flex-col gap-xs typo-body-small">
            {steps.map((step) => (
              <ListItem key={`${step.journeyId}/${step.stepId}`} className="flex flex-col">
                <Link
                  to={`${stepHref(step.journeyId, step.stepId)}#${INSPECTOR_ID}`}
                  className={LINK}
                >
                  {step.order}. {step.intent}
                </Link>
                <span className="typo-caption-small text-text-light">{step.journeyTitle}</span>
              </ListItem>
            ))}
          </List>
        ) : (
          <Empty reason="어느 흐름 단계도 이 문서를 근거로 들지 않는다" />
        )}
      </InspectorSection>

      <InspectorSection id="document-broken" title="깨진 링크" count={broken.length}>
        {broken.length ? (
          <List className="flex flex-col gap-xs">
            {broken.map((link) => (
              <ListItem key={link.href} className="flex flex-col gap-2xs">
                <code className="devhub-code">{link.href}</code>
                <span className="typo-caption-small text-text-warning">{link.note}</span>
              </ListItem>
            ))}
          </List>
        ) : (
          <Empty reason="이 문서의 저장소 안 링크는 모두 대상이 있다(테스트가 확인한다)" />
        )}
      </InspectorSection>
    </div>
  );
};
