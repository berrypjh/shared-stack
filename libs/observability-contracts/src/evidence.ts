import { z } from 'zod';

import {
  commandIdSchema,
  isSafeRelativePath,
  orUnknown,
  relativePathSchema,
  sha256Schema,
} from './primitives.js';

export const EXCERPT_MAX = 500;

/** evidence URL 로 허용하는 host. https 만 받는다. */
export const EVIDENCE_URL_HOSTS = ['github.com'] as const;

const SECRET_PATTERNS: readonly RegExp[] = [
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bnpm_[A-Za-z0-9]{20,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /_authToken\s*=\s*\S+/i,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

const ANSI_ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[A-Za-z]`, 'g');
const HOME_PATH = /\/(?:Users|home)\/[^/\s]+\//g;

export const containsSecret = (text: string): boolean =>
  SECRET_PATTERNS.some((pattern) => pattern.test(text));

/** 명령 출력 발췌를 공개 가능한 형태로. credential 을 가리고 홈 경로를 줄이고 길이를 제한한다. */
export const sanitizeExcerpt = (text: string, max = EXCERPT_MAX): string => {
  let out = text.replace(ANSI_ESCAPE, '').replace(HOME_PATH, '~/');
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(new RegExp(pattern.source, `${pattern.flags}g`), '[redacted]');
  }
  return out.length <= max ? out : `${out.slice(0, max - 1)}…`;
};

export const excerptSchema = z
  .string()
  .max(EXCERPT_MAX)
  .refine((text) => !containsSecret(text), 'excerpt contains credential-like text');

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const evidenceUrlSchema = z.url({
  protocol: /^https$/,
  hostname: new RegExp(`^(?:${EVIDENCE_URL_HOSTS.map(escapeRegExp).join('|')})$`),
});

export const EVIDENCE_SOURCES = ['file', 'command', 'url', 'artifact'] as const;

/** 값이 어디서 왔는지. 출처 종류마다 필요한 필드가 다르다. */
export const evidenceRefSchema = z.discriminatedUnion('source', [
  z.strictObject({
    source: z.literal('file'),
    path: relativePathSchema,
    sha256: orUnknown(sha256Schema),
    excerpt: excerptSchema.nullable(),
  }),
  z.strictObject({
    source: z.literal('command'),
    commandId: commandIdSchema,
    exitCode: z.number().int().nullable(),
    excerpt: excerptSchema.nullable(),
  }),
  z.strictObject({ source: z.literal('url'), url: evidenceUrlSchema }),
  z.strictObject({
    source: z.literal('artifact'),
    path: relativePathSchema,
    sha256: orUnknown(sha256Schema),
  }),
]);

export type EvidenceRef = z.infer<typeof evidenceRefSchema>;

const PRIVATE_EXTENSIONS = ['.key', '.pem', '.p8', '.p12', '.jks', '.mobileprovision'];
/** consumer eval 의 held-out gold. 공개하면 평가가 무의미해진다. */
const HELD_OUT_PREFIX = 'tools/evals/consumer/datasets/test';

/**
 * 공개 export 에 실어도 되는 evidence 경로인지.
 * raw 수집물·`tmp/` 아래 trace·held-out gold·credential 파일은 제외한다.
 */
export const isPublicEvidencePath = (path: string): boolean => {
  if (!isSafeRelativePath(path)) return false;
  const segments = path.split('/');
  const base = segments.at(-1) ?? '';
  return !(
    segments[0] === 'tmp' ||
    segments.includes('raw') ||
    path.startsWith(HELD_OUT_PREFIX) ||
    base.startsWith('.env') ||
    base === '.npmrc' ||
    PRIVATE_EXTENSIONS.some((ext) => base.endsWith(ext))
  );
};
