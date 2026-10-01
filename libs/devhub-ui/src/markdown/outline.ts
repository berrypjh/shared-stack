import type { Block } from './parse';

export type OutlineItem = { id: string; title: string };

/** 문서를 여는 `#` 제목은 화면 제목이 이미 말하므로 본문에서 뺀다. */
export const bodyOf = (blocks: Block[]) => {
  const [first] = blocks;
  return first?.kind === 'heading' && first.level === 1 ? blocks.slice(1) : blocks;
};

/** "이 페이지에서": 본문의 `##` 제목, 그리고 제목 뒤에 오는 `#` 제목(문서를 나누는 큰 절). */
export const outlineOf = (body: Block[]): OutlineItem[] =>
  body.flatMap((block) =>
    block.kind === 'heading' && block.level <= 2 ? [{ id: block.id, title: block.text }] : [],
  );

/** 본문의 모든 제목 앵커. 링크의 `#…` 가 여기 있어야 한다. */
export const anchorsOf = (blocks: Block[]): Set<string> => {
  const ids = new Set<string>();
  const walk = (list: Block[]) => {
    for (const block of list) {
      if (block.kind === 'heading') ids.add(block.id);
      if (block.kind === 'quote') walk(block.blocks);
      if (block.kind === 'list') block.items.forEach((item) => walk(item.blocks));
    }
  };
  walk(blocks);
  return ids;
};
