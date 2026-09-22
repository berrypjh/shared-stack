'use client';

import { Fragment, type ReactNode, useEffect } from 'react';

import { Table, TableScroll, VisuallyHidden } from '@berrypjh/react-ui';

import type { Inline } from '../markdown/inline';
import type { Block, ListItem } from '../markdown/parse';

import { CopyButton } from './copy-button';

/** 문서에 적힌 링크 하나를 그린다. 어디로 갈지(앱 안 문서 · 저장소 파일 · 밖)는 앱이 정한다. */
export type RenderLink = (href: string, children: ReactNode) => ReactNode;

type Context = { renderLink: RenderLink; caption: string };

const Inlines = ({ nodes, renderLink }: { nodes: Inline[]; renderLink: RenderLink }) =>
  nodes.map((node, index) => {
    switch (node.kind) {
      case 'text':
        return <Fragment key={index}>{node.text}</Fragment>;
      case 'image':
        return <Fragment key={index}>{node.alt}</Fragment>;
      case 'code':
        return (
          <code
            key={index}
            className="rounded-sm bg-background-default px-2xs font-mono text-[0.9em]"
          >
            {node.text}
          </code>
        );
      case 'strong':
        return (
          <strong key={index}>
            <Inlines nodes={node.children} renderLink={renderLink} />
          </strong>
        );
      case 'em':
        return (
          <em key={index}>
            <Inlines nodes={node.children} renderLink={renderLink} />
          </em>
        );
      default: // link
        return (
          <Fragment key={index}>
            {renderLink(node.href, <Inlines nodes={node.children} renderLink={renderLink} />)}
          </Fragment>
        );
    }
  });

const HEADING = {
  2: 'mt-xl border-t border-stroke-light pt-lg typo-heading-h5',
  3: 'mt-lg typo-body-medium-strong',
  4: 'mt-md typo-body-small-strong',
} as const;

/** 절 제목. `id` 는 GitHub 앵커와 같고, 주소의 `#…` 로 오면 포커스를 받는다. */
const Heading = ({
  block,
  renderLink,
}: {
  block: Extract<Block, { kind: 'heading' }>;
  renderLink: RenderLink;
}) => {
  const level = block.level <= 2 ? 2 : block.level === 3 ? 3 : 4;
  const Tag = `h${level}` as const;
  return (
    <Tag id={block.id} tabIndex={-1} className={`scroll-mt-lg ${HEADING[level]}`}>
      <Inlines nodes={block.inline} renderLink={renderLink} />
    </Tag>
  );
};

const CodeBlock = ({ lang, text }: { lang: string; text: string }) => (
  <div className="overflow-hidden rounded-md border border-stroke-light bg-background-default">
    <div className="flex items-center justify-between border-b border-stroke-light px-sm">
      <span className="typo-caption-small text-text-light">{lang || '코드'}</span>
      <CopyButton text={text} label={`${lang || '코드'} 블록 복사`} />
    </div>
    <pre className="overflow-x-auto p-sm font-mono text-xsm">
      <code>{text}</code>
    </pre>
  </div>
);

/** 체크 목록의 칸은 글리프와 숨은 글로 — 입력처럼 보이지만 조작할 수 없는 것을 만들지 않는다. */
const ItemBody = ({ item, context }: { item: ListItem; context: Context }) => {
  const [first] = item.blocks;
  const body =
    item.blocks.length === 1 && first.kind === 'paragraph' ? (
      <Inlines nodes={first.inline} renderLink={context.renderLink} />
    ) : (
      <Blocks blocks={item.blocks} context={context} />
    );
  if (item.checked === undefined) return body;
  return (
    <>
      <span aria-hidden="true">{item.checked ? '☑ ' : '☐ '}</span>
      <VisuallyHidden>{item.checked ? '완료: ' : '할 일: '}</VisuallyHidden>
      {body}
    </>
  );
};

const Blocks = ({ blocks, context }: { blocks: Block[]; context: Context }): ReactNode => {
  let caption = context.caption;
  const { renderLink } = context;
  return blocks.map((block, index) => {
    switch (block.kind) {
      case 'heading':
        caption = block.text;
        return <Heading key={index} block={block} renderLink={renderLink} />;
      case 'paragraph':
        return (
          <p key={index}>
            <Inlines nodes={block.inline} renderLink={renderLink} />
          </p>
        );
      case 'list': {
        const List = block.ordered ? 'ol' : 'ul';
        return (
          <List
            key={index}
            start={block.ordered ? block.start : undefined}
            className={`flex flex-col gap-2xs pl-lg ${block.ordered ? 'list-decimal' : 'list-disc'}`}
          >
            {block.items.map((item, i) => (
              <li key={i} className={item.checked === undefined ? '' : 'list-none -ml-md'}>
                <ItemBody item={item} context={{ ...context, caption }} />
              </li>
            ))}
          </List>
        );
      }
      case 'table':
        return (
          <TableScroll
            key={index}
            label={`표: ${caption}`}
            className="rounded-md border border-stroke-light"
          >
            <Table hiddenCaption>
              <caption>{caption}</caption>
              <thead>
                <tr>
                  {block.head.map((cell, i) => (
                    <th key={i} scope="col">
                      <Inlines nodes={cell} renderLink={renderLink} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c}>
                        <Inlines nodes={cell} renderLink={renderLink} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        );
      case 'code':
        return <CodeBlock key={index} lang={block.lang} text={block.text} />;
      case 'quote':
        return (
          <blockquote
            key={index}
            className="flex flex-col gap-sm rounded-md border-l-4 border-stroke-primary bg-background-default px-md py-sm"
          >
            <Blocks blocks={block.blocks} context={{ ...context, caption }} />
          </blockquote>
        );
      default: // rule
        return <hr key={index} className="border-stroke-light" />;
    }
  });
};

/**
 * 저장소 문서 한 편을 읽기 화면으로. HTML 을 주입하지 않는다 — 모든 글은 React 텍스트 노드다.
 * 불러온 뒤 `hash` 가 있으면 그 절로 간다(불러오기 전에는 그 제목이 아직 없다).
 */
export const DocContent = ({
  blocks,
  title,
  renderLink,
  hash = '',
}: {
  blocks: Block[];
  /** 표 캡션의 기본값. 절 제목이 나오면 그 제목으로 바뀐다. */
  title: string;
  renderLink: RenderLink;
  /** 주소의 `#…`. 앱의 라우터에서 읽어 넘긴다. */
  hash?: string;
}) => {
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    target?.scrollIntoView?.({ block: 'start' });
    target?.focus({ preventScroll: true });
    // 불러온 직후 한 번만. 같은 문서 안의 `#` 이동은 useRouteFocus 가 맡는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);
  return (
    <article className="flex max-w-[46rem] min-w-0 flex-col gap-md typo-body-small">
      <Blocks blocks={blocks} context={{ renderLink, caption: title }} />
    </article>
  );
};
