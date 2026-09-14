import { z } from 'zod';

/** artifact·index·manifest 공통 schema 버전. 호환되지 않게 바뀔 때만 올린다. */
export const SCHEMA_VERSION = 1;
export const schemaVersionSchema = z.literal(SCHEMA_VERSION);

/** 출처를 모르면 `null` 이 아니라 `'unknown'` 이다 — 비어 있음과 모름을 구분한다. */
export const UNKNOWN = 'unknown';
export const orUnknown = <T extends z.ZodType>(schema: T) => z.union([schema, z.literal(UNKNOWN)]);

/** 디렉터리 이름으로 그대로 쓰므로 경로 문자가 없다. */
export const runIdSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,62}$/, 'run id: lowercase kebab-case, max 63 chars');
export const gitShaSchema = z.string().regex(/^[0-9a-f]{40}$/, 'full 40-char git sha');
export const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/, 'sha256 hex digest');
export const isoTimeSchema = z.iso.datetime({ offset: true });
export const scopeSchema = z.string().regex(/^[@\w./-]{1,120}$/, 'scope: package or project name');
export const commandIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:[.:-][a-z0-9]+)*$/, 'registered command id');
export const metricIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, 'metric id');
/** 값이 없거나 판정한 이유. 공백만 있는 이유는 이유가 아니다. */
export const reasonSchema = z.string().trim().min(1).max(500);
export const countSchema = z.number().int().nonnegative();
export const nonNegativeSchema = z.number().nonnegative();

/** 정규화된 POSIX 상대 경로. 절대 경로·드라이브·역슬래시·빈/`.`/`..` segment 를 거부한다. */
export const isSafeRelativePath = (path: string): boolean =>
  path.length > 0 &&
  path.length <= 512 &&
  !path.startsWith('/') &&
  !/^[A-Za-z]:/.test(path) &&
  !path.includes('\\') &&
  !path.includes('\0') &&
  path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');

export const relativePathSchema = z
  .string()
  .refine(isSafeRelativePath, 'normalized relative path without traversal');
