/**
 * 특정 라이브러리의 트리셰이킹 효과를 측정.
 *
 * **진단 전용이다. CI 게이트가 아니다.** 실패로 종료하지 않으며, 그렇게 바꾸어서도 안 된다:
 * react-ui 는 지금 어떤 심볼을 재도 같은 값이 나와서(`cx` 34,244 / `TextField` 34,245 raw)
 * 안정적인 비율 임계값을 세울 수 없다. 원인은 `Component.displayName = '...'` 최상위 할당
 * 21개이고(속성 할당이라 번들러가 순수하다고 증명하지 못한다), 그것을 고치는 것은 소비자가
 * 관찰하는 속성을 바꾸는 breaking 변경이라 별도 승인이 필요하다.
 *
 * 번들 회귀 자체는 `.size-limit.cjs` 가 케이스별 절대 한도로 이미 막는다 — 그쪽이 CI 필수
 * 게이트이고, 여기에 두 번째 임계값을 더하면 같은 회귀를 중복 감시하게 된다.
 *
 * 방식: 가짜 entry에 사용자 지정 export만 import하고 esbuild로 번들→minify.
 * 결과 byte를 "전체 export" 시나리오와 비교해 절감 비율 출력.
 *
 * 사용:
 *   pnpm treeshake <target> [symbol] [symbol] ...
 *   pnpm treeshake <target> [symbol]... --json   # scenario 별 raw·gzip 또는 오류 (quality-lab 수집용)
 *
 * 예:
 *   pnpm treeshake react-ui Button
 *   pnpm treeshake react-ui Button TextField
 *   pnpm treeshake react-ui            # 전체 export 베이스라인만
 *   pnpm treeshake ui-core getColor createTheme
 *   pnpm treeshake design-tokens themes
 */

import { BundleError, measure, type Row, type Scenario, scenariosFor, TARGETS } from './measure';

const args = process.argv.slice(2);
const json = args.includes('--json');
const [targetName, ...symbols] = args.filter((arg) => arg !== '--json');

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

/** human 모드는 기존처럼 esbuild 실패 시 stderr 를 찍고 종료 코드 1 로 끝난다. */
const measureOrThrow = async (scenario: Scenario): Promise<Row> => {
  try {
    return await measure(target, scenario);
  } catch (e) {
    if (e instanceof BundleError) {
      console.error(e.stderr);
      throw new Error('esbuild failed');
    }
    throw e;
  }
};

const main = async () => {
  console.log(`target:  ${targetName} (${target.pkg})`);
  console.log(`external: ${target.external.join(', ') || '(none)'}\n`);

  const rows: Row[] = [];
  for (const scenario of scenariosFor(target, symbols)) {
    rows.push(await measureOrThrow(scenario));
  }

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

/**
 * `--json`: scenario 마다 raw·gzip 또는 오류를 담는다. 선행 build 결손·없는 export·임시 entry
 * 실패가 그 scenario 의 `error` 로 남고 나머지 scenario 는 계속 잰다. 비율·임계값은 넣지 않는다.
 */
const mainJson = async () => {
  const scenarios = [];
  for (const scenario of scenariosFor(target, symbols)) {
    const { name, kind } = scenario;
    try {
      const row = await measure(target, scenario);
      scenarios.push({ name, kind, symbols: scenario.symbols, raw: row.raw, gzip: row.gzip });
    } catch (e) {
      const error = e instanceof BundleError ? e.stderr.trim() || e.message : (e as Error).message;
      scenarios.push({ name, kind, symbols: scenario.symbols, error });
    }
  }
  console.log(
    JSON.stringify(
      { target: targetName, pkg: target.pkg, external: target.external, scenarios },
      null,
      2,
    ),
  );
};

(json ? mainJson() : main()).catch((e) => {
  console.error(e);
  process.exit(1);
});
