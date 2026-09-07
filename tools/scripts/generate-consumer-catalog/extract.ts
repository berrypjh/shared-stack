import ts from 'typescript';

import {
  type CatalogProp,
  type CatalogSymbol,
  MAX_INLINE_VALUES,
  MAX_TYPE_TEXT,
  type SymbolKind,
} from './schema';

/**
 * 번들된 public declaration에서 exact API fact를 뽑는다.
 *
 * ## inherited prop 필터 기준
 *
 * prop의 **선언이 번들 declaration 파일 안에 있을 때만** 싣는다.
 * React `ComponentPropsWithRef<'button'>`이나 RN `ViewProps`처럼 선언이
 * `node_modules`(또는 lib.dom)에 있는 prop은 제외한다. 이 라이브러리가 정의한
 * 계약만 남기고, DOM/RN 상속 prop 수백 개로 카탈로그가 폭발하는 것을 막는다.
 * (`Button` 기준: 라이브러리 prop 14개 vs 상속 prop 284개.)
 */

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.Latest,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  skipLibCheck: true,
  jsx: ts.JsxEmit.ReactJSX,
  noEmit: true,
};

const ELEMENT_TYPE_NAMES = new Set(['Element', 'ReactElement']);

type Ctx = { checker: ts.TypeChecker; file: string };

const unionParts = (type: ts.Type): ts.Type[] => (type.isUnion() ? type.types : [type]);

const isNullish = (type: ts.Type): boolean =>
  (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)) !== 0;

/** JSX를 반환하는 호출 시그니처면 컴포넌트로 본다. */
const returnsElement = (signature: ts.Signature): boolean => {
  const parts = unionParts(signature.getReturnType()).filter((t) => !isNullish(t));
  return (
    parts.length > 0 && parts.every((t) => ELEMENT_TYPE_NAMES.has(t.getSymbol()?.getName() ?? ''))
  );
};

/**
 * intersection prop은 선언이 여러 곳에 있을 수 있다 (`NativeBoxProps`의 `style`은
 * 라이브러리 리터럴과 RN `ViewProps` 양쪽에 있다). 라이브러리가 스스로 선언한
 * 쪽이 하나라도 있으면 그 선언을 쓴다.
 */
const ownDeclaration = (ctx: Ctx, symbol: ts.Symbol): ts.Declaration | undefined =>
  symbol.declarations?.find((d) => d.getSourceFile().fileName === ctx.file);

/** checker가 확장한 텍스트 대신 선언에 적힌 타입 텍스트를 쓴다 (`ColorToken` 유지). */
const declaredTypeText = (symbol: ts.Symbol, declaration?: ts.Declaration): string | null => {
  const decl = declaration ?? symbol.declarations?.[0];
  if (!decl) return null;
  const node = (decl as { type?: ts.TypeNode }).type;
  if (!node) return null;
  return node.getText().replace(/\s+/g, ' ').trim();
};

const literalValues = (
  ctx: Ctx,
  symbol: ts.Symbol,
  declaration?: ts.Declaration,
): (string | number)[] | null => {
  const decl = declaration ?? symbol.declarations?.[0];
  if (!decl) return null;
  const type = ctx.checker.getTypeOfSymbolAtLocation(symbol, decl);
  const parts = unionParts(type).filter((t) => !isNullish(t));
  if (parts.length === 0 || !parts.every((t) => t.isStringLiteral() || t.isNumberLiteral())) {
    return null;
  }
  return parts.map((t) => (t as ts.StringLiteralType | ts.NumberLiteralType).value);
};

const withTypeText = (text: string | null): { type: string | null; typeOmitted?: true } =>
  text === null
    ? { type: null }
    : text.length > MAX_TYPE_TEXT
      ? { type: null, typeOmitted: true }
      : { type: text };

/** 이 라이브러리가 선언한 prop만. 나머지는 상속 prop으로 보고 버린다. */
const ownProperties = (
  ctx: Ctx,
  type: ts.Type,
): { symbol: ts.Symbol; declaration: ts.Declaration }[] =>
  ctx.checker.getPropertiesOfType(type).flatMap((symbol) => {
    const declaration = ownDeclaration(ctx, symbol);
    return declaration ? [{ symbol, declaration }] : [];
  });

