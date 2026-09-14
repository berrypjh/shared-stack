import fs from 'node:fs/promises';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { tempDir } from './__fixtures__/fixtures';
import { ArtifactError, BoundaryError, readJson, resolveInside, writeJson } from './safe-fs';

let root: string;
let outside: string;

beforeEach(async () => {
  root = await tempDir('root');
  outside = await tempDir('outside');
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
  await fs.rm(outside, { recursive: true, force: true });
});

const kindOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return 'ok';
  } catch (error) {
    return error instanceof ArtifactError ? error.kind : String(error);
  }
};

describe('resolveInside', () => {
  it.each(['../escape.json', 'a/../../escape.json', '/etc/passwd', ''])(
    '%j 는 root 밖이다',
    async (relative) => {
      await expect(resolveInside(root, relative)).rejects.toBeInstanceOf(BoundaryError);
    },
  );

  it('root 밖을 가리키는 디렉터리 symlink 를 따라가지 않는다', async () => {
    await fs.writeFile(path.join(outside, 'secret.json'), '{}');
    await fs.symlink(outside, path.join(root, 'linked'));
    await expect(resolveInside(root, 'linked/secret.json')).rejects.toBeInstanceOf(BoundaryError);
  });

  it('파일 symlink 도 거부한다', async () => {
    await fs.writeFile(path.join(outside, 'secret.json'), '{}');
    await fs.symlink(path.join(outside, 'secret.json'), path.join(root, 'link.json'));
    await expect(resolveInside(root, 'link.json')).rejects.toBeInstanceOf(BoundaryError);
  });

  it('root 는 realpath 기준이다', async () => {
    const alias = path.join(outside, 'alias');
    await fs.symlink(root, alias);
    expect(await resolveInside(alias, 'a.json')).toBe(path.join(await fs.realpath(root), 'a.json'));
  });
});

describe('readJson', () => {
  const schema = z.strictObject({ value: z.number() });
  const put = (relative: string, text: string) => fs.writeFile(path.join(root, relative), text);

  it('없는 파일은 missing', async () => {
    expect(await kindOf(readJson(root, 'none.json', schema))).toBe('missing');
  });

  it('크기 상한을 넘으면 읽지 않는다', async () => {
    await put('big.json', '{"value": 1}');
    expect(await kindOf(readJson(root, 'big.json', schema, 4))).toBe('too-large');
  });

  it('깨진 JSON 은 invalid-json', async () => {
    await put('broken.json', '{"value":');
    expect(await kindOf(readJson(root, 'broken.json', schema))).toBe('invalid-json');
  });

  it('schema 를 어기면 invalid-schema', async () => {
    await put('wrong.json', '{"value":"1"}');
    expect(await kindOf(readJson(root, 'wrong.json', schema))).toBe('invalid-schema');
  });

  it('통과하면 검증된 값을 돌려준다', async () => {
    await put('ok.json', '{"value":0}');
    expect(await readJson(root, 'ok.json', schema)).toEqual({ value: 0 });
  });
});

describe('writeJson', () => {
  it('해시와 크기를 돌려준다', async () => {
    const written = await writeJson(root, 'nested/a.json', { value: 1 });
    const text = await fs.readFile(path.join(root, 'nested/a.json'), 'utf8');
    expect(written).toMatchObject({ path: 'nested/a.json', bytes: Buffer.byteLength(text) });
    expect(written.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('이미 있는 파일을 덮어쓰지 않는다', async () => {
    await writeJson(root, 'a.json', { value: 1 });
    await expect(writeJson(root, 'a.json', { value: 2 })).rejects.toThrow();
    expect(JSON.parse(await fs.readFile(path.join(root, 'a.json'), 'utf8'))).toEqual({ value: 1 });
  });
});
