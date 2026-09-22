/** 에디터별 파일 주소 형식. `{path}` 에 이 컴퓨터의 절대 경로가 들어간다. */
const EDITOR_URL: Record<string, string> = {
  vscode: 'vscode://file{path}',
  cursor: 'cursor://file{path}',
  antigravity: 'antigravity-ide://file{path}',
  windsurf: 'windsurf://file{path}',
  zed: 'zed://file{path}',
  idea: 'jetbrains://idea/navigate/reference?path={path}',
  webstorm: 'jetbrains://web-storm/navigate/reference?path={path}',
};

const DEFAULT_EDITOR = 'vscode';

/** 저장소 상대 POSIX 경로만 받는다. 절대 경로 · `..` · 빈 세그먼트 · 역슬래시 · URL 은 거부한다. */
export const isCanonicalPath = (path: string) =>
  path.length > 0 &&
  !path.includes('\\') &&
  !path.includes('#') &&
  !path.includes('://') &&
  path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');

/**
 * `VITE_DEVHUB_EDITOR` 설정을 주소 형식으로. 아는 에디터 이름이면 위 표를, `{path}` 가 들어 있으면
 * 그 값을 그대로 쓴다. 둘 다 아니면 기본값으로 돌아간다.
 */
export const templateOf = (setting: string | undefined): string =>
  EDITOR_URL[(setting ?? DEFAULT_EDITOR).trim().toLowerCase()] ??
  (setting?.includes('{path}') ? setting : EDITOR_URL[DEFAULT_EDITOR]);

/**
 * 이 컴퓨터의 에디터로 파일을 여는 링크. 만들지 않을 때는 `null` 이다.
 * `root` 는 개발 서버로 띄웠을 때만 있다 — 절대 경로는 이 머신의 것이라 빌드된 페이지에 들어가면 안 된다.
 */
export const editorHref = (
  path: string,
  { root, editor }: { root: string | null; editor: string | undefined },
): string | null => {
  if (!root || !isCanonicalPath(path)) return null;
  return templateOf(editor).replace('{path}', encodeURI(`${root}/${path}`));
};

/** 지금 뜬 서버 기준. `vite.config.mts` 가 넣은 저장소 루트와 `.env` 의 에디터 설정을 읽는다. */
export const currentEditorHref = (path: string) =>
  editorHref(path, {
    root: __DEVHUB_REPOSITORY_ROOT__,
    editor: import.meta.env.VITE_DEVHUB_EDITOR,
  });
