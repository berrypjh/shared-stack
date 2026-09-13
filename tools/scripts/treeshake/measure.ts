import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

/** check.ts 의 측정 함수. `--json` 출력과 human 표가 같은 측정을 쓰도록 분리했다. */

export type Target = {
  pkg: string;
  external: string[];
};

export const TARGETS: Record<string, Target> = {
  'design-tokens': {
    pkg: '@berrypjh/design-tokens',
    external: [],
  },
  'ui-core': {
    pkg: '@berrypjh/ui-core',
    external: [],
  },
  'react-ui': {
    pkg: '@berrypjh/react-ui',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  'react-native-ui': {
    pkg: '@berrypjh/react-native-ui',
    external: ['react', 'react-native', 'react/jsx-runtime'],
  },
};

export type Scenario = {
  name: string;
  kind: 'single' | 'multi' | 'all-exports';
  symbols: string[];
  /** 가짜 entry 내용. `console.log` 는 export 가 dead code 로 지워지지 않게 붙잡는 anchor 다. */
  entry: string;
};

export type Row = {
  name: string;
  raw: number;
  gzip: number;
};

/** 심볼마다 single, 둘 이상이면 multi, 마지막은 항상 전체 re-export baseline 이다. */
export const scenariosFor = (target: Target, symbols: string[]): Scenario[] => [
  ...symbols.map((sym) => ({
    name: `single: ${sym}`,
    kind: 'single' as const,
    symbols: [sym],
    entry: `import { ${sym} } from '${target.pkg}';\nconsole.log(${sym});\n`,
  })),
  ...(symbols.length > 1
    ? [
        {
          name: `multi: ${symbols.join('+')}`,
          kind: 'multi' as const,
          symbols,
          entry: `import { ${symbols.join(', ')} } from '${target.pkg}';\nconsole.log(${symbols.join(', ')});\n`,
        },
      ]
    : []),
  {
    name: 'all-exports (baseline)',
    kind: 'all-exports',
    symbols: [],
    entry: `export * from '${target.pkg}';\n`,
  },
];

/** esbuild 가 0 이 아닌 코드로 끝났다. 없는 export·해석 실패가 여기로 온다. */
export class BundleError extends Error {
  readonly stderr: string;

  constructor(stderr: string) {
    super('esbuild failed');
    this.stderr = stderr;
  }
}

const writeEntry = async (content: string): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'treeshake-'));
  const file = path.join(dir, 'entry.mjs');
  await fs.writeFile(file, content, 'utf8');
  return file;
};

const bundleSize = (target: Target, entry: string): { raw: number; gzip: number } => {
  const out = spawnSync(
    'pnpm',
    [
      'exec',
      'esbuild',
      entry,
      '--bundle',
      '--minify',
      '--format=esm',
      '--tree-shaking=true',
      '--platform=neutral',
      ...target.external.map((e) => `--external:${e}`),
    ],
    { encoding: 'utf8', cwd: process.cwd() },
  );
  if (out.status !== 0) {
    throw new BundleError(out.stderr);
  }
  const code = out.stdout;
  const raw = Buffer.byteLength(code, 'utf8');
  const gzip = zlib.gzipSync(code).length;
  return { raw, gzip };
};

export const measure = async (target: Target, scenario: Scenario): Promise<Row> => {
  const entry = await writeEntry(scenario.entry);
  try {
    const { raw, gzip } = bundleSize(target, entry);
    return { name: scenario.name, raw, gzip };
  } finally {
    await fs.rm(path.dirname(entry), { recursive: true, force: true });
  }
};
