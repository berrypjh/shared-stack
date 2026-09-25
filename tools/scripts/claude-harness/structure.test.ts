import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

/**
 * plugins/berry-dev 배포 디렉터리 구조 검사.
 *
 * marketplace 설치는 plugin 디렉터리만 cache 로 복사한다. 그래서 plugin 은 자기 안의 파일과
 * Node 내장만으로 돌아야 하고, 아직 없는 hook · skill 을 등록하지 않는다.
 */

type Manifest = { rules: { id: string }[] };
type StandardsCore = {
  loadSource: () => Promise<{ manifest: Manifest }>;
  validateConfig: (value: unknown, manifest: Manifest) => { id: string }[];
};

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PLUGIN_ROOT = path.join(REPO_ROOT, 'plugins/berry-dev');

const readJson = (file: string) =>
  JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;

/** plugin 안의 모든 항목(상대 경로). symlink 는 따라가지 않는다. */
const walk = (relative = ''): string[] =>
  readdirSync(path.join(PLUGIN_ROOT, relative)).flatMap((name) => {
    const child = relative ? `${relative}/${name}` : name;
    return lstatSync(path.join(PLUGIN_ROOT, child)).isDirectory()
      ? [child, ...walk(child)]
      : [child];
  });

const files = walk().filter((entry) => lstatSync(path.join(PLUGIN_ROOT, entry)).isFile());
const scripts = files.filter((entry) => entry.endsWith('.mjs'));

/** 파일 기준 상대 경로가 plugin 안에 머무는지. */
const staysInside = (from: string, target: string) => {
  const resolved = path.resolve(path.dirname(path.join(PLUGIN_ROOT, from)), target);
  return resolved === PLUGIN_ROOT || resolved.startsWith(`${PLUGIN_ROOT}${path.sep}`);
};

let core: StandardsCore;

beforeAll(async () => {
  core = (await import(
    pathToFileURL(path.join(PLUGIN_ROOT, 'scripts/standards-core.mjs')).href
  )) as StandardsCore;
});

describe('배포 디렉터리', () => {
  it('최상위는 manifest · README · 원본 · CLI · hook · 예시뿐이다', () => {
    expect(readdirSync(PLUGIN_ROOT).sort()).toEqual([
      '.claude-plugin',
      'README.md',
      'examples',
      'hooks',
      'scripts',
      'skills',
      'standards',
    ]);
  });

  it('skills/ 에는 있는 skill 만 있다', () => {
    expect(readdirSync(path.join(PLUGIN_ROOT, 'skills')).sort()).toEqual([
      'frontend-quality',
      'repo-verify',
    ]);
    expect(readdirSync(path.join(PLUGIN_ROOT, 'skills/repo-verify'))).toEqual(['SKILL.md']);
  });

  it('hooks/ 에는 hooks.json 하나뿐이고 adapter 는 scripts/ 에 있다', () => {
    expect(readdirSync(path.join(PLUGIN_ROOT, 'hooks'))).toEqual(['hooks.json']);
  });

  it('symlink 가 없다', () => {
    for (const entry of walk()) {
      expect(lstatSync(path.join(PLUGIN_ROOT, entry)).isSymbolicLink(), entry).toBe(false);
    }
  });

  it.each([
    'package.json',
    'node_modules',
    'dist',
    'bin',
    'project.json',
    'settings.json',
    '.mcp.json',
    '.lsp.json',
    'agents',
    'commands',
    'monitors',
  ])('%s 가 없다 — 아직 없는 구성을 자동 발견시키지 않는다', (name) => {
    expect(walk().some((entry) => entry.split('/').includes(name))).toBe(false);
  });
});

describe('manifest', () => {
  const manifest = readJson(path.join(PLUGIN_ROOT, '.claude-plugin/plugin.json'));

  it('identity 와 version 이 있고 component 경로를 등록하지 않는다', () => {
    expect(manifest.name).toBe('berry-dev');
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(typeof manifest.description).toBe('string');
    const components = [
      'hooks',
      'skills',
      'commands',
      'agents',
      'workflows',
      'outputStyles',
      'mcpServers',
      'lspServers',
      'experimental',
      'userConfig',
    ];
    expect(Object.keys(manifest).filter((key) => components.includes(key))).toEqual([]);
  });

  it('version 문자열은 plugin.json 밖에 없다', () => {
    const version = String(manifest.version);
    const others = files.filter((entry) => entry !== '.claude-plugin/plugin.json');
    expect(
      others.filter((entry) =>
        readFileSync(path.join(PLUGIN_ROOT, entry), 'utf8').includes(version),
      ),
    ).toEqual([]);
  });

  it('marketplace 에 version 없이 등록하고, berry-commit 항목은 그대로다', () => {
    const marketplace = readJson(path.join(REPO_ROOT, '.claude-plugin/marketplace.json')) as {
      name: string;
      plugins: Record<string, unknown>[];
    };
    expect(marketplace.name).toBe('berrypjh');
    const entry = marketplace.plugins.find((plugin) => plugin.name === 'berry-dev');
    expect(entry).toMatchObject({ source: './plugins/berry-dev' });
    expect(entry).not.toHaveProperty('version');
    expect(marketplace.plugins.find((plugin) => plugin.name === 'berry-commit')).toEqual({
      name: 'berry-commit',
      source: './plugins/berry-commit',
      description:
        'staged 변경을 scope별로 분석해 한국어 Conventional Commits 메시지를 제안하고 승인 후 커밋한다. commit-mcp MCP 서버를 함께 제공한다.',
      category: 'workflow',
      keywords: ['commit', 'conventional-commits', 'mcp', 'korean'],
    });
  });

  it('project 설정에서는 아직 켜지 않았다 — 설치 · 활성 확인 전이다', () => {
    const settings = readJson(path.join(REPO_ROOT, '.claude/settings.json')) as {
      enabledPlugins?: Record<string, boolean>;
    };
    expect(Object.keys(settings.enabledPlugins ?? {})).not.toContain('berry-dev@berrypjh');
  });
});

