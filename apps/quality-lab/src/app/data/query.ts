import { runIdSchema } from '@berrypjh/observability-contracts';

/**
 * URL query 는 허용 목록으로만 읽는다. 같은 주소는 같은 화면이어야 해서, 모르는 key·중복·형식이
 * 틀린 값을 조용히 버리지 않고 이유와 함께 거부한다.
 */

export const QUERY_KEYS = [
  'run',
  'base',
  'package',
  'variant',
  'panel',
  'platform',
  'target',
  'status',
  'q',
  'series',
] as const;
export type QueryKey = (typeof QUERY_KEYS)[number];
export type Query = Partial<Record<QueryKey, string>>;
export type QuerySpec = {
  keys: readonly QueryKey[];
  statuses?: readonly string[];
  panels?: readonly string[];
};
export type ParsedQuery = { ok: true; value: Query } | { ok: false; issues: string[] };

const PACKAGE = /^@?[\w.-]+(\/[\w.-]+)?$/;
const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;
const PLATFORMS = ['web', 'react-native'];
const Q_MAX = 100;

const isQueryKey = (key: string): key is QueryKey =>
  (QUERY_KEYS as readonly string[]).includes(key);

const oneOf = (key: string, raw: string, allowed: readonly string[] = []) =>
  allowed.includes(raw) ? null : `${key} 은 ${allowed.join(', ')} 중 하나여야 합니다`;

const valueIssue = (key: QueryKey, raw: string, spec: QuerySpec): string | null => {
  switch (key) {
    case 'run':
    case 'base':
      return runIdSchema.safeParse(raw).success
        ? null
        : `${key} 은 소문자 kebab-case 실행 id 여야 합니다: ${raw}`;
    case 'package':
      return PACKAGE.test(raw) ? null : `package 이름 형식이 아닙니다: ${raw}`;
    case 'variant':
      return SLUG.test(raw) ? null : `variant 는 소문자 kebab-case id 여야 합니다: ${raw}`;
    case 'panel':
      return oneOf('panel', raw, spec.panels);
    case 'platform':
      return oneOf('platform', raw, PLATFORMS);
    case 'target':
      return /^[\w.:/@-]{1,200}$/.test(raw) ? null : `target 은 검사 대상 id 형식이어야 합니다`;
    case 'status':
      return spec.statuses?.includes(raw)
        ? null
        : `status 는 ${(spec.statuses ?? []).join(', ')} 중 하나여야 합니다`;
    case 'series':
      return /^[\w.:/@-]{1,300}$/.test(raw) ? null : 'series 는 지표 id 형식이어야 합니다';
    case 'q':
      return raw.length <= Q_MAX && !/\p{Cc}/u.test(raw)
        ? null
        : `q 는 ${Q_MAX}자 이하의 한 줄 글이어야 합니다`;
  }
};

export const parseQuery = (search: URLSearchParams, spec: QuerySpec): ParsedQuery => {
  const issues: string[] = [];
  const value: Query = {};
  const seen = new Set<string>();
  for (const [key, raw] of search.entries()) {
    if (!isQueryKey(key)) {
      issues.push(`알 수 없는 query: ${key}`);
      continue;
    }
    if (!spec.keys.includes(key)) {
      issues.push(`이 페이지는 ${key} 를 받지 않습니다`);
      continue;
    }
    if (seen.has(key)) {
      issues.push(`${key} 이 두 번 있습니다`);
      continue;
    }
    seen.add(key);
    const issue = valueIssue(key, raw, spec);
    if (issue) issues.push(issue);
    else value[key] = raw;
  }
  return issues.length > 0 ? { ok: false, issues } : { ok: true, value };
};

/** 정해진 key 순서로 쓰고 빈 값은 뺀다. 결과는 `?` 로 시작하거나 빈 문자열이다. */
export const queryString = (values: Query): string => {
  const entries = QUERY_KEYS.flatMap((key) =>
    values[key] ? [[key, values[key]] as [string, string]] : [],
  );
  const text = new URLSearchParams(entries).toString();
  return text ? `?${text}` : '';
};
