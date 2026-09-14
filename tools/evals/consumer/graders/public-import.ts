import fs from 'node:fs/promises';
import path from 'node:path';

import ts from 'typescript';

import { type PackageJsonLike, publicSpecifiers } from '../../../lib/package-exports';
import { fromRepoRoot } from '../runner/paths';
import type { ChangedFile } from '../runner/schema';

/**
 * 변경된 consumer 코드의 module specifier를 검사한다.
 *
 * 허용 규칙은 하드코딩하지 않고 `libs/＊/package.json`의 `exports`에서 읽는다.
 * regex 대신 이미 설치된 TypeScript Compiler API로 specifier를 추출해
 * 주석·문자열 오탐을 피한다.
 */

export type PackageSurface = {
  name: string;
  /** exports map에서 파생한 허용 specifier 전체 (root + subpath). */
  publicSpecifiers: string[];
  /** `private: true` 패키지는 소비자가 직접 import하면 안 된다. */
  consumerFacing: boolean;
};

export const VIOLATION_KINDS = [
  'deep-source-import',
  'private-package-import',
  'unknown-subpath',
  'relative-lib-escape',
] as const;

export type ViolationKind = (typeof VIOLATION_KINDS)[number];

export type ImportViolation = { file: string; specifier: string; kind: ViolationKind };

export type PublicImportGrade = {
  filesChecked: number;
  specifiers: string[];
  violations: ImportViolation[];
  passed: boolean;
};

/** workspace의 실제 package surface를 읽는다. */
export const loadPackageSurfaces = async (
  libsDir: string = fromRepoRoot('libs'),
): Promise<PackageSurface[]> => {
  const entries = await fs.readdir(libsDir, { withFileTypes: true });
  const surfaces: PackageSurface[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const file = path.join(libsDir, e.name, 'package.json');
    let pkg: PackageJsonLike;
    try {
      pkg = JSON.parse(await fs.readFile(file, 'utf8')) as PackageJsonLike;
    } catch {
      continue;
    }
    if (!pkg.name) continue;
    surfaces.push({
      name: pkg.name,
      publicSpecifiers: publicSpecifiers(pkg.name, pkg.exports),
      consumerFacing: pkg.private !== true,
    });
  }
  return surfaces.sort((a, b) => a.name.localeCompare(b.name));
};

/** import / export-from / require() / dynamic import()의 specifier를 모두 뽑는다. */
export const extractModuleSpecifiers = (file: ChangedFile): string[] => {
  const source = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    file.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const out: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      out.push(node.moduleSpecifier.text);
    } else if (ts.isCallExpression(node)) {
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      const isDynamic = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const arg = node.arguments[0];
      if ((isRequire || isDynamic) && arg && ts.isStringLiteral(arg)) out.push(arg.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
};

const SCRIPT_FILE = /\.(m|c)?[jt]sx?$/;

const packageOf = (specifier: string): string =>
  specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];

const classify = (specifier: string, surfaces: PackageSurface[]): ViolationKind | null => {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    return /(^|\/)libs\//.test(specifier) ? 'relative-lib-escape' : null;
  }
  if (/(^|\/)libs\/[^/]+\/src(\/|$)/.test(specifier)) return 'deep-source-import';

  const surface = surfaces.find((s) => s.name === packageOf(specifier));
  if (!surface) return null;
  if (!surface.consumerFacing) return 'private-package-import';
  if (specifier.startsWith(`${surface.name}/src`)) return 'deep-source-import';
  return surface.publicSpecifiers.includes(specifier) ? null : 'unknown-subpath';
};

export const gradePublicImport = (
  files: ChangedFile[],
  surfaces: PackageSurface[],
): PublicImportGrade => {
  const specifiers: string[] = [];
  const violations: ImportViolation[] = [];
  const scripts = files.filter((f) => SCRIPT_FILE.test(f.path));
  for (const file of scripts) {
    for (const specifier of extractModuleSpecifiers(file)) {
      specifiers.push(specifier);
      const kind = classify(specifier, surfaces);
      if (kind) violations.push({ file: file.path, specifier, kind });
    }
  }
  return {
    filesChecked: scripts.length,
    specifiers,
    violations,
    passed: violations.length === 0,
  };
};
