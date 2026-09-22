import { inlineText, parseInline } from './inline';
import { parseMarkdown } from './parse';
import { slug } from './slug';

describe('parseInline', () => {
  it('reads code, links, strong, and emphasis; code wins over the rest', () => {
    expect(parseInline('a `**x**` [b `c`](d.md) **e** _f_ *g*')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'code', text: '**x**' },
      { kind: 'text', text: ' ' },
      {
        kind: 'link',
        href: 'd.md',
        children: [
          { kind: 'text', text: 'b ' },
          { kind: 'code', text: 'c' },
        ],
      },
      { kind: 'text', text: ' ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'e' }] },
      { kind: 'text', text: ' ' },
      { kind: 'em', children: [{ kind: 'text', text: 'f' }] },
      { kind: 'text', text: ' ' },
      { kind: 'em', children: [{ kind: 'text', text: 'g' }] },
    ]);
  });

  it('keeps underscores inside words and stray stars as text', () => {
    expect(parseInline('snake_case_name 2 * 3 * 4')).toEqual([
      { kind: 'text', text: 'snake_case_name 2 * 3 * 4' },
    ]);
  });

  it('keeps HTML as text and an image as its alt text only', () => {
    const inline = parseInline('<b>x</b> ![Nx](https://img.shields.io/badge/Nx)');
    expect(inline).toEqual([
      { kind: 'text', text: '<b>x</b> ' },
      { kind: 'image', alt: 'Nx' },
    ]);
    expect(inlineText(inline)).toBe('<b>x</b> Nx');
  });

  it('honours backslash escapes', () => {
    expect(inlineText(parseInline('\\*not em\\* \\| pipe'))).toBe('*not em* | pipe');
  });
});

describe('slug', () => {
  it('matches GitHub anchors, emoji and punctuation dropped', () => {
    expect(slug('테마 추가')).toBe('테마-추가');
    expect(slug('🩹 Fixes')).toBe('-fixes');
    expect(slug('`pnpm nx` · 검증 (CI)')).toBe('pnpm-nx--검증-ci');
  });
});

describe('parseMarkdown', () => {
  it('numbers repeated headings as GitHub does', () => {
    const ids = parseMarkdown('## 🚀 Features\n\n## 🚀 Features\n\n## 🚀 Features').map((block) =>
      block.kind === 'heading' ? block.id : null,
    );
    expect(ids).toEqual(['-features', '-features-1', '-features-2']);
  });

  it('reads nested, ordered, and task lists', () => {
    const [list] = parseMarkdown('- [ ] 할 일\n- [x] 끝\n  1. 하나\n  2. 둘\n- 보통');
    expect(list).toMatchObject({
      kind: 'list',
      ordered: false,
      items: [
        { checked: false, blocks: [{ kind: 'paragraph' }] },
        {
          checked: true,
          blocks: [{ kind: 'paragraph' }, { kind: 'list', ordered: true, start: 1 }],
        },
        { blocks: [{ kind: 'paragraph' }] },
      ],
    });
    expect('checked' in (list.kind === 'list' ? list.items[2] : {})).toBe(false);
  });

  it('reads tables with pipes inside code', () => {
    const [table] = parseMarkdown('| a | b |\n| --- | :-: |\n| `x \\| y` | **z** |');
    expect(table).toMatchObject({ kind: 'table' });
    if (table.kind !== 'table') return;
    expect(table.head.map(inlineText)).toEqual(['a', 'b']);
    expect(table.rows[0].map(inlineText)).toEqual(['x | y', 'z']);
  });

  it('keeps fenced code verbatim, quotes, and rules', () => {
    const blocks = parseMarkdown(
      '```bash\n# not a heading\n  pnpm i\n```\n\n> **주의**\n> 끝\n\n---',
    );
    expect(blocks).toEqual([
      { kind: 'code', lang: 'bash', text: '# not a heading\n  pnpm i' },
      {
        kind: 'quote',
        blocks: [
          {
            kind: 'paragraph',
            inline: [
              { kind: 'strong', children: [{ kind: 'text', text: '주의' }] },
              { kind: 'text', text: ' 끝' },
            ],
          },
        ],
      },
      { kind: 'rule' },
    ]);
  });
});
