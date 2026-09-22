import type { Catalog, DocumentRef, SourceRef } from '../../domain/model';

/** 링크를 푸는 데 필요한 문서 쪽 정보. 문서와 기록이 같이 쓴다. */
export type LinkSource = Pick<DocumentRef, 'path' | 'brokenLinks'>;

/**
 * 문서에 적힌 링크 하나가 가는 곳. 앱 안의 문서와 저장소 파일(소스)을 가른다.
 * 대상이 없는 링크는 `broken` 으로 남는다 — 카탈로그가 기록한 것만 그렇고, 테스트가 실제와 대조한다.
 */
export type DocLink =
  | { kind: 'external'; href: string }
  | { kind: 'anchor'; anchor: string }
  | { kind: 'document'; id: string; anchor?: string }
  | { kind: 'record'; id: string; anchor?: string }
  | { kind: 'source'; ref: SourceRef; anchor?: string }
  | { kind: 'broken'; path: string; note: string };

const ROOT = 'file:///repo/';
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
/** 새 창으로 여는 주소는 이것뿐이다. `javascript:` 등 다른 scheme 은 링크가 되지 않는다. */
const SAFE_SCHEME = /^(https?|mailto):/i;

/** 문서 경로에서 본 상대 경로를 저장소 경로로. 저장소 밖으로 나가면 `null`. */
export const resolvePath = (from: string, target: string) => {
  const url = new URL(target.startsWith('/') ? target.slice(1) : target, `${ROOT}${from}`);
  const path = decodeURIComponent(url.pathname);
  return path.startsWith('/repo/') ? path.slice('/repo/'.length) : null;
};

export const resolveDocLink = (catalog: Catalog, doc: LinkSource, href: string): DocLink => {
  if (SAFE_SCHEME.test(href)) return { kind: 'external', href };
  if (SCHEME.test(href)) return { kind: 'broken', path: href, note: '허용하지 않는 주소 형식이다' };
  const hashAt = href.indexOf('#');
  const pathPart = hashAt === -1 ? href : href.slice(0, hashAt);
  const anchor = hashAt === -1 ? undefined : decodeURIComponent(href.slice(hashAt + 1));
  if (!pathPart) return { kind: 'anchor', anchor: anchor ?? '' };

  const path = resolvePath(doc.path, pathPart);
  const recorded = doc.brokenLinks?.find((link) => link.href === href);
  if (recorded || path === null) {
    return {
      kind: 'broken',
      path: path ?? pathPart,
      note: recorded?.note ?? '저장소 밖을 가리키는 경로다',
    };
  }
  const directory = path.endsWith('/');
  const clean = directory ? path.slice(0, -1) : path;
  const target = catalog.documents.find((d) => d.path === clean);
  if (target) return { kind: 'document', id: target.id, anchor };
  const record = catalog.records.find((r) => r.path === clean);
  if (record) return { kind: 'record', id: record.id, anchor };
  return {
    kind: 'source',
    ref: directory ? { path: clean, directory: true } : { path: clean },
    anchor,
  };
};
