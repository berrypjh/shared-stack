import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Catalog } from '../scripts/generate-consumer-catalog/schema';

import { type CatalogSet, discover, getApi, packageSummary } from './catalog';
import { lookupTokens, type TokenSource } from './tokens';

/**
 * 패키지에 동봉되어 배포되는 조회 CLI.
 *
 *   npx @berrypjh/react-ui api Button
 *
 * 저장소가 아니라 **설치된 패키지 안**에서 읽는다. 데이터 파일은 이 스크립트와 같은
 * `dist/` 안에 있으므로 node_modules 레이아웃(pnpm·yarn PnP·호이스팅)에 의존하지 않는다.
 *
 * 조회 로직은 `catalog.ts` / `tokens.ts`의 순수 함수를 그대로 번들한다 — 저장소 내부
 * `pnpm ui:lookup`과 같은 구현이다.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));

const readJson = async <T>(file: string, hint: string): Promise<T> => {
  try {
    return JSON.parse(await fs.readFile(path.join(HERE, file), 'utf8')) as T;
  } catch {
    throw new Error(`${file} is missing from this package — ${hint}`);
  }
};

const loadCatalog = (): Promise<Catalog> =>
  readJson<Catalog>('llm-catalog.json', 'reinstall the package or report an issue.');

const loadTokens = (): Promise<TokenSource> =>
  readJson<TokenSource>('tokens.json', 'reinstall the package or report an issue.');

const usage = (name: string): string =>
  [
    `${name} — offline API lookup for AI agents and humans.`,
    '',
    'usage:',
    `  npx ${name} summary                     패키지 지형 (심볼 수, 컴포넌트 목록)`,
    `  npx ${name} find <query> [--limit=N]    심볼 후보 검색`,
    `  npx ${name} api <Symbol> [--signature]  정확한 prop 계약`,
    `  npx ${name} token <path> [--limit=N]    토큰 조회 (exact / prefix / category)`,
    '',
    'Everything is read from this package, offline. Output is JSON.',
  ].join('\n');

type Flags = { limit?: number; signature: boolean };

const parseFlags = (args: string[]): Flags => {
  const limit = args.find((a) => a.startsWith('--limit='))?.slice('--limit='.length);
  return { limit: limit ? Number(limit) : undefined, signature: args.includes('--signature') };
};

const main = async (): Promise<void> => {
  const [command, ...rest] = process.argv.slice(2);
  const positional = rest.filter((a) => !a.startsWith('--'));
  const flags = parseFlags(rest);
  const emit = (value: unknown) => console.log(JSON.stringify(value, null, 2));

  if (command === 'token') {
    const query = positional[0];
    if (!query) throw new Error('token needs a path, prefix or category');
    emit(
      lookupTokens(await loadTokens(), query, {
        ...(flags.limit ? { limit: flags.limit } : {}),
      }),
    );
    return;
  }

  const catalog = await loadCatalog();
  const catalogs: CatalogSet = { [catalog.package]: catalog };

  switch (command) {
    case 'summary':
      emit(packageSummary(catalog));
      return;

    case 'find': {
      const query = positional[0];
      if (!query) throw new Error('find needs a query');
      emit(discover(catalogs, query, flags.limit ? { limit: flags.limit } : {}));
      return;
    }

    case 'api': {
      const symbol = positional[0];
      if (!symbol) throw new Error('api needs a symbol name');
      emit(getApi(catalogs, catalog.package, symbol, flags.signature ? 'signature' : 'full'));
      return;
    }

    default:
      throw new Error(usage(catalog.package));
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
