import path from 'node:path';

import { MEASURE_TARGETS, type MeasureTargetName, readScenarioFiles } from './registry';

/**
 * measure-tokens CLI 의 target 선택과 출력 헬퍼.
 * `MEASURE_TARGET` 환경변수로 선택한다 (기본 `design-tokens`, 후방 호환).
 *
 * 시나리오 등록부와 내용 구성은 `registry.ts` 가 가진다 — quality-lab 수집기와 같은 한 벌이다.
 */
const targetName = (process.env.MEASURE_TARGET ?? 'design-tokens') as MeasureTargetName;
const target = MEASURE_TARGETS[targetName];
if (!target) {
  console.error(
    `unknown MEASURE_TARGET "${targetName}". valid: ${Object.keys(MEASURE_TARGETS).join(', ')}`,
  );
  process.exit(1);
}

export const PKG = path.resolve(target.dir);
export const scenarios: Record<string, string[]> = target.scenarios;
export const TARGET_NAME = targetName;

export const readFiles = (rels: string[]): Promise<{ content: string; chars: number }> =>
  readScenarioFiles(PKG, rels);

export const fmt = (n: number) => n.toLocaleString();

export const delta = (cur: number, base: number): string => {
  if (cur === base) return '—';
  const sign = cur < base ? '−' : '+';
  return `${sign}${((Math.abs(cur - base) / base) * 100).toFixed(1)}%`;
};

export type Row = {
  name: string;
  files: number;
  chars: number;
  tokens: number;
};

export const printTable = (provider: string, rows: Row[]): void => {
  console.log(`target:   ${TARGET_NAME}`);
  console.log(`provider: ${provider}\n`);
  const base = rows[0];
  const nameW = Math.max(10, ...rows.map((r) => r.name.length));
  const headers = [
    'scenario'.padEnd(nameW),
    'files'.padStart(5),
    'chars'.padStart(9),
    'tokens'.padStart(9),
    'Δ'.padStart(7),
  ];
  console.log(headers.join('  '));
  console.log('-'.repeat(headers.join('  ').length));
  for (const r of rows) {
    console.log(
      [
        r.name.padEnd(nameW),
        String(r.files).padStart(5),
        fmt(r.chars).padStart(9),
        fmt(r.tokens).padStart(9),
        (r === base ? '—' : delta(r.tokens, base.tokens)).padStart(7),
      ].join('  '),
    );
  }
};
