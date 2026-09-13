import { BoundaryError, readText } from '../safe-fs';

/** 이미 만든 raw report 를 다시 실행하지 않고 가져올 때 쓰는 디렉터리. `tmp` 라 추적되지 않는다. */
export const IMPORTS_DIR = 'tmp/quality-lab/imports';

/** import 경로는 imports 디렉터리 안이어야 한다. traversal·symlink 는 `readText` 가 막는다. */
export const readImport = async (workspaceRoot: string, importPath: string): Promise<string> => {
  if (!importPath.startsWith(`${IMPORTS_DIR}/`)) {
    throw new BoundaryError(`${importPath} is not under ${IMPORTS_DIR}`);
  }
  return readText(workspaceRoot, importPath);
};
