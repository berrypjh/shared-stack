import type { SearchResult } from '@berrypjh/devhub-ui';

import type { SearchEntry, SearchKind } from './entries';

/** 결과 종류의 글자. 종류는 이 글자로 구분한다 — 색만으로 구분하지 않는다. */
export const KIND_LABEL: Record<SearchKind, string> = {
  journey: '소비 흐름',
  step: '흐름 단계',
  application: '애플리케이션',
  package: '패키지',
  tool: '도구',
  export: '공개 export',
  document: '문서',
  record: '기록',
  command: '명령',
  test: '테스트 묶음',
  source: '소스 파일',
  symbol: 'symbol',
};

/** 제안 한 줄. 종류는 설명의 첫 글자로 보인다. */
export const toSuggestion = (result: SearchResult<SearchEntry>) => ({
  id: result.key,
  label: result.label,
  description: `${KIND_LABEL[result.kind]} · ${result.detail}`,
});
