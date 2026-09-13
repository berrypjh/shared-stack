import rawCatalog from '@berrypjh/react-ui/catalog';

/**
 * 생성된 public consumer catalog 를 **좁게** 읽는 adapter.
 *
 * 역할은 검증이다 — Designer UI 를 여기서 자동 생성하지 않는다. 그래서 앱 번들이 아니라
 * 테스트에서만 import 한다 (`catalog-contract.spec`).
 *
 * `@berrypjh/react-ui/catalog` 는 package.json 의 공개 subpath export 다. 라이브러리 내부
 * 경로를 deep import 하지 않고, 이 파일이 스키마 전체를 다시 적지도 않는다 — 필요한 field 만
 * `unknown` 에서 좁힌다.
 */

export type CatalogProp = {
  type: string | null;
  required: boolean;
  /** literal union 일 때만. 아래 `allowedLiterals` 의 근거 중 하나다. */
  values?: readonly (string | number)[];
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const asProp = (v: unknown): CatalogProp | undefined => {
  if (!isRecord(v)) return undefined;
  const { type, required, values } = v;
  return {
    type: typeof type === 'string' ? type : null,
    required: required === true,
    values: Array.isArray(values)
      ? values.filter((x): x is string | number => typeof x === 'string' || typeof x === 'number')
      : undefined,
  };
};

const symbols = (): Record<string, unknown> => {
  if (!isRecord(rawCatalog)) throw new Error('consumer catalog: 객체가 아니다');
  const { symbols: s } = rawCatalog;
  if (!isRecord(s)) throw new Error('consumer catalog: symbols 가 없다');
  return s;
};

export const catalogPackage = (): string => {
  const pkg = isRecord(rawCatalog) ? rawCatalog.package : undefined;
  return typeof pkg === 'string' ? pkg : '';
};

export const hasSymbol = (symbol: string): boolean => symbol in symbols();

/** 해당 symbol 의 public prop 이름 전체. 없는 symbol 은 빈 집합이다. */
export const propNamesOf = (symbol: string): readonly string[] => {
  const entry = symbols()[symbol];
  if (!isRecord(entry)) return [];
  const { props } = entry;
  return isRecord(props) ? Object.keys(props) : [];
};

export const propOf = (symbol: string, prop: string): CatalogProp | undefined => {
  const entry = symbols()[symbol];
  if (!isRecord(entry)) return undefined;
  const { props } = entry;
  if (!isRecord(props)) return undefined;
  return asProp(props[prop]);
};

/** `type` 텍스트 안의 문자열 literal. `"circular" | "extended"` → ['circular','extended'] */
const literalsInTypeText = (type: string | null): readonly string[] =>
  type === null ? [] : [...type.matchAll(/"([^"]*)"/g)].map((m) => m[1]);

/**
 * 허용된 literal 값.
 *
 * 카탈로그는 값을 두 곳에 적는다 — `values` 배열과 `type` 텍스트. 판별 유니온 컴포넌트에서는
 * `values` 가 한쪽 분기만 담는다: `Fab.shape` 의 `type` 은 `"circular" | "extended"` 인데
 * `values` 는 `["circular"]` 뿐이다. 그래서 둘의 **합집합**을 쓴다. 한쪽만 믿으면 실제 공개
 * 값을 drift 로 오판한다.
 *
 * 이름 붙은 타입(`ButtonVariant`)은 텍스트에 literal 이 없어 `values` 만 남으므로, 검증은
 * 여전히 엄격하다 — `ghost` 는 어느 쪽에도 없어 걸린다.
 */
export const allowedLiterals = (symbol: string, prop: string): readonly string[] => {
  const entry = propOf(symbol, prop);
  if (!entry) return [];
  const fromValues = (entry.values ?? []).map(String);
  return [...new Set([...fromValues, ...literalsInTypeText(entry.type)])];
};

/** boolean prop 인지 — `boolean`, `false | true`, 유니온 잔재(`boolean | never`)를 모두 인정한다. */
export const acceptsBoolean = (symbol: string, prop: string): boolean => {
  const entry = propOf(symbol, prop);
  if (!entry?.type) return false;
  return (
    /\bboolean\b/.test(entry.type) || /\bfalse\b/.test(entry.type) || /\btrue\b/.test(entry.type)
  );
};

export const requiredPropsOf = (symbol: string): readonly string[] => {
  const entry = symbols()[symbol];
  if (!isRecord(entry)) return [];
  const { props } = entry;
  if (!isRecord(props)) return [];
  return Object.entries(props)
    .filter(([, v]) => asProp(v)?.required === true)
    .map(([k]) => k);
};
