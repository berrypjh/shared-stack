import fs from 'node:fs/promises';
import path from 'node:path';

import { exportEntries, type PackageJsonLike } from '../../lib/package-exports';

import { type CatalogTarget, REPO_ROOT } from './config';
import { extractSymbols } from './extract';
import { type Catalog, catalogSchema, SCHEMA_VERSION, serializeCatalog } from './schema';

const abs = (target: CatalogTarget, rel: string): string =>
  path.join(REPO_ROOT, target.packageRoot, rel);

const exists = (file: string): Promise<boolean> =>
  fs
    .access(file)
    .then(() => true)
    .catch(() => false);

/** 번들 declaration + package.json exports → catalog. 파일은 쓰지 않는다. */
export const buildCatalog = async (target: CatalogTarget): Promise<Catalog> => {
  const pkg = JSON.parse(await fs.readFile(abs(target, 'package.json'), 'utf8')) as PackageJsonLike;
  if (!pkg.name) throw new Error(`${target.packageRoot}/package.json has no name`);

  const declarationFile = abs(target, target.declarationFile);
  if (!(await exists(declarationFile))) {
    throw new Error(
      `missing ${target.declarationFile} — build ${pkg.name} declarations before the catalog.`,
    );
  }

  const tokenCatalog = path.join(path.dirname(target.outputFile), target.tokenCatalog);

  return catalogSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    package: pkg.name,
    platform: target.platform,
    tokenCatalog: (await exists(abs(target, tokenCatalog))) ? target.tokenCatalog : null,
    exports: exportEntries(pkg.name, pkg.exports),
    symbols: extractSymbols({ declarationFile, importFrom: pkg.name }),
  });
};

export const writeCatalog = async (
  target: CatalogTarget,
): Promise<{ catalog: Catalog; outFile: string }> => {
  const catalog = await buildCatalog(target);
  const outFile = abs(target, target.outputFile);
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, serializeCatalog(catalog), 'utf8');
  return { catalog, outFile };
};