const mergeProps = (ctx: Ctx, constituents: ts.Type[]): Record<string, CatalogProp> => {
  const texts = new Map<string, Set<string>>();
  const requiredIn = new Map<string, number>();
  const values = new Map<string, (string | number)[] | null>();

  for (const constituent of constituents) {
    for (const { symbol, declaration } of ownProperties(ctx, constituent)) {
      const name = symbol.getName();
      if (!texts.has(name)) {
        texts.set(name, new Set());
        values.set(name, literalValues(ctx, symbol, declaration));
      }
      const text = declaredTypeText(symbol, declaration);
      if (text) texts.get(name)?.add(text);
      if ((symbol.getFlags() & ts.SymbolFlags.Optional) === 0) {
        requiredIn.set(name, (requiredIn.get(name) ?? 0) + 1);
      }
    }
  }

  const out: Record<string, CatalogProp> = {};
  for (const name of [...texts.keys()].sort()) {
    const text = [...(texts.get(name) ?? [])].sort().join(' | ');
    const literal = values.get(name);
    const prop: CatalogProp = {
      ...withTypeText(text || null),
      // union props 타입에서는 모든 분기에서 필수일 때만 필수로 본다.
      required: requiredIn.get(name) === constituents.length,
    };
    if (literal) {
      if (literal.length <= MAX_INLINE_VALUES) prop.values = [...literal].sort();
      else prop.valueCount = literal.length;
    }
    out[name] = prop;
  }
  return out;
};

const kindOf = (ctx: Ctx, symbol: ts.Symbol, signatures: readonly ts.Signature[]): SymbolKind => {
  if (symbol.getFlags() & ts.SymbolFlags.ValueModule) return 'namespace';
  if (signatures.length === 0) {
    return symbol.valueDeclaration || symbol.getFlags() & ts.SymbolFlags.Variable
      ? 'value'
      : 'type';
  }
  if (signatures.some(returnsElement)) return 'component';
  return /^use[A-Z]/.test(symbol.getName()) ? 'hook' : 'function';
};

export type ExtractOptions = { declarationFile: string; importFrom: string };

export const extractSymbols = (options: ExtractOptions): Record<string, CatalogSymbol> => {
  const { declarationFile, importFrom } = options;
  const program = ts.createProgram([declarationFile], COMPILER_OPTIONS);
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(declarationFile);
  if (!source) throw new Error(`cannot read declaration file ${declarationFile}`);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`${declarationFile} is not a module`);

  const ctx: Ctx = { checker, file: declarationFile };
  const exported = checker.getExportsOfModule(moduleSymbol);
  const publicNames = new Set(exported.map((s) => s.getName()));

  const symbols: Record<string, CatalogSymbol> = {};
  for (const entry of [...exported].sort((a, b) => a.getName().localeCompare(b.getName()))) {
    const symbol =
      entry.getFlags() & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(entry) : entry;
    const decl = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!decl) continue;

    const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
    const signatures = type.getCallSignatures();
    const kind = kindOf(ctx, symbol, signatures);
    const record: CatalogSymbol = { kind, importFrom };

    // alias(재export)와 원 선언 양쪽을 본다 — `@deprecated`는 보통 원 선언에 붙는다.
    const deprecated = [entry, symbol].some((s) =>
      s.getJsDocTags(checker).some((tag) => tag.name === 'deprecated'),
    );
    if (deprecated) record.deprecated = true;

    if (kind === 'component') {
      const parameter = signatures[0]?.getParameters()[0];
      if (parameter) {
        const paramDecl = parameter.valueDeclaration ?? decl;
        const paramType = checker.getTypeOfSymbolAtLocation(parameter, paramDecl);
        const name = checker.typeToString(paramType);
        // 번들러가 붙인 내부 이름($1/_2)은 공개 export가 아니므로 null로 둔다.
        record.propsType = publicNames.has(name) ? name : null;
        const constituents = unionParts(paramType);
        if (constituents.length > 1) record.propsUnion = true;
        record.props = mergeProps(ctx, constituents);
      } else {
        record.props = {};
      }
    } else if (kind !== 'type' && kind !== 'namespace') {
      Object.assign(record, withTypeText(declaredTypeText(symbol)));
    }

    symbols[entry.getName()] = record;
  }
  return symbols;
};
