import path from 'node:path';

import { REPO_ROOT, resolveTargets, TARGETS } from './config';
import { writeCatalog } from './generate';

/**
 * 번들 declaration + package.json exports에서 consumer catalog를 생성한다.
 *
 *   tsx tools/scripts/generate-consumer-catalog/index.ts --target=react-ui
 *
 * declaration 생성 이후에 실행되어야 한다 — 각 package build의 마지막 단계에 붙어 있다.
 */
const main = async (): Promise<void> => {
  const arg = process.argv.slice(2).find((a) => a.startsWith('--target='));
  const ids = arg ? arg.slice('--target='.length).split(',') : Object.keys(TARGETS);
  for (const target of resolveTargets(ids)) {
    const { catalog, outFile } = await writeCatalog(target);
    const count = Object.keys(catalog.symbols).length;
    console.log(
      `${catalog.package.padEnd(28)} symbols=${String(count).padStart(4)}  → ${path.relative(REPO_ROOT, outFile)}`,
    );
  }
};

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
