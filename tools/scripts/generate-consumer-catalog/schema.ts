import { z } from 'zod';

/**
 * Generated consumer catalog schema.
 *
 * 역할 분담:
 *   AGENTS.md         usage rule / platform semantics / gotcha
 *   llm-catalog.json  exact public export·symbol·component prop  ← 이 파일
 *   tokens.json       exact token inventory
 *
 * handwritten manifest가 아니라 build 산출물이다. 직접 편집하지 않는다.
 */

export const SCHEMA_VERSION = 1;

/** 리터럴 union을 그대로 실을 최대 개수. 넘으면 값 대신 개수만 남긴다. */
export const MAX_INLINE_VALUES = 12;
/** 타입 텍스트 최대 길이. 넘으면 잘라내지 않고 omit 상태를 명시한다. */
export const MAX_TYPE_TEXT = 160;

export const SYMBOL_KINDS = [
  'component',
  'hook',
  'function',
  'value',
  'namespace',
  'type',
] as const;

export const platformSchema = z.enum(['web', 'react-native']);

export const propSchema = z.object({
  /** 선언에 적힌 타입 텍스트. 너무 길면 null이고 `typeOmitted`가 선다. */
  type: z.string().nullable(),
  required: z.boolean(),
  /** 리터럴 union일 때만. MAX_INLINE_VALUES 초과 시 생략된다. */
  values: z.array(z.union([z.string(), z.number()])).optional(),
  /** values를 생략했을 때의 실제 union 크기 — 0으로 뭉개지 않는다. */
  valueCount: z.number().int().positive().optional(),
  typeOmitted: z.literal(true).optional(),
});

export const symbolSchema = z.object({
  kind: z.enum(SYMBOL_KINDS),
  importFrom: z.string().min(1),
  /** props 타입 이름. 공개 export가 아니면 null (props map이 실제 계약). */
  propsType: z.string().nullable().optional(),
  /** props 타입이 union이면 true — 분기마다 필수 prop이 다르다는 뜻. */
  propsUnion: z.literal(true).optional(),
  props: z.record(z.string(), propSchema).optional(),
  /** 비컴포넌트 value의 선언 타입 텍스트. */
  type: z.string().nullable().optional(),
  typeOmitted: z.literal(true).optional(),
  /** 선언에 `@deprecated`가 붙어 있으면 true — 소비자에게 추천하지 않는다. */
  deprecated: z.literal(true).optional(),
});

export const catalogSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  package: z.string().min(1),
  platform: platformSchema,
  /** 토큰 인벤토리는 복제하지 않고 포인터만 둔다. */
  tokenCatalog: z.string().nullable(),
  /** subpath → public specifier. package.json exports에서 유도. */
  exports: z.record(z.string(), z.string()),
  symbols: z.record(z.string(), symbolSchema),
});

export type Platform = z.infer<typeof platformSchema>;
export type CatalogProp = z.infer<typeof propSchema>;
export type CatalogSymbol = z.infer<typeof symbolSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type SymbolKind = (typeof SYMBOL_KINDS)[number];

/** Command 01의 evidence ID convention. catalog에 중복 저장하지 않고 여기서 계산한다. */
export const evidenceIdsOf = (catalog: Catalog): string[] => {
  const ids = [`package:${catalog.package}`];
  for (const [name, symbol] of Object.entries(catalog.symbols)) {
    const prefix =
      symbol.kind === 'component' ? 'component' : symbol.kind === 'type' ? null : 'export';
    if (prefix) ids.push(`${prefix}:${catalog.package}#${name}`);
    for (const prop of Object.keys(symbol.props ?? {})) {
      ids.push(`prop:${catalog.package}#${name}.${prop}`);
    }
  }
  return ids;
};

const line = (indent: string, key: string, value: unknown): string =>
  `${indent}${JSON.stringify(key)}: ${JSON.stringify(value)}`;

/**
 * 결정적 직렬화. 키는 이미 정렬된 상태로 들어오고, prop 한 개는 한 줄로 적어
 * `genCatalog.ts`의 슬림 카탈로그와 같은 톤을 유지한다.
 */
export const serializeCatalog = (catalog: Catalog): string => {
  const out: string[] = ['{'];
  out.push(line('  ', 'schemaVersion', catalog.schemaVersion) + ',');
  out.push(line('  ', 'package', catalog.package) + ',');
  out.push(line('  ', 'platform', catalog.platform) + ',');
  out.push(line('  ', 'tokenCatalog', catalog.tokenCatalog) + ',');
  out.push(line('  ', 'exports', catalog.exports) + ',');
  out.push('  "symbols": {');

  const names = Object.keys(catalog.symbols);
  names.forEach((name, i) => {
    const symbol = catalog.symbols[name];
    const { props, ...head } = symbol;
    const tail = i === names.length - 1 ? '' : ',';
    if (!props) {
      out.push(`    ${JSON.stringify(name)}: ${JSON.stringify(head)}${tail}`);
      return;
    }
    out.push(`    ${JSON.stringify(name)}: {`);
    for (const [key, value] of Object.entries(head)) out.push(line('      ', key, value) + ',');
    out.push('      "props": {');
    const propNames = Object.keys(props);
    propNames.forEach((propName, j) => {
      out.push(
        `        ${JSON.stringify(propName)}: ${JSON.stringify(props[propName])}` +
          (j === propNames.length - 1 ? '' : ','),
      );
    });
    out.push('      }');
    out.push(`    }${tail}`);
  });

  out.push('  }', '}', '');
  return out.join('\n');
};
