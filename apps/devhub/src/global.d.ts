/// <reference types="vite/types/importMeta.d.ts" />
// `import.meta.glob` 만 들인다. `vite/client` 의 asset 모듈 선언은 Nx 타이핑과 겹친다.

/** `vite.config.mts` 의 `define` 이 build · serve 시점의 git 스냅샷으로 채운다(src/lib/snapshot.ts). */
declare const __DEVHUB_SNAPSHOT__: import('./domain/model').RepositorySnapshot;

/** 개발 서버로 띄웠을 때만 저장소의 절대 경로. 빌드 · 테스트에서는 `null` 이다("에디터에서 열기"). */
declare const __DEVHUB_REPOSITORY_ROOT__: string | null;

interface ImportMetaEnv {
  /** `VITE_DEVHUB_EDITOR` — 에디터 이름 또는 `{path}` 를 품은 주소 형식. 없으면 vscode. */
  readonly VITE_DEVHUB_EDITOR?: string;
}
