import { type Inline, inlineText, parseInline } from './inline';
import { slug } from './slug';

/**
 * 저장소 문서가 실제로 쓰는 블록 문법: ATX 제목, 문단, 목록(중첩 · 번호 · 체크), 표, 코드 펜스, 인용, 구분선.
 * setext 제목 · 들여쓰기 코드 · HTML 블록은 문서에 없어 지원하지 않는다 — 글자로 남는다.
 */
export type ListItem = { checked?: boolean; blocks: Block[] };

export type Block =
  | { kind: 'heading'; level: number; id: string; text: string; inline: Inline[] }
  | { kind: 'paragraph'; inline: Inline[] }
  | { kind: 'list'; ordered: boolean; start: number; items: ListItem[] }
  | { kind: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { kind: 'code'; lang: string; text: string }
  | { kind: 'quote'; blocks: Block[] }
  | { kind: 'rule' };

const FENCE = /^\s*```(\S*)\s*$/;
const FENCE_END = /^\s*```\s*$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s*(-{3,}|\*{3,})\s*$/;
const LIST = /^(\s*)([-*]|(\d+)\.)\s+(.*)$/;
const TASK = /^\[([ xX])\]\s+(.*)$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const isBlank = (line: string | undefined) => line === undefined || line.trim() === '';
const indentOf = (line: string) => line.length - line.trimStart().length;
const isQuote = (line: string) => line.trimStart().startsWith('>');
const isTable = (line: string, next: string | undefined) =>
  line.trimStart().startsWith('|') && TABLE_SEPARATOR.test(next ?? '');

/** 표 칸: 코드 안이 아니고 이스케이프되지 않은 `|` 로 나눈다. */
const cells = (line: string): string[] => {
  const row = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const out: string[] = [];
  let cell = '';
  let inCode = false;
  for (let i = 0; i < row.length; i += 1) {
    const ch = row[i];
    if (ch === '\\' && row[i + 1] === '|') {
      cell += inCode ? '|' : '\\|';
      i += 1;
    } else if (ch === '|' && !inCode) {
      out.push(cell.trim());
      cell = '';
    } else {
      if (ch === '`') inCode = !inCode;
      cell += ch;
    }
  }
  out.push(cell.trim());
  return out;
};

/** 같은 문서 안에서 겹치는 앵커는 GitHub 처럼 `-1`, `-2` 를 붙인다. */
const uniqueId = (ids: Map<string, number>, text: string) => {
  const base = slug(text);
  const seen = ids.get(base) ?? 0;
  ids.set(base, seen + 1);
  return seen === 0 ? base : `${base}-${seen}`;
};

/** 목록 항목 한 개의 줄들: 내용 들여쓰기까지 들어간 줄, 그런 줄 앞의 빈 줄, 더 깊은 목록. */
const itemLines = (lines: string[], start: number, indent: number, content: number) => {
  const body: string[] = [];
  let i = start;
  while (i < lines.length) {
    const next = lines[i];
    if (!isBlank(next) && indentOf(next) >= content) body.push(next.slice(content));
    else if (isBlank(next) && !isBlank(lines[i + 1]) && indentOf(lines[i + 1]) >= content)
      body.push('');
    else if (!isBlank(next) && indentOf(next) > indent && LIST.test(next))
      body.push(next.slice(Math.min(content, indentOf(next))));
    else break;
    i += 1;
  }
  return { body, end: i };
};

const parseLines = (lines: string[], ids: Map<string, number>): Block[] => {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      i += 1;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const indent = indentOf(line);
      const body: string[] = [];
      for (i += 1; i < lines.length && !FENCE_END.test(lines[i]); i += 1) {
        body.push(lines[i].slice(Math.min(indent, indentOf(lines[i]))));
      }
      i += 1;
      blocks.push({ kind: 'code', lang: fence[1], text: body.join('\n') });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const inline = parseInline(heading[2]);
      const text = inlineText(inline);
      blocks.push({
        kind: 'heading',
        level: heading[1].length,
        id: uniqueId(ids, text),
        text,
        inline,
      });
      i += 1;
      continue;
    }

    if (RULE.test(line)) {
      blocks.push({ kind: 'rule' });
      i += 1;
      continue;
    }

    if (isTable(line, lines[i + 1])) {
      const head = cells(line).map(parseInline);
      const rows: Inline[][][] = [];
      for (i += 2; i < lines.length && lines[i].trimStart().startsWith('|'); i += 1) {
        rows.push(cells(lines[i]).map(parseInline));
      }
      blocks.push({ kind: 'table', head, rows });
      continue;
    }

    if (isQuote(line)) {
      const body: string[] = [];
      for (; i < lines.length && isQuote(lines[i]); i += 1) {
        body.push(lines[i].trimStart().replace(/^> ?/, ''));
      }
      blocks.push({ kind: 'quote', blocks: parseLines(body, ids) });
      continue;
    }

    const marker = LIST.exec(line);
    if (marker) {
      const indent = marker[1].length;
      const ordered = marker[3] !== undefined;
      const items: ListItem[] = [];
      while (i < lines.length) {
        const item = LIST.exec(lines[i]);
        if (!item || item[1].length !== indent || (item[3] !== undefined) !== ordered) break;
        const task = TASK.exec(item[4]);
        const { body, end } = itemLines(lines, i + 1, indent, indent + item[2].length + 1);
        items.push({
          ...(task ? { checked: task[1] !== ' ' } : {}),
          blocks: parseLines([task ? task[2] : item[4], ...body], ids),
        });
        i = end;
      }
      blocks.push({ kind: 'list', ordered, start: ordered ? Number(marker[3]) : 1, items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      !isBlank(lines[i]) &&
      !FENCE.test(lines[i]) &&
      !HEADING.test(lines[i]) &&
      !LIST.test(lines[i]) &&
      !isQuote(lines[i]) &&
      !isTable(lines[i], lines[i + 1])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ kind: 'paragraph', inline: parseInline(paragraph.join(' ')) });
  }
  return blocks;
};

/** 문서 한 편. 제목 앵커는 문서 안에서 유일하다. */
export const parseMarkdown = (source: string): Block[] =>
  parseLines(source.replace(/\r\n?/g, '\n').split('\n'), new Map());
