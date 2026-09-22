import { buildIndex, GlobalSearch as Search, search, topResults } from '@berrypjh/devhub-ui';

import { catalog } from '@/data';
import { SEARCH_KINDS, searchEntries } from '@/lib/search/entries';
import { toSuggestion } from '@/lib/search/view';

/** 페이지를 열 때 묶인 카탈로그에서 한 번 만든다. */
const INDEX = buildIndex(searchEntries(catalog), SEARCH_KINDS);

const results = (query: string) => {
  const all = search(INDEX, query);
  return { all, shown: topResults(all) };
};

const placeholder = (shortcut: string) => `흐름 · 패키지 · 소스 · 명령 검색 (${shortcut})`;

/** 저장소 전체 검색. 색인 · 순위 · 종류 글자는 이 앱의 것이고, combobox · 단축키 · 알림은 devhub-ui 의 것이다. */
export const GlobalSearch = () => (
  <Search
    results={results}
    keyOf={(result) => result.key}
    toSuggestion={toSuggestion}
    hrefOf={(result) => result.href}
    placeholder={placeholder}
  />
);
