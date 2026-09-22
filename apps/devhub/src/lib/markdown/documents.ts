import { type Block, parseMarkdown } from '@berrypjh/devhub-ui';

import type { DocumentRef } from '../../domain/model';

import { loadRaw } from './sources';

/** 문서 화면으로 그려지는 것. 저장소 문서와 기록이 같은 모양이다. */
export type ReadableDoc = Pick<DocumentRef, 'path' | 'title' | 'brokenLinks'>;

const cache = new Map<string, Promise<Block[]>>();

/**
 * 문서 한 편을 불러와 해석한다. 같은 경로는 한 번만 — React `use()` 가 같은 promise 를 다시 받는다.
 * 묶이지 않은 경로는 거부된다(테스트가 모든 카탈로그 문서가 묶였는지 확인한다).
 */
export const loadDocument = (path: string): Promise<Block[]> => {
  const cached = cache.get(path);
  if (cached) return cached;
  const raw = loadRaw(path);
  const parsed = raw
    ? raw.then(parseMarkdown)
    : Promise.reject(new Error(`묶이지 않은 문서: ${path}`));
  cache.set(path, parsed);
  return parsed;
};
