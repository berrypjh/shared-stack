/**
 * 특정 라이브러리의 트리셰이킹 효과를 측정.
 *
 * 방식: 가짜 entry에 사용자 지정 export만 import하고 esbuild로 번들→minify.
 * 결과 byte를 "전체 export" 시나리오와 비교해 절감 비율 출력.
 *
 * 사용:
 *   pnpm treeshake <target> [symbol] [symbol] ...
 *
 * 예:
 *   pnpm treeshake react-ui Button
 *   pnpm treeshake react-ui Button TextField
 *   pnpm treeshake react-ui            # 전체 export 베이스라인만
 *   pnpm treeshake ui-core getColor createTheme
 *   pnpm treeshake design-tokens themes
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

type Target = {
  pkg: string;
  external: string[];
};

const TARGETS: Record<string, Target> = {
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

const args = process.argv.slice(2);
const [targetName, ...symbols] = args;

if (!targetName || !TARGETS[targetName]) {
  console.error(`usage: pnpm treeshake <target> [symbol]...`);
  console.error(`targets: ${Object.keys(TARGETS).join(', ')}`);
  process.exit(1);
}

const target = TARGETS[targetName];

const fmt = (n: number) => n.toLocaleString();
const pct = (cur: number, base: number): string => {
  if (cur === base) return '—';
  const sign = cur < base ? '−' : '+';
  return `${sign}${((Math.abs(cur - base) / base) * 100).toFixed(1)}%`;
};

const writeEntry = async (content: string): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'treeshake-'));
  const file = path.join(dir, 'entry.mjs');
  await fs.writeFile(file, content, 'utf8');
  return file;
};

const bundleSize = (entry: string): { raw: number; gzip: number } => {
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
    console.error(out.stderr);
    throw new Error('esbuild failed');
  }
  const code = out.stdout;
  const raw = Buffer.byteLength(code, 'utf8');
  const gzip = zlib.gzipSync(code).length;
  return { raw, gzip };
};

type Row = {
  name: string;
  raw: number;
  gzip: number;
};

const measure = async (scenarioName: string, entryContent: string): Promise<Row> => {
  const entry = await writeEntry(entryContent);
  try {
    const { raw, gzip } = bundleSize(entry);
    return { name: scenarioName, raw, gzip };
  } finally {
    await fs.rm(path.dirname(entry), { recursive: true, force: true });
  }
};

const printTable = (rows: Row[]) => {
  const base = rows[rows.length - 1]; // last row = "all-exports" baseline
  const nameW = Math.max(20, ...rows.map((r) => r.name.length));
  const headers = [
    'scenario'.padEnd(nameW),
    'raw'.padStart(10),
    'gzip'.padStart(8),
    'vs all'.padStart(8),
  ];
  console.log(headers.join('  '));
  console.log('-'.repeat(headers.join('  ').length));
  for (const r of rows) {
    console.log(
      [
        r.name.padEnd(nameW),
        fmt(r.raw).padStart(10),
        fmt(r.gzip).padStart(8),
        (r === base ? '—' : pct(r.raw, base.raw)).padStart(8),
      ].join('  '),
    );
  }
};

const main = async () => {
  console.log(`target:  ${targetName} (${target.pkg})`);
  console.log(`external: ${target.external.join(', ') || '(none)'}\n`);

  const rows: Row[] = [];

  // 사용자 지정 심볼이 있으면 single-symbol scenarios 측정
  if (symbols.length > 0) {
    for (const sym of symbols) {
      const entry = `import { ${sym} } from '${target.pkg}';\nconsole.log(${sym});\n`;
      rows.push(await measure(`single: ${sym}`, entry));
    }

    if (symbols.length > 1) {
      const entry = `import { ${symbols.join(', ')} } from '${target.pkg}';\nconsole.log(${symbols.join(', ')});\n`;
      rows.push(await measure(`multi: ${symbols.join('+')}`, entry));
    }
  }

  // 항상 baseline (전체 re-export, 트리셰이킹 무력화)
  const allEntry = `export * from '${target.pkg}';\n`;
  rows.push(await measure('all-exports (baseline)', allEntry));

  printTable(rows);

  if (symbols.length > 0) {
    const single = rows[0];
    const all = rows[rows.length - 1];
    const ratio = ((1 - single.raw / all.raw) * 100).toFixed(1);
    console.log(`\ntree-shaking 효과: 단일 심볼(${symbols[0]})은 전체 대비 raw ${ratio}% 작음`);
    if (single.raw / all.raw > 0.95) {
      console.log(
        '⚠️ 효과 거의 없음 — sideEffects: false 누락이나 import chain이 끊기지 않을 가능성',
      );
    }
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
