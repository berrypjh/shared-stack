import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { anchorsOf, type Block, bodyOf, type Inline, outlineOf } from '@berrypjh/devhub-ui';

import { catalog } from '../../data';
import type { DocumentRef, RecordRef } from '../../domain/model';
import { citationsOf } from '../catalog/document-citations';

import { type DocLink, resolveDocLink, resolvePath } from './doc-links';
import { loadDocument } from './documents';

const REPO = join(__dirname, '../../../../..');
const onDisk = (path: string) => existsSync(join(REPO, path));
const isDirectory = (path: string) => onDisk(path) && statSync(join(REPO, path)).isDirectory();

/** 본문 어디에 있든(제목 · 표 · 목록 · 인용) 링크의 href 전부. */
const hrefsOf = (blocks: Block[]): string[] => {
  const fromInline = (inline: Inline[]): string[] =>
    inline.flatMap((node) =>
      node.kind === 'link'
        ? [node.href, ...fromInline(node.children)]
        : node.kind === 'strong' || node.kind === 'em'
          ? fromInline(node.children)
          : [],
    );
  return blocks.flatMap((block) => {
    switch (block.kind) {
      case 'heading':
      case 'paragraph':
        return fromInline(block.inline);
      case 'table':
        return [...block.head, ...block.rows.flat()].flatMap(fromInline);
      case 'list':
        return block.items.flatMap((item) => hrefsOf(item.blocks));
      case 'quote':
        return hrefsOf(block.blocks);
      default:
        return [];
    }
  });
};

/** 문서와 기록은 같은 방식으로 묶이고 그려진다. 앵커는 종류별로 따로 센다. */
type Page = { kind: 'document'; doc: DocumentRef } | { kind: 'record'; doc: RecordRef };

const pages: Page[] = [
  ...catalog.documents.map((doc) => ({ kind: 'document' as const, doc })),
  ...catalog.records.map((doc) => ({ kind: 'record' as const, doc })),
];
const loaded = await Promise.all(
  pages.map(async (page) => ({ ...page, blocks: await loadDocument(page.doc.path) })),
);
const documents = loaded.filter((page) => page.kind === 'document');
const anchorsOfPage = new Map(
  loaded.map((page) => [`${page.kind}:${page.doc.id}`, anchorsOf(page.blocks)]),
);

/** 링크 하나의 문제. 없으면 null. */
const problemOf = (page: Page, href: string, link: DocLink): string | null => {
  const { doc } = page;
  const at = `${doc.path} → ${href}`;
  switch (link.kind) {
    case 'external':
      return null;
    case 'anchor':
      return anchorsOfPage.get(`${page.kind}:${doc.id}`)?.has(link.anchor)
        ? null
        : `${at}: 없는 앵커`;
    case 'document':
    case 'record':
      return !link.anchor || anchorsOfPage.get(`${link.kind}:${link.id}`)?.has(link.anchor)
        ? null
        : `${at}: 대상 문서에 없는 앵커`;
    case 'source':
      if (!onDisk(link.ref.path)) return `${at}: 저장소에 없는 경로`;
      return isDirectory(link.ref.path) === Boolean(link.ref.directory)
        ? null
        : `${at}: 디렉터리 링크는 / 로 끝나야 한다`;
    case 'broken':
      return onDisk(link.path) ? `${at}: 깨졌다고 기록됐지만 대상이 있다` : null;
  }
};

describe('registered documents', () => {
  it('exist at their paths and parse to a body', () => {
    for (const { doc, blocks } of loaded) {
      expect({ path: doc.path, onDisk: onDisk(doc.path), body: bodyOf(blocks).length > 0 }).toEqual(
        { path: doc.path, onDisk: true, body: true },
      );
    }
  });

  it('link only to anchors, documents, and files that exist', () => {
    const problems = loaded.flatMap((page) =>
      hrefsOf(page.blocks).flatMap(
        (href) => problemOf(page, href, resolveDocLink(catalog, page.doc, href)) ?? [],
      ),
    );
    expect(problems).toEqual([]);
  });

  it('record exactly the broken links the documents contain', () => {
    const actual = documents.flatMap(({ doc, blocks }) =>
      hrefsOf(blocks)
        .filter((href) => resolveDocLink(catalog, doc, href).kind === 'broken')
        .map((href) => `${doc.id} ${href}`),
    );
    const recorded = catalog.documents.flatMap((doc) =>
      (doc.brokenLinks ?? []).map((link) => `${doc.id} ${link.href}`),
    );
    expect(actual.sort()).toEqual(recorded.sort());
    expect(recorded).toEqual(['treeshake-readme ../../../docs/verification-guide.md']);
  });

  it('give every outline entry a unique anchor', () => {
    for (const { doc, blocks } of loaded) {
      const ids = outlineOf(bodyOf(blocks)).map((item) => item.id);
      expect({ id: doc.id, unique: new Set(ids).size === ids.length }).toEqual({
        id: doc.id,
        unique: true,
      });
    }
  });

  it('are each cited by at least one entity or journey step', () => {
    const uncited = catalog.documents
      .map((doc) => ({ id: doc.id, ...citationsOf(catalog, doc.id) }))
      .filter((c) => c.entities.length + c.steps.length === 0)
      .map((c) => c.id);
    expect(uncited).toEqual(['root-agents']);
  });
});

describe('resolveDocLink', () => {
  const doc = catalog.documents.find((d) => d.id === 'root-readme') as DocumentRef;

  it('keeps documents in the app and files as source', () => {
    expect(resolveDocLink(catalog, doc, 'libs/react-ui/README.md#설치')).toEqual({
      kind: 'document',
      id: 'react-ui-readme',
      anchor: '설치',
    });
    expect(resolveDocLink(catalog, doc, './LICENSE')).toEqual({
      kind: 'source',
      ref: { path: 'LICENSE' },
    });
    expect(resolveDocLink(catalog, doc, 'libs/react-ui/')).toEqual({
      kind: 'source',
      ref: { path: 'libs/react-ui', directory: true },
    });
    expect(resolveDocLink(catalog, doc, '#%ED%85%8C%EB%A7%88')).toEqual({
      kind: 'anchor',
      anchor: '테마',
    });
    expect(resolveDocLink(catalog, doc, 'https://example.com')).toEqual({
      kind: 'external',
      href: 'https://example.com',
    });
  });

  it('never turns a script address into a link', () => {
    // eslint-disable-next-line no-script-url -- 막히는지 확인하는 입력이다
    expect(resolveDocLink(catalog, doc, 'javascript:alert(1)')).toMatchObject({ kind: 'broken' });
    expect(resolveDocLink(catalog, doc, 'data:text/html,x')).toMatchObject({ kind: 'broken' });
  });

  it('sends a link to another record to its record screen', () => {
    const record = catalog.records.find((r) => r.id === 'react-ui-cascade-layers') as RecordRef;
    expect(resolveDocLink(catalog, record, '2026-09-16-react-ui-css-build-script.md')).toEqual({
      kind: 'record',
      id: 'react-ui-css-build-script',
      anchor: undefined,
    });
  });

  it('does not let a path climb out of the repository', () => {
    expect(resolvePath('README.md', '../../etc/passwd')).toBeNull();
    expect(resolveDocLink(catalog, doc, '../outside.md').kind).toBe('broken');
  });
});
