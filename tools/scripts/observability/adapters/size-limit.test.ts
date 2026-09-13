import fs from 'node:fs/promises';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { tempDir } from '../__fixtures__/fixtures';

import { ReportParseError } from './report';
import { parseSizeLimitReport, readSizeLimitCases } from './size-limit';

/** size-limit 12.1.0 `--json` 실제 출력 일부 (2026-09-13 실행). */
const RESULTS = [
  { name: '@berrypjh/react-ui — cx only', passed: true, size: 10574, sizeLimit: 11000 },
  { name: '@berrypjh/react-native-ui — * (full)', passed: false, size: 15857, sizeLimit: 15100 },
];

describe('parseSizeLimitReport', () => {
  it('성공하면 case 배열이다', () => {
    expect(parseSizeLimitReport(JSON.stringify(RESULTS))).toEqual({
      status: 'results',
      entries: [
        { name: '@berrypjh/react-ui — cx only', size: 10574, sizeLimit: 11000, passed: true },
        {
          name: '@berrypjh/react-native-ui — * (full)',
          size: 15857,
          sizeLimit: 15100,
          passed: false,
        },
      ],
    });
  });

  it('보고하지 않은 필드는 null 이다', () => {
    expect(parseSizeLimitReport(JSON.stringify([{ name: 'x' }]))).toEqual({
      status: 'results',
      entries: [{ name: 'x', size: null, sizeLimit: null, passed: null }],
    });
  });

  it('실패하면 error 객체 하나다 — 부분 결과가 없다', () => {
    const text = JSON.stringify({
      error: 'Error: Cannot find module libs/react-ui/dist/index.esm.js',
    });
    expect(parseSizeLimitReport(text)).toEqual({
      status: 'error',
      message: 'Error: Cannot find module libs/react-ui/dist/index.esm.js',
    });
  });

  it('JSON 이 아니면 corrupt, 배열도 error 도 아니면 invalid', () => {
    const kind = (text: string) => {
      try {
        parseSizeLimitReport(text);
        return 'ok';
      } catch (error) {
        return error instanceof ReportParseError ? error.kind : String(error);
      }
    };
    expect(kind('  ✔ cx only 10.57 kB')).toBe('corrupt');
    expect(kind(JSON.stringify({ results: [] }))).toBe('invalid');
  });
});

describe('readSizeLimitCases', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await tempDir('size-limit-config');
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('import·externals·target·압축·한도 원문을 config 에서 그대로 읽는다', async () => {
    const config = path.join(dir, '.size-limit.cjs');
    await fs.writeFile(
      config,
      `module.exports = [
        { name: 'a — web', path: 'dist/a.js', import: '{ A }', limit: '11 KB', ignore: ['react'],
          modifyEsbuildConfig: (config) => ({ ...config, target: 'es2022' }) },
        { name: 'b — gzip file', path: 'dist/b.js', limit: '1 KiB', gzip: true },
        { name: 'c — raw', path: 'dist/c.js', limit: '2 KB', brotli: false },
      ];`,
    );
    expect(readSizeLimitCases(config)).toEqual([
      {
        name: 'a — web',
        path: 'dist/a.js',
        importSpec: '{ A }',
        limit: '11 KB',
        externals: ['react'],
        target: 'es2022',
        compression: 'brotli',
      },
      {
        name: 'b — gzip file',
        path: 'dist/b.js',
        importSpec: null,
        limit: '1 KiB',
        externals: [],
        target: 'size-limit-default',
        compression: 'gzip',
      },
      {
        name: 'c — raw',
        path: 'dist/c.js',
        importSpec: null,
        limit: '2 KB',
        externals: [],
        target: 'size-limit-default',
        compression: 'none',
      },
    ]);
  });
});