describe('marketplace · manifest · skill 일치', () => {
  it('marketplace 항목 이름 · plugin.json name · 디렉터리 이름이 같다', () => {
    const marketplace = readJson(path.join(REPO_ROOT, '.claude-plugin/marketplace.json')) as {
      plugins: { name: string; source: string }[];
    };
    const entry = marketplace.plugins.find((plugin) => plugin.source === './plugins/berry-dev');
    const manifest = readJson(path.join(PLUGIN_ROOT, '.claude-plugin/plugin.json'));
    expect([entry?.name, manifest.name, path.basename(PLUGIN_ROOT)]).toEqual([
      'berry-dev',
      'berry-dev',
      'berry-dev',
    ]);
  });

  it('skill 마다 SKILL.md 의 name 이 폴더 이름과 같다', () => {
    for (const name of readdirSync(path.join(PLUGIN_ROOT, 'skills'))) {
      const text = readFileSync(path.join(PLUGIN_ROOT, 'skills', name, 'SKILL.md'), 'utf8');
      expect(text.match(/^name: (.+)$/m)?.[1], name).toBe(name);
    }
  });

  it('plugin 안 markdown 의 상대 링크는 모두 있는 파일을 가리킨다', () => {
    for (const entry of files.filter((file) => file.endsWith('.md'))) {
      const text = readFileSync(path.join(PLUGIN_ROOT, entry), 'utf8');
      for (const [, target] of text.matchAll(/\]\(([^)#\s]+)[^)]*\)/g)) {
        if (/^[a-z]+:/i.test(target)) continue;
        const resolved = path.resolve(path.dirname(path.join(PLUGIN_ROOT, entry)), target);
        expect(existsSync(resolved), `${entry}: ${target}`).toBe(true);
      }
    }
  });
});

describe('runtime 의존', () => {
  it('script 의 import 는 node: 내장이거나 plugin 안 상대 경로다', () => {
    for (const entry of scripts) {
      const text = readFileSync(path.join(PLUGIN_ROOT, entry), 'utf8');
      const specifiers = [...text.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1]);
      expect(text, entry).not.toMatch(/\brequire\(|\bimport\(/);
      for (const specifier of specifiers) {
        const allowed =
          specifier.startsWith('node:') ||
          (specifier.startsWith('./') && staysInside(entry, specifier));
        expect(allowed, `${entry}: ${specifier}`).toBe(true);
      }
    }
  });

  it('script 는 cache 경로 · 환경 변수 · network · examples 를 쓰지 않는다', () => {
    for (const entry of scripts) {
      const text = readFileSync(path.join(PLUGIN_ROOT, entry), 'utf8');
      expect(text, entry).not.toMatch(
        /plugins\/cache|process\.env|CLAUDE_PLUGIN_ROOT|\bfetch\(|node:https?|node:net|examples\//,
      );
    }
  });

  it('markdown 의 상대 링크는 plugin 밖으로 나가지 않는다', () => {
    for (const entry of files.filter((file) => file.endsWith('.md'))) {
      const text = readFileSync(path.join(PLUGIN_ROOT, entry), 'utf8');
      for (const [, target] of text.matchAll(/\]\(([^)#\s]+)[^)]*\)/g)) {
        if (/^[a-z]+:/i.test(target)) continue;
        expect(staysInside(entry, target), `${entry}: ${target}`).toBe(true);
      }
    }
  });
});

describe('examples', () => {
  it('harness-source.example.json 은 SHA · version 을 지어내지 않는다', () => {
    const source = readJson(path.join(PLUGIN_ROOT, 'examples/harness-source.example.json'));
    expect(Object.keys(source)).toEqual([
      'schemaVersion',
      'repository',
      'commit',
      'plugin',
      'version',
    ]);
    expect(source.plugin).toBe('berry-dev');
    expect(String(source.commit)).not.toMatch(/[0-9a-f]{7,}/);
    expect(String(source.version)).not.toMatch(/\d+\.\d+\.\d+/);
  });

  it('standards.consumer.json 은 현재 registry 로 유효하고 모든 rule 을 보여 준다', async () => {
    const { manifest } = await core.loadSource();
    const config = readJson(path.join(PLUGIN_ROOT, 'examples/standards.consumer.json'));
    const selected = core.validateConfig(config, manifest).map((rule) => rule.id);
    expect(selected).toEqual(manifest.rules.map((rule) => rule.id));
  });

  it('permissions.review.json 은 deny · ask 뿐이고 프로젝트 전용 항목이 없다', () => {
    const review = readJson(path.join(PLUGIN_ROOT, 'examples/permissions.review.json'));
    expect(Object.keys(review)).toEqual(['permissions']);
    const permissions = review.permissions as Record<string, string[]>;
    expect(Object.keys(permissions).sort()).toEqual(['ask', 'deny']);
    const rules = [...permissions.deny, ...permissions.ask].join('\n');
    expect(rules).not.toMatch(/\beas\b|\bgo\b|release|publish|submit|nx |pnpm|npm|defaultMode/i);
  });

  it('harness.profile.md 는 사람이 채우는 문서이고 실행 형식이 아니다', () => {
    const profile = readFileSync(path.join(PLUGIN_ROOT, 'examples/harness.profile.md'), 'utf8');
    expect(profile.startsWith('# Harness profile\n')).toBe(true);
    expect(profile).toContain('<');
    expect(profile).not.toMatch(/^---/m);
  });
});
