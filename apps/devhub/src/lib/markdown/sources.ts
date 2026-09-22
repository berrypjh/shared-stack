/**
 * 저장소 문서 원문. build 시점에 Vite 가 `?raw` 로 문서마다 따로 묶고, 브라우저는 연 문서만 받는다.
 * 브라우저는 파일 시스템을 읽지 않는다. 패턴은 카탈로그 문서가 있는 자리만 덮는다(테스트가 대조한다).
 * 제외 패턴도 이 파일 기준 상대 경로라 저장소 루트부터 쓴다 — 루트 없이 쓰면 이 폴더 아래만 뜻한다.
 */
const RAW = import.meta.glob<string>(
  [
    '../../../../../*.md',
    '../../../../../{apps,libs}/*/*.md',
    '../../../../../docs/**/*.md',
    '../../../../../tools/**/README.md',
    '../../../../../plugins/*/README.md',
    '!../../../../../**/CLAUDE.md',
    '!../../../../../**/node_modules/**',
  ],
  { query: '?raw', import: 'default' },
);

/** 이 파일의 저장소 경로. glob 키는 이 파일에서 본 상대 경로라 여기서 풀어 저장소 경로로 바꾼다. */
const HERE = new URL('apps/devhub/src/lib/markdown/', 'file:///repo/');

const repositoryPath = (key: string) => new URL(key, HERE).pathname.slice('/repo/'.length);

const LOADERS = new Map(Object.entries(RAW).map(([key, load]) => [repositoryPath(key), load]));

/** 묶인 문서의 저장소 경로 전부. */
export const bundledPaths = () => [...LOADERS.keys()];

/** 저장소 경로의 원문을 불러온다. 묶이지 않은 경로면 `undefined`. */
export const loadRaw = (path: string) => LOADERS.get(path)?.();
