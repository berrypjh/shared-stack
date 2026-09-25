import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * plugins/berry-dev/scripts/standards.mjs 의 sync · check 계약 (docs/claude-harness/contracts.md).
 *
 * 실제 소비 저장소 대신 임시 consumer 를 만든다. plugin 도 임시 디렉터리에 복사해서 쓴다 —
 * CLI 는 자기 위치에서 source 를 찾으므로, 복사본의 source 를 바꿔 upstream 변경을 흉내 낸다.
 */

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PLUGIN_SOURCE = path.join(REPO_ROOT, 'plugins/berry-dev');
const GEN = '.claude/rules/_generated';
const CORE_ONLY = { schemaVersion: 1, rules: { core: true } };

let tmp: string;
let plugin: string;

beforeEach(() => {
  tmp = realpathSync(mkdtempSync(path.join(tmpdir(), 'berry-dev-cli-')));
  plugin = path.join(tmp, 'plugin');
  cpSync(PLUGIN_SOURCE, plugin, { recursive: true });
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

const sha256 = (bytes: Buffer | string) =>
  `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

const writeJson = (file: string, value: unknown) => writeFileSync(file, JSON.stringify(value));

/** local 파일을 가진 consumer. `.claude/rules` 는 setup 이 이미 만든 상태다. */
const makeConsumer = (config: unknown = CORE_ONLY, name = 'consumer') => {
  const root = path.join(tmp, name);
  mkdirSync(path.join(root, '.claude/rules'), { recursive: true });
  writeJson(path.join(root, '.claude/standards.json'), config);
  writeFileSync(path.join(root, '.claude/rules/local.md'), '# local\n');
  writeFileSync(path.join(root, '.claude/settings.json'), '{ "permissions": {} }\n');
  writeFileSync(path.join(root, '.claude/harness.profile.md'), '# Harness profile\n');
  writeFileSync(path.join(root, '.claude/harness-source.json'), '{ "plugin": "berry-dev" }\n');
  writeFileSync(path.join(root, 'AGENTS.md'), '# agents\n');
  writeFileSync(path.join(root, 'CLAUDE.md'), '@AGENTS.md\n');
  return root;
};

const cli = (...args: string[]) => {
  const result = spawnSync(
    process.execPath,
    [path.join(plugin, 'scripts/standards.mjs'), ...args],
    {
      encoding: 'utf8',
    },
  );
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

const sync = (root: string, ...flags: string[]) => cli('sync', '--project', root, ...flags);
const check = (root: string) => cli('check', '--project', root);

/** 경로 → 종류 · 크기 · mtime · 내용 hash. symlink 는 따라가지 않는다. */
const snapshot = (root: string, skip: (relative: string) => boolean = () => false) => {
  const out: Record<string, string> = {};
  const walk = (relative: string) => {
    for (const name of readdirSync(path.join(root, relative))) {
      const child = relative ? `${relative}/${name}` : name;
      if (skip(child)) continue;
      const full = path.join(root, child);
      const stat = lstatSync(full);
      if (stat.isSymbolicLink()) out[child] = `link:${readlinkSync(full)}`;
      else if (stat.isDirectory()) {
        out[child] = `dir:${stat.mtimeMs}`;
        walk(child);
      } else out[child] = `file:${stat.size}:${stat.mtimeMs}:${sha256(readFileSync(full))}`;
    }
  };
  walk('');
  return out;
};

/** local 파일만 본다. `.claude/rules` 자체의 mtime 은 첫 sync 가 `_generated` 를 만들 때 바뀐다. */
const outsideGenerated = (relative: string) =>
  relative.startsWith(GEN) || relative === '.claude/rules';
const generated = (root: string) => readdirSync(path.join(root, GEN)).sort();
const read = (root: string, name: string) => readFileSync(path.join(root, GEN, name));

/** 복사한 plugin 에 optional rule `extra` 를 더한다. */
const addOptionalRule = () => {
  const file = path.join(plugin, 'standards/manifest.json');
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as { rules: unknown[] };
  manifest.rules.push({ id: 'extra', source: 'rules/extra.md', scope: 'optional' });
  writeJson(file, manifest);
  writeFileSync(path.join(plugin, 'standards/rules/extra.md'), '# extra\n\n- 규칙\n');
};

const editManifest = (root: string, edit: (value: { files: Record<string, string> }) => void) => {
  const file = path.join(root, GEN, 'manifest.json');
  const value = JSON.parse(readFileSync(file, 'utf8')) as { files: Record<string, string> };
  edit(value);
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

describe('사용법', () => {
  it('--help 는 0 이고 사용법을 보여 준다', () => {
    const result = cli('--help');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('sync');
    expect(result.stdout).toContain('--project');
  });

  it.each([
    [[]],
    [['nope', '--project', '.']],
    [['sync']],
    [['sync', 'extra', '--project', '.']],
    [['sync', '--project', '.', '--force']],
    [['check', '--project', '.', '--overwrite-generated']],
  ])('잘못된 인자 %j 는 2', (args) => {
    expect(cli(...args).status).toBe(2);
  });

  it('없는 project 는 2', () => {
    expect(sync(path.join(tmp, 'missing')).status).toBe(2);
  });
});

describe('sync → check', () => {
  it('sync 가 _generated 에 rule 과 manifest 를 쓰고 check 가 0 이다', () => {
    const root = makeConsumer();
    const before = snapshot(root, outsideGenerated);
    const result = sync(root);
    expect(result.status).toBe(0);
    expect(generated(root)).toEqual(['core.md', 'manifest.json']);
    expect(read(root, 'core.md').toString('utf8')).toMatch(/^<!-- berry-dev\/standards format 1 /);
    expect(check(root)).toMatchObject({ status: 0 });
    expect(snapshot(root, outsideGenerated)).toEqual(before);
  });

  it('두 번째 sync 는 아무것도 쓰지 않는다 — mtime 이 그대로이고 lock · temp 가 남지 않는다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    const before = snapshot(root);
    const second = sync(root);
    expect(second.status).toBe(0);
    expect(second.stdout).toContain('up to date');
    expect(snapshot(root)).toEqual(before);
    expect(generated(root)).toEqual(['core.md', 'manifest.json']);
  });

  it('check 는 drift 상태에서도 아무것도 바꾸지 않는다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    writeJson(path.join(root, '.claude/standards.json'), { schemaVersion: 1, rules: {} });
    const before = snapshot(root);
    const result = check(root);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('config changed');
    expect(check(root).status).toBe(1);
    expect(snapshot(root)).toEqual(before);
  });

  it('config 만 바뀌면 manifest 만 다시 쓰고 rule 파일은 건드리지 않는다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    const coreBefore = snapshot(root)[`${GEN}/core.md`];
    writeJson(path.join(root, '.claude/standards.json'), { schemaVersion: 1, rules: {} });
    expect(sync(root).status).toBe(0);
    expect(snapshot(root)[`${GEN}/core.md`]).toBe(coreBefore);
    expect(check(root).status).toBe(0);
  });

  it('_generated 가 없으면 처음 sync 가 만들고, 그 전 check 는 1 이며 아무것도 만들지 않는다', () => {
    const root = makeConsumer();
    expect(check(root).status).toBe(1);
    expect(existsSync(path.join(root, GEN))).toBe(false);
  });

  it('.claude/rules 가 없으면 2 — 만드는 것은 setup 책임이다', () => {
    const root = makeConsumer();
    rmSync(path.join(root, '.claude/rules'), { recursive: true });
    expect(sync(root).status).toBe(2);
    expect(existsSync(path.join(root, '.claude/rules'))).toBe(false);
  });

  it('공백이 있는 project 경로에서도 동작한다', () => {
    const root = makeConsumer(CORE_ONLY, 'my consumer');
    expect(sync(root).status).toBe(0);
    expect(check(root).status).toBe(0);
  });
});

describe('drift 와 수동 편집', () => {
  it('한 byte 수정은 기본 중단(2)이고, --overwrite-generated 가 원래대로 복원한다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    const original = read(root, 'core.md');
    const edited = Buffer.from(original);
    edited[edited.length - 2] ^= 1;
    writeFileSync(path.join(root, GEN, 'core.md'), edited);

    expect(check(root)).toMatchObject({ status: 2 });
    expect(check(root).stdout).toContain('modified');
    expect(sync(root).status).toBe(2);
    expect(read(root, 'core.md').equals(edited)).toBe(true);

    expect(sync(root, '--overwrite-generated').status).toBe(0);
    expect(read(root, 'core.md').equals(original)).toBe(true);
    expect(check(root).status).toBe(0);
  });

  it('파일과 manifest hash 를 함께 조작해도 check 는 source 로 다시 계산해 drift 를 잡는다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    const original = read(root, 'core.md');
    const forged = Buffer.concat([original, Buffer.from('- 몰래 추가\n')]);
    writeFileSync(path.join(root, GEN, 'core.md'), forged);
    editManifest(root, (value) => {
      value.files['core.md'] = sha256(forged);
    });

    expect(check(root).status).toBe(1);
    expect(sync(root).status).toBe(0);
    expect(read(root, 'core.md').equals(original)).toBe(true);
    expect(check(root).status).toBe(0);
  });

  it('plugin version 이 바뀌면 check 가 version 차이를 말하고 sync 가 맞춘다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    const pluginJson = path.join(plugin, '.claude-plugin/plugin.json');
    writeFileSync(pluginJson, readFileSync(pluginJson, 'utf8').replace('0.1.0', '0.2.0'));

    const result = check(root);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('plugin 0.1.0 -> 0.2.0');
    expect(sync(root).status).toBe(0);
    expect(read(root, 'core.md').toString('utf8')).toContain('berry-dev@0.2.0');
    expect(check(root).status).toBe(0);
  });

  it('manifest 가 없어도 파일이 expected 와 같으면 1 이고 sync 가 manifest 를 되살린다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    unlinkSync(path.join(root, GEN, 'manifest.json'));
    expect(check(root).status).toBe(1);
    expect(sync(root).status).toBe(0);
    expect(check(root).status).toBe(0);
  });

  it('manifest 가 없고 파일이 다르면 소유를 알 수 없어 2 이고 파일을 보존한다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    unlinkSync(path.join(root, GEN, 'manifest.json'));
    writeFileSync(path.join(root, GEN, 'core.md'), '# mine\n');
    expect(check(root).status).toBe(2);
    expect(sync(root, '--overwrite-generated').status).toBe(2);
    expect(read(root, 'core.md').toString('utf8')).toBe('# mine\n');
  });

  it.each([['{'], ['[]'], ['{"generator":"other","files":{}}']])(
    '손상된 manifest %s 는 check · sync · overwrite 모두 2',
    (text) => {
      const root = makeConsumer();
      expect(sync(root).status).toBe(0);
      writeFileSync(path.join(root, GEN, 'manifest.json'), text);
      const before = snapshot(root);
      expect(check(root).status).toBe(2);
      expect(sync(root).status).toBe(2);
      expect(sync(root, '--overwrite-generated').status).toBe(2);
      expect(snapshot(root)).toEqual(before);
    },
  );
});

describe('stale 제거', () => {
  it('선택 해제된 optional rule 은 소유 · header · hash 를 확인하고 지운다', () => {
    addOptionalRule();
    const root = makeConsumer({
      schemaVersion: 1,
      rules: { core: true, extra: { paths: ['docs/**'] } },
    });
    expect(sync(root).status).toBe(0);
    expect(read(root, 'extra.md').toString('utf8')).toMatch(
      /^---\npaths:\n {2}- "docs\/\*\*"\n---\n/,
    );

    writeJson(path.join(root, '.claude/standards.json'), CORE_ONLY);
    const result = check(root);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('stale');
    expect(sync(root).status).toBe(0);
    expect(generated(root)).toEqual(['core.md', 'manifest.json']);
    expect(check(root).status).toBe(0);
  });

  it('upstream 에서 삭제된 rule 도 stale 로 지운다', () => {
    addOptionalRule();
    const root = makeConsumer({
      schemaVersion: 1,
      rules: { core: true, extra: { paths: ['docs/**'] } },
    });
    expect(sync(root).status).toBe(0);
    rmSync(path.join(plugin, 'standards/rules/extra.md'));
    writeFileSync(
      path.join(plugin, 'standards/manifest.json'),
      readFileSync(path.join(PLUGIN_SOURCE, 'standards/manifest.json')),
    );
    writeJson(path.join(root, '.claude/standards.json'), CORE_ONLY);
    expect(sync(root).status).toBe(0);
    expect(generated(root)).toEqual(['core.md', 'manifest.json']);
  });

  it('수정된 stale 파일은 지우지 않는다 — overwrite 여도 2', () => {
    addOptionalRule();
    const root = makeConsumer({
      schemaVersion: 1,
      rules: { core: true, extra: { paths: ['docs/**'] } },
    });
    expect(sync(root).status).toBe(0);
    writeFileSync(path.join(root, GEN, 'extra.md'), '# edited\n');
    writeJson(path.join(root, '.claude/standards.json'), CORE_ONLY);
    expect(sync(root).status).toBe(2);
    expect(sync(root, '--overwrite-generated').status).toBe(2);
    expect(read(root, 'extra.md').toString('utf8')).toBe('# edited\n');
  });

  it('manifest 가 사용자 파일을 소유한다고 주장해도 generator header 가 없으면 지우지 않는다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    const notes = Buffer.from('# my notes\n');
    writeFileSync(path.join(root, GEN, 'notes.md'), notes);
    editManifest(root, (value) => {
      value.files['notes.md'] = sha256(notes);
    });
    expect(sync(root).status).toBe(2);
    expect(sync(root, '--overwrite-generated').status).toBe(2);
    expect(read(root, 'notes.md').equals(notes)).toBe(true);
  });
});

describe('보존과 분리', () => {
  it('optional rule 의 paths 가 바뀌면 그 파일만 다시 쓰고 frontmatter 가 따라간다', () => {
    addOptionalRule();
    const root = makeConsumer({
      schemaVersion: 1,
      rules: { core: true, extra: { paths: ['docs/**'] } },
    });
    expect(sync(root).status).toBe(0);
    const coreBefore = snapshot(root)[`${GEN}/core.md`];
    writeJson(path.join(root, '.claude/standards.json'), {
      schemaVersion: 1,
      rules: { core: true, extra: { paths: ['guides/**'] } },
    });
    const drift = check(root);
    expect(drift.status).toBe(1);
    expect(drift.stdout).toMatch(/outdated\s+\.claude\/rules\/_generated\/extra\.md/);
    expect(sync(root).status).toBe(0);
    expect(read(root, 'extra.md').toString('utf8')).toContain('  - "guides/**"\n');
    expect(snapshot(root)[`${GEN}/core.md`]).toBe(coreBefore);
    expect(check(root).status).toBe(0);
  });

  it('모든 변경 경로에서 local rule · settings · profile · source pin · AGENTS 가 byte 와 mtime 까지 그대로다', () => {
    addOptionalRule();
    const root = makeConsumer({
      schemaVersion: 1,
      rules: { core: true, extra: { paths: ['docs/**'] } },
    });
    const local = () => snapshot(root, outsideGenerated);
    const before = local();
    const steps: [string, () => void][] = [
      ['첫 sync', () => expect(sync(root).status).toBe(0)],
      ['두 번째 sync', () => expect(sync(root).status).toBe(0)],
      [
        '손 편집 복원',
        () => {
          writeFileSync(path.join(root, GEN, 'core.md'), '# edited\n');
          expect(sync(root).status).toBe(2);
          expect(sync(root, '--overwrite-generated').status).toBe(0);
        },
      ],
      [
        'version 변경',
        () => {
          const file = path.join(plugin, '.claude-plugin/plugin.json');
          writeFileSync(file, readFileSync(file, 'utf8').replace('0.1.0', '0.2.0'));
          expect(sync(root).status).toBe(0);
        },
      ],
      [
        '선택 해제로 stale 제거',
        () => {
          const config = path.join(root, '.claude/standards.json');
          const configBefore = readFileSync(config);
          writeJson(config, CORE_ONLY);
          expect(sync(root).status).toBe(0);
          writeFileSync(config, configBefore);
        },
      ],
      ['check', () => expect([0, 1]).toContain(check(root).status)],
    ];
    for (const [label, step] of steps) {
      step();
      const after = local();
      delete after['.claude/standards.json'];
      const expected = { ...before };
      delete expected['.claude/standards.json'];
      expect(after, label).toEqual(expected);
    }
  });

  it('CLI 는 source pin(harness-source.json)을 읽지 않는다 — 깨져 있어도 content check 에 영향이 없다', () => {
    const root = makeConsumer();
    writeFileSync(path.join(root, '.claude/harness-source.json'), '{ not json');
    expect(sync(root).status).toBe(0);
    expect(check(root).status).toBe(0);
    for (const script of readdirSync(path.join(plugin, 'scripts'))) {
      expect(readFileSync(path.join(plugin, 'scripts', script), 'utf8'), script).not.toContain(
        'harness-source',
      );
    }
  });

  it('복사한 plugin 위 어느 디렉터리에도 node_modules 가 없다 — 저장소 의존 없이 돈다', () => {
    let dir = plugin;
    while (dir !== path.dirname(dir)) {
      expect(existsSync(path.join(dir, 'node_modules')), dir).toBe(false);
      dir = path.dirname(dir);
    }
    expect(cli('--help').status).toBe(0);
  });
});

describe('unknown · symlink · 경로 탈출', () => {
  it('첫 sync 전에 같은 이름의 unknown 파일이 있으면 2 이고 보존한다', () => {
    const root = makeConsumer();
    mkdirSync(path.join(root, GEN));
    writeFileSync(path.join(root, GEN, 'core.md'), '# mine\n');
    expect(sync(root).status).toBe(2);
    expect(sync(root, '--overwrite-generated').status).toBe(2);
    expect(generated(root)).toEqual(['core.md']);
    expect(read(root, 'core.md').toString('utf8')).toBe('# mine\n');
  });

  it.each([['notes.md'], ['README.md'], ['.tmp-1-leftover']])(
    '소유하지 않은 %s 는 지우지 않고 2',
    (name) => {
      const root = makeConsumer();
      expect(sync(root).status).toBe(0);
      writeFileSync(path.join(root, GEN, name), 'mine\n');
      const before = snapshot(root);
      expect(check(root).status).toBe(2);
      expect(sync(root).status).toBe(2);
      expect(sync(root, '--overwrite-generated').status).toBe(2);
      expect(snapshot(root)).toEqual(before);
    },
  );

  it('남아 있는 lock 은 2 이고 지우지 않는다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    mkdirSync(path.join(root, GEN, '.lock'));
    expect(check(root).status).toBe(2);
    expect(sync(root).status).toBe(2);
    expect(existsSync(path.join(root, GEN, '.lock'))).toBe(true);
  });

  it('_generated 가 symlink 면 2 이고 대상은 그대로다', () => {
    const root = makeConsumer();
    const target = path.join(tmp, 'elsewhere');
    mkdirSync(target);
    symlinkSync(target, path.join(root, GEN));
    expect(sync(root).status).toBe(2);
    expect(check(root).status).toBe(2);
    expect(readdirSync(target)).toEqual([]);
  });

  it('생성 파일이 밖을 가리키는 symlink 면 overwrite 여도 2 이고 대상은 그대로다', () => {
    const root = makeConsumer();
    expect(sync(root).status).toBe(0);
    const outside = path.join(tmp, 'outside.md');
    writeFileSync(outside, 'outside\n');
    unlinkSync(path.join(root, GEN, 'core.md'));
    symlinkSync(outside, path.join(root, GEN, 'core.md'));
    expect(sync(root, '--overwrite-generated').status).toBe(2);
    expect(readFileSync(outside, 'utf8')).toBe('outside\n');
  });

  it('.claude/rules 가 symlink 면 2', () => {
    const root = makeConsumer();
    const target = path.join(tmp, 'rules-elsewhere');
    mkdirSync(target);
    rmSync(path.join(root, '.claude/rules'), { recursive: true });
    symlinkSync(target, path.join(root, '.claude/rules'));
    expect(sync(root).status).toBe(2);
    expect(readdirSync(target)).toEqual([]);
  });

  it('.claude/standards.json 이 symlink 면 2', () => {
    const root = makeConsumer();
    const real = path.join(tmp, 'standards.json');
    writeJson(real, CORE_ONLY);
    unlinkSync(path.join(root, '.claude/standards.json'));
    symlinkSync(real, path.join(root, '.claude/standards.json'));
    expect(sync(root).status).toBe(2);
    expect(existsSync(path.join(root, GEN))).toBe(false);
  });

  it.each([['../../../AGENTS.md'], ['/etc/hosts'], ['sub/core.md'], ['Core.md']])(
    'manifest 의 경로 %s 는 2 이고 아무것도 지우지 않는다',
    (key) => {
      const root = makeConsumer();
      expect(sync(root).status).toBe(0);
      editManifest(root, (value) => {
        value.files[key] = sha256('# agents\n');
      });
      const before = snapshot(root);
      expect(sync(root).status).toBe(2);
      expect(sync(root, '--overwrite-generated').status).toBe(2);
      expect(snapshot(root)).toEqual(before);
    },
  );
});

describe('config 오류', () => {
  it.each([
    ['config 없음', null],
    ['JSON 아님', '{'],
    ['unknown id', { schemaVersion: 1, rules: { nope: true } }],
    ['공백 path', { schemaVersion: 1, rules: { extra: { paths: ['  '] } } }],
    ['빈 paths', { schemaVersion: 1, rules: { extra: { paths: [] } } }],
  ])('%s 는 2 이고 _generated 를 만들지 않는다', (_label, config) => {
    addOptionalRule();
    const root = makeConsumer();
    const file = path.join(root, '.claude/standards.json');
    if (config === null) unlinkSync(file);
    else if (typeof config === 'string') writeFileSync(file, config);
    else writeJson(file, config);
    expect(sync(root).status).toBe(2);
    expect(check(root).status).toBe(2);
    expect(existsSync(path.join(root, GEN))).toBe(false);
  });
});

describe('출력', () => {
  it('본문 · config 값 · 절대 경로를 출력하지 않는다', () => {
    addOptionalRule();
    const root = makeConsumer();
    const outputs: string[] = [];
    const record = (result: { stdout: string; stderr: string }) =>
      outputs.push(result.stdout, result.stderr);

    record(sync(root));
    writeFileSync(path.join(root, GEN, 'core.md'), '# 바꾼 본문 SECRET-BODY\n');
    record(check(root));
    record(sync(root));
    writeJson(path.join(root, '.claude/standards.json'), {
      schemaVersion: 1,
      rules: { extra: { paths: ['SECRET-PATH\n'] } },
    });
    record(sync(root));

    const text = outputs.join('\n');
    expect(text).not.toContain(tmp);
    expect(text).not.toContain('## 탐색');
    expect(text).not.toContain('SECRET-BODY');
    expect(text).not.toContain('SECRET-PATH');
  });
});
