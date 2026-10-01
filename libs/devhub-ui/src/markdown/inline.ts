/**
 * 저장소 문서가 실제로 쓰는 인라인 문법: 코드, 링크, 굵게, 기울임, 이미지.
 * HTML 은 해석하지 않는다 — `<tag>` 는 글자 그대로 남고 React 가 이스케이프한다.
 */
export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'em'; children: Inline[] }
  | { kind: 'link'; href: string; children: Inline[] }
  /** 외부 이미지는 불러오지 않는다. 대체 글만 남는다. */
  | { kind: 'image'; alt: string };

const ESCAPABLE = /[\\`*_[\]()#|<>!-]/;
const CODE = /^(`+)([\s\S]*?[^`])\1(?!`)/;
const IMAGE = /^!\[([^\]]*)\]\(([^()\s]+)\)/;
const LINK = /^\[((?:[^\]\\`]|\\.|`[^`]*`)+)\]\(([^()\s]+)\)/;
const STRONG = /^\*\*((?:[^*`\\]|\\.|`[^`]*`)+?)\*\*/;
/** `*x*` · `_x_`: 구분자 안쪽이 공백이 아니고, `_` 는 단어 한가운데에 있지 않다. */
const EM =
  /^(?:\*(?![\s*])((?:[^*`\\]|\\.|`[^`]*`)+?)(?<!\s)\*|_(?![\s_])((?:[^_`\\]|\\.|`[^`]*`)+?)(?<!\s)_(?![\p{L}\p{N}_]))/u;

const codeText = (text: string) => (text.trim() === '' ? text : text.replace(/^ (.*) $/, '$1'));

export const parseInline = (source: string): Inline[] => {
  const out: Inline[] = [];
  let text = '';
  const push = (node: Inline) => {
    if (text) out.push({ kind: 'text', text });
    text = '';
    out.push(node);
  };
  let i = 0;
  while (i < source.length) {
    const rest = source.slice(i);
    const ch = source[i];
    const prev = source[i - 1] ?? ' ';
    let match: RegExpExecArray | null;
    if (ch === '\\' && ESCAPABLE.test(source[i + 1] ?? '')) {
      text += source[i + 1];
      i += 2;
    } else if ((match = CODE.exec(rest))) {
      push({ kind: 'code', text: codeText(match[2]) });
      i += match[0].length;
    } else if ((match = IMAGE.exec(rest))) {
      push({ kind: 'image', alt: match[1] });
      i += match[0].length;
    } else if ((match = LINK.exec(rest))) {
      push({ kind: 'link', href: match[2], children: parseInline(match[1]) });
      i += match[0].length;
    } else if ((match = STRONG.exec(rest))) {
      push({ kind: 'strong', children: parseInline(match[1]) });
      i += match[0].length;
    } else if (!/[\p{L}\p{N}]/u.test(prev) && (match = EM.exec(rest))) {
      push({ kind: 'em', children: parseInline(match[1] ?? match[2]) });
      i += match[0].length;
    } else {
      text += ch;
      i += 1;
    }
  }
  if (text) out.push({ kind: 'text', text });
  return out;
};

/** 읽는 사람이 보는 글자 그대로. */
export const inlineText = (inline: Inline[]): string =>
  inline
    .map((node) => {
      switch (node.kind) {
        case 'text':
        case 'code':
          return node.text;
        case 'image':
          return node.alt;
        default:
          return inlineText(node.children);
      }
    })
    .join('');
