/**
 * GitHub 의 제목 앵커: 소문자, `-` · `_` 밖의 문장 부호(이모지 포함) 제거, 공백은 `-`.
 * 문서끼리 이미 이 규칙으로 서로를 가리키므로 DevHub 안에서도 같은 링크가 통한다.
 */
export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
