import { describe, expect, it } from 'vitest';

import {
  containsSecret,
  evidenceRefSchema,
  EXCERPT_MAX,
  isPublicEvidencePath,
  isSafeRelativePath,
  sanitizeExcerpt,
} from '../src/index.js';

import { HASH } from './fixtures.js';

describe('상대 경로', () => {
  it.each(['../secrets', 'a/../../b', '/etc/passwd', 'C:/x', 'a\\b', './a', 'a//b', ''])(
    '%j 는 거부한다',
    (path) => {
      expect(isSafeRelativePath(path)).toBe(false);
    },
  );

  it.each(['libs/react-ui/package.json', '.github/workflows/pr-check.yml'])(
    '%j 는 허용한다',
    (path) => {
      expect(isSafeRelativePath(path)).toBe(true);
    },
  );

  it('file evidence 는 traversal 경로를 가질 수 없다', () => {
    const ref = { source: 'file', path: '../outside.json', sha256: HASH, excerpt: null };
    expect(evidenceRefSchema.safeParse(ref).success).toBe(false);
  });
});

describe('URL allowlist', () => {
  const url = (value: string) => evidenceRefSchema.safeParse({ source: 'url', url: value }).success;

  it('https github.com 만 허용한다', () => {
    expect(url('https://github.com/berrypjh/shared-stack/actions/runs/1')).toBe(true);
  });

  it.each([
    'http://github.com/berrypjh/shared-stack',
    'https://github.com.evil.example/x',
    'https://evil.example/github.com',
    ['javascript', 'alert(1)'].join(':'),
  ])('%s 는 거부한다', (value) => {
    expect(url(value)).toBe(false);
  });
});

describe('발췌', () => {
  const token = `npm_${'a'.repeat(36)}`;

  it('credential 형태가 남은 발췌는 schema 가 거부한다', () => {
    const ref = {
      source: 'command',
      commandId: 'test.quality-lab',
      exitCode: 1,
      excerpt: `auth ${token}`,
    };
    expect(evidenceRefSchema.safeParse(ref).success).toBe(false);
  });

  it('정제는 credential 을 가리고 홈 경로를 줄이고 ANSI 를 지우고 길이를 제한한다', () => {
    const raw = `at /Users/park/x.ts ${token} \u001b[31mred\u001b[0m ${'x'.repeat(EXCERPT_MAX)}`;
    const out = sanitizeExcerpt(raw);
    expect(out.length).toBeLessThanOrEqual(EXCERPT_MAX);
    expect(out).toContain('~/x.ts');
    expect(out).toContain('[redacted]');
    expect(out).not.toContain('\u001b');
    expect(containsSecret(out)).toBe(false);
  });
});

describe('공개 export 에서 제외하는 경로', () => {
  it.each([
    'raw/vitest.json',
    'runs/fixture/raw/trace.json',
    'tmp/llm-evals/heldout-1/traces.jsonl',
    'tools/evals/consumer/datasets/test.jsonl',
    '.env',
    'config/.env.local',
    'certs/dev.key',
    '.npmrc',
  ])('%j 는 공개하지 않는다', (path) => {
    expect(isPublicEvidencePath(path)).toBe(false);
  });

  it.each(['libs/react-ui/package.json', '.github/workflows/pr-check.yml'])(
    '%j 는 공개할 수 있다',
    (path) => {
      expect(isPublicEvidencePath(path)).toBe(true);
    },
  );
});
