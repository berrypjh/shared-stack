import fs from 'node:fs/promises';
import path from 'node:path';

import { REPO_ROOT, TARGETS } from '../scripts/generate-consumer-catalog/config';
import { catalogSchema } from '../scripts/generate-consumer-catalog/schema';

import type { CatalogSet } from './catalog';
import type { TokenSource } from './tokens';

/**
 * 이 저장소의 빌드 산출물에서 카탈로그·토큰을 읽는다.
 *
 * 저장소 경로에 묶인 코드는 여기에만 둔다. `catalog.ts`/`tokens.ts`의 조회 로직은
 * 순수 함수라, 패키지에 동봉되는 CLI가 그대로 번들할 수 있다.
 */

export const loadCatalogs = async (ids: string[] = Object.keys(TARGETS)): Promise<CatalogSet> => {
  const out: CatalogSet = {};
  for (const id of ids) {
    const target = TARGETS[id];
    if (!target) throw new Error(`unknown catalog target "${id}"`);
    const file = path.join(REPO_ROOT, target.packageRoot, target.outputFile);
    let raw: string;
    try {
      raw = await fs.readFile(file, 'utf8');
    } catch {
      throw new Error(`missing ${target.outputFile} for ${id} — run \`pnpm catalog:gen\` first.`);
    }
    const catalog = catalogSchema.parse(JSON.parse(raw));
    out[catalog.package] = catalog;
  }
  return out;
};

export const loadTokenSource = async (targetId = 'react-ui'): Promise<TokenSource> => {
  const target = TARGETS[targetId];
  if (!target) throw new Error(`unknown token target "${targetId}"`);
  const file = path.join(REPO_ROOT, target.packageRoot, 'dist', target.tokenCatalog);
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as TokenSource;
  } catch {
    throw new Error(`missing ${target.tokenCatalog} for ${targetId} — build the package first.`);
  }
};
