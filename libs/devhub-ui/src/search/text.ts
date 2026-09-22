/** 비교용 글자: NFC · 소문자 · 앞뒤 공백 없음. 한글 조합형 · 완성형이 같아진다. */
export const normalize = (value: string) => value.normalize('NFC').toLowerCase().trim();

const WORD_BREAK = /[^\p{L}\p{N}]+/u;

/** 값의 단어. camelCase 와 경로 · 문장 부호에서도 끊는다(`buildTokenOutputs` → build, token, outputs). */
export const tokensOf = (value: string): string[] => {
  const spaced = value.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2');
  return [
    ...new Set([...normalize(value).split(WORD_BREAK), ...normalize(spaced).split(WORD_BREAK)]),
  ].filter(Boolean);
};

export const basename = (path: string) => path.split('/').pop() ?? path;
export const stem = (path: string) => basename(path).replace(/\.[^.]+$/, '');
