import type { ThemeMode } from '@berrypjh/devhub-ui';

import { resolvePath } from './doc-links';

/**
 * 문서가 참조하는 그림. build 시점에 Vite 가 파일마다 주소를 붙이고, 브라우저는 그 주소로 받는다.
 * 패턴은 `sources.ts` 처럼 이 파일 기준 상대 경로다.
 * 다크 판은 옆에 `<이름>.dark.<확장자>` 로 둔다. SVG 안의 `prefers-color-scheme` 은 WebKit 이 앱 테마를 따르지 않아 쓰지 않는다.
 */
const URLS = import.meta.glob<string>('../../../../../docs/**/*.{svg,png}', {
  query: '?url',
  import: 'default',
  eager: true,
});

const HERE = new URL('apps/devhub/src/lib/markdown/', 'file:///repo/');

const BY_PATH = new Map(
  Object.entries(URLS).map(([key, url]) => [
    new URL(key, HERE).pathname.slice('/repo/'.length),
    url,
  ]),
);

/** 문서 경로에서 본 그림 경로를 브라우저 주소로. 다크 판이 없으면 라이트 판, 묶이지 않은 그림이면 `undefined`. */
export const imageUrl = (from: string, src: string, mode: ThemeMode) => {
  const path = resolvePath(from, src);
  if (path === null) return undefined;
  const dark = mode === 'dark' ? BY_PATH.get(path.replace(/\.(svg|png)$/, '.dark.$1')) : undefined;
  return dark ?? BY_PATH.get(path);
};
