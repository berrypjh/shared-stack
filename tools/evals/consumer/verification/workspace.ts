import fs from 'node:fs/promises';
import path from 'node:path';

import { FIXTURE_DIR } from '../runner/fixture-context';
import { REPO_ROOT } from '../runner/paths';
import type { ChangedFile } from '../runner/schema';

/**
 * fixture + agent가 바꾼 파일로 임시 consumer workspace를 만든다.
 *
 * module 해석은 **published declaration/bundle**을 가리킨다 — 라이브러리 source가 아니다.
 * 그래서 deep source import는 해석 자체가 실패하고, 없는 export는 typecheck가 잡는다.
 */

const TSCONFIG = (repoRel: string) => `{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["es2022", "dom"],
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": [],
    "baseUrl": ".",
    "paths": {
      "@berrypjh/react-ui": ["${repoRel}/libs/react-ui/dist/types/index.d.ts"],
      "@berrypjh/react-native-ui": ["${repoRel}/libs/react-native-ui/dist/index.d.ts"],
      "react": ["${repoRel}/node_modules/@types/react"],
      "react/jsx-runtime": ["${repoRel}/node_modules/@types/react/jsx-runtime"],
      "react-dom": ["${repoRel}/node_modules/@types/react-dom"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "globals.d.ts"]
}
`;

const GLOBALS = `declare module '*.css';\n`;

const VITEST_CONFIG = (repoRel: string) => `import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '${repoRel}');

export default defineConfig({
  root: here,
  resolve: {
    alias: {
      '@berrypjh/react-ui/styles.css': resolve(repo, 'libs/react-ui/dist/index.css'),
      '@berrypjh/react-ui': resolve(repo, 'libs/react-ui/dist/index.esm.js'),
      '@berrypjh/react-native-ui': resolve(repo, 'libs/react-native-ui/dist/index.esm.js'),
    },
  },
  test: { include: ['src/**/*.test.{ts,tsx}'], environment: 'jsdom' },
});
`;

export type Workspace = { dir: string; writtenFiles: string[] };

const copyDir = async (from: string, to: string): Promise<void> => {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(src, dest);
    else await fs.copyFile(src, dest);
  }
};

/** fixture를 복사하고 변경 파일을 덮어쓴 뒤 검증용 설정을 생성한다. */
export const materializeWorkspace = async (
  fixture: string,
  changedFiles: ChangedFile[],
  dir: string,
): Promise<Workspace> => {
  await fs.rm(dir, { recursive: true, force: true });
  await copyDir(path.join(FIXTURE_DIR, fixture), dir);

  const written: string[] = [];
  for (const file of changedFiles) {
    const target = path.resolve(dir, file.path);
    if (!target.startsWith(path.resolve(dir))) {
      throw new Error(`changed file escapes the workspace: ${file.path}`);
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.content, 'utf8');
    written.push(file.path);
  }

  const repoRel = path.relative(dir, REPO_ROOT) || '.';
  await fs.writeFile(path.join(dir, 'tsconfig.json'), TSCONFIG(repoRel), 'utf8');
  await fs.writeFile(path.join(dir, 'globals.d.ts'), GLOBALS, 'utf8');
  await fs.writeFile(path.join(dir, 'vitest.config.mts'), VITEST_CONFIG(repoRel), 'utf8');

  return { dir, writtenFiles: written };
};
