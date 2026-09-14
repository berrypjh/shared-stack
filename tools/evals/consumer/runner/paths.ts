import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** cwd에 의존하지 않도록 모든 경로를 모듈 위치 기준으로 푼다. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export const fromRepoRoot = (...segments: string[]): string => path.join(REPO_ROOT, ...segments);
