import {
  Inspector,
  useDocumentTitle,
  WorkspaceFrame,
  WorkspaceHeader,
  WorkspaceSection,
} from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link, useParams } from 'react-router-dom';

import { FileRow } from '@/components/source/file-row';
import { LINK } from '@/components/ui/entity-link';
import { catalog } from '@/data';
import { CITATION_KIND } from '@/lib/catalog/labels';
import { symbolAnchor } from '@/lib/catalog/routes';
import { sourceUsage } from '@/lib/repository/source-usage';

const USAGE = sourceUsage(catalog);

/** `/sources/<경로>` 의 경로. 각 부분을 풀어 저장소 경로로. */
const pathOf = (splat: string) => splat.split('/').map(decodeURIComponent).join('/');

const NotCited = ({ path }: { path: string }) => {
  useDocumentTitle('인용하지 않는 경로');
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader eyebrow="소스" icon="document" title="카탈로그가 인용하지 않는 경로" />
        <p className="typo-body-small">
          <span className="devhub-code">{path}</span> 는 카탈로그 어디에도 근거로 나오지 않습니다.
          경로가 바뀌었거나 인용되지 않은 파일입니다.
        </p>
        <Link to="/" className={`typo-body-small ${LINK}`}>
          개요로 가기
        </Link>
      </WorkspaceFrame>
      <Inspector />
    </>
  );
};

/**
 * 저장소 경로 하나: 그 경로를 인용하는 자리, 인용된 symbol(각각 `#symbol-이름` 으로 온다), 인용 글자.
 * 상세 정보 칸은 원문 링크(스냅샷 고정) · 경로 복사다. 파일 내용은 싣지 않는다.
 */
export const SourcePage = () => {
  const path = pathOf(useParams()['*'] ?? '');
  const usage = USAGE.get(path);
  useDocumentTitle(`${path} · 소스`);
  if (!usage) return <NotCited path={path} />;

  const kinds = [...new Set(usage.citations.map((c) => c.kind))];
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader
          eyebrow={usage.directory ? '소스 디렉터리' : '소스 파일'}
          icon="document"
          title={usage.path}
        />
        <WorkspaceSection id="source-citations" title={`인용하는 곳 ${usage.citations.length}`}>
          {kinds.map((kind) => (
            <div key={kind} className="flex flex-col gap-xs">
              <h3 className="typo-caption-small text-text-light">{CITATION_KIND[kind]}</h3>
              <List className="flex flex-col gap-2xs typo-body-small">
                {usage.citations
                  .filter((c) => c.kind === kind)
                  .map((citation) => (
                    <ListItem key={`${citation.href} ${citation.label}`}>
                      <Link to={citation.href} className={LINK}>
                        {citation.label}
                      </Link>
                    </ListItem>
                  ))}
              </List>
            </div>
          ))}
        </WorkspaceSection>
        <WorkspaceSection id="source-symbols" title={`인용된 symbol ${usage.symbols.length}`}>
          {usage.symbols.length ? (
            <List className="flex flex-col gap-2xs">
              {usage.symbols.map((symbol) => (
                <ListItem
                  key={symbol}
                  id={symbolAnchor(symbol)}
                  tabIndex={-1}
                  className="scroll-mt-lg font-mono typo-body-small"
                >
                  {symbol}
                </ListItem>
              ))}
            </List>
          ) : (
            <p className="typo-caption-small text-text-light">
              없음 — 카탈로그가 이 경로의 코드 이름을 인용하지 않는다
            </p>
          )}
          {usage.quotes.length > 0 && (
            <>
              <h3 className="typo-caption-small text-text-light">
                인용된 글자 — 코드 이름이 아닌 설정 줄 · 문장
              </h3>
              <List className="flex flex-col gap-2xs">
                {usage.quotes.map((quote) => (
                  <ListItem key={quote}>
                    <code className="devhub-code">{quote}</code>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </WorkspaceSection>
      </WorkspaceFrame>
      <Inspector>
        <div className="flex flex-col gap-md">
          <p className="typo-caption-small text-text-light">소스</p>
          <h2 className="typo-body-medium-strong break-all">{usage.path}</h2>
          <ul className="flex flex-col gap-sm">
            <FileRow
              source={
                usage.directory ? { path: usage.path, directory: true } : { path: usage.path }
              }
              label="원문"
            />
          </ul>
        </div>
      </Inspector>
    </>
  );
};
