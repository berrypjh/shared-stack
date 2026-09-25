import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * `frontend-quality` skill · reference · profile UI 절의 구조 검사.
 *
 * 문서의 모양 · 참조 · 문구와 역할 매핑만 본다. 실제 UI 검수 동작이나 모델 행동은 검증하지 않는다.
 */

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const SKILL_DIR = path.join(REPO_ROOT, 'plugins/berry-dev/skills/frontend-quality');
const SKILL_FILE = path.join(SKILL_DIR, 'SKILL.md');
const REFERENCE = path.join(SKILL_DIR, 'references/platform-checks.md');
const PROFILE = path.join(REPO_ROOT, '.claude/harness.profile.md');
const EXAMPLE_PROFILE = path.join(REPO_ROOT, 'plugins/berry-dev/examples/harness.profile.md');
const FIXTURE = path.join(
  REPO_ROOT,
  'tools/scripts/claude-harness/fixtures/shared-stack.standards.json',
);

const skill = readFileSync(SKILL_FILE, 'utf8');
const reference = readFileSync(REFERENCE, 'utf8');
const profile = readFileSync(PROFILE, 'utf8');
const body = skill.replace(/^---\n[\s\S]*?\n---\n/, '');

const readJson = (relative: string) =>
  JSON.parse(readFileSync(path.join(REPO_ROOT, relative), 'utf8')) as Record<string, unknown>;

/** `### 제목` 부터 다음 같은 단계 제목 전까지. */
const section = (text: string, heading: string) => {
  const start = text.indexOf(`${heading}\n`);
  if (start < 0) throw new Error(`no section ${heading}`);
  const level = heading.match(/^#+/)?.[0] ?? '##';
  const rest = text.slice(start + heading.length + 1);
  const end = rest.search(new RegExp(`^#{1,${level.length}} `, 'm'));
  return end < 0 ? rest : rest.slice(0, end);
};

describe('skill 파일', () => {
  it('공식 frontmatter 필드만 쓰고 자동 호출 · 도구 허용을 건드리지 않는다', () => {
    const fields = Object.fromEntries(
      (skill.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '')
        .split('\n')
        .map((line) => [
          line.slice(0, line.indexOf(':')),
          line.slice(line.indexOf(':') + 1).trim(),
        ]),
    );
    expect(Object.keys(fields).sort()).toEqual([
      'argument-hint',
      'description',
      'name',
      'when_to_use',
    ]);
    expect(fields.name).toBe('frontend-quality');
  });

  it('reference 는 skill 폴더 안에 있고 skill 이 링크한다', () => {
    expect(readdirSync(SKILL_DIR).sort()).toEqual(['SKILL.md', 'references']);
    expect(readdirSync(path.join(SKILL_DIR, 'references'))).toEqual(['platform-checks.md']);
    expect(body).toContain('](references/platform-checks.md)');
  });

  it('작업 중인 저장소 root 의 profile UI 절을 읽는다', () => {
    expect(body).toContain('git rev-parse --show-toplevel');
    expect(body).toContain('<root>/.claude/harness.profile.md');
    expect(body).not.toContain('CLAUDE_PLUGIN_ROOT');
  });
});

describe('generic — 저장소 사실 · 다른 저장소 문구가 없다', () => {
  const markers = [
    /\bsnapdone\b/i,
    /\bberrypjh\b/i,
    /\bshared-stack\b/i,
    /AppShell|AuthShell/,
    /WebView/i,
    /confidence|신뢰도|모델 이름/i,
    /캘린더|등록했습니다|저장했습니다/,
    /\beas\b|\bexpo\b/i,
    /\bapps\/|\blibs\//,
    /devhub|quality-lab|demo-/i,
    /use client|shadow-xs/,
  ];

  it.each([
    ['SKILL.md', skill],
    ['platform-checks.md', reference],
  ])('%s', (_label, text) => {
    expect(markers.filter((marker) => marker.test(text)).map(String)).toEqual([]);
    const withoutNumbering = text.replace(/^(?:#+ )?\d+\. /gm, '');
    expect(withoutNumbering.match(/\d+/g), '폭 · 크기 · 개수 같은 현재값').toBeNull();
  });

  it('한국어를 강제하지 않고 locale 은 profile 에서 읽는다', () => {
    expect(body).toContain('정해지지 않았으면 한국어를 강제하지 않는다');
  });
});

describe('consumer 와 maintainer 절차가 갈린다', () => {
  const consumer = section(body, '### consumer');
  const maintainer = section(body, '### maintainer');

  it('consumer 는 설치된 패키지를 좁혀 조회하고 source 를 복사하지 않는다', () => {
    expect(consumer).toContain('`agents` export');
    expect(consumer).toContain('그 앱 패키지 안에서');
    expect(consumer).toContain('bare `npx <package>`');
    expect(consumer).toContain('`find <query>` → `api <Symbol>` → `token <path|prefix>`');
    expect(consumer).toContain('source 를 복사하거나');
  });

  it('maintainer 는 자기 source 를 탐색하고 primitive 추가를 막지 않는다', () => {
    expect(maintainer).toContain(
      'consumer 제약(설치 bin 조회 · primitive 금지)은 여기 적용하지 않는다',
    );
    expect(maintainer).toContain('자기 source · 테스트 · 공개 export');
    expect(maintainer).toContain('새 primitive 를 추가할 수 있다');
  });
});

describe('확인 방식 — 문구 검사, 모델 행동 검증 아님', () => {
  it('네 가지 상태를 본다', () => {
    for (const state of ['loading', 'empty', 'error', 'disabled']) expect(body).toContain(state);
  });

  it('코드 판독 · 자동 검사 · 실제 확인을 나누고, 검색만으로 확정하지 않는다', () => {
    expect(body).toMatch(/^\| 코드 판독 /m);
    expect(body).toMatch(/^\| 자동 검사 /m);
    expect(body).toMatch(/^\| 실제 확인 /m);
    expect(body).toContain('검색에 안 걸렸다고 준수를 확정하지 않는다');
    expect(reference).toContain('걸리지 않았다고 준수가 확정되지 않는다');
  });

  it('reference 는 web 과 React Native 를 나누고 모든 항목에 확인 방식을 붙인다', () => {
    expect(reference).toContain('\n## Web\n');
    expect(reference).toContain('\n## React Native\n');
    const items = reference.match(/^- .+(?:\n {2}.+)*/gm) ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item, item).toMatch(/\*\*(판독|자동|실제)\*\*/);
  });

  it('보고에 역할 · 고친 것 · 유지한 것 · 코드로만 · 실제 실행 · 미검증이 있다', () => {
    for (const heading of [
      '## 고친 것',
      '## 유지한 것',
      '## 코드로만 확인한 것',
      '## 실제로 실행한 것',
      '## 미검증',
    ]) {
      expect(body).toContain(heading);
    }
    expect(body).toContain('역할: <consumer | maintainer | 일반>');
  });
});

describe('shared-stack profile UI 절과 fixture', () => {
  const ui = section(profile, '## UI');
  const roleRows = section(ui, '### 역할')
    .split('\n')
    .filter((line) => line.startsWith('| `'));
  const pathsWithRole = (role: string) =>
    roleRows
      .filter((line) => line.split('|')[2].trim() === role)
      .flatMap((line) => [...line.split('|')[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]));

  it('예시 profile 과 같은 UI 절 구조를 쓴다', () => {
    const example = section(readFileSync(EXAMPLE_PROFILE, 'utf8'), '## UI');
    for (const heading of example.match(/^### .+$/gm) ?? []) expect(ui).toContain(`${heading}\n`);
  });

  it('consumer 앱은 UI 패키지를 의존하고, maintainer 는 UI 패키지 자신이다', () => {
    const uiPackages = new Set([
      '@berrypjh/react-ui',
      '@berrypjh/react-native-ui',
      '@berrypjh/devhub-ui',
    ]);
    for (const app of pathsWithRole('consumer')) {
      const manifest = readJson(`${app}/package.json`) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies });
      expect(
        deps.some((name) => uiPackages.has(name)),
        app,
      ).toBe(true);
    }
    const maintained = pathsWithRole('maintainer').map(
      (lib) => readJson(`${lib}/package.json`).name,
    );
    expect(new Set(maintained)).toEqual(uiPackages);
  });

  it('standards fixture 의 berry-consumer 경로는 profile 의 consumer 앱 안에만 있다', () => {
    const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8')) as {
      rules: Record<string, { paths: string[] }>;
    };
    const consumers = pathsWithRole('consumer');
    const maintainers = pathsWithRole('maintainer');
    for (const entry of fixture.rules['berry-consumer'].paths) {
      expect(
        consumers.some((app) => entry.startsWith(`${app}/`)),
        entry,
      ).toBe(true);
      expect(
        maintainers.some((lib) => entry.startsWith(`${lib}/`)),
        entry,
      ).toBe(false);
    }
  });

  it('bin 이 있다고 적은 패키지만 bin 을 가진다', () => {
    const binOf = (lib: string) =>
      readJson(`libs/${lib}/package.json`).bin as Record<string, string> | undefined;
    expect(Object.keys(binOf('react-ui') ?? {})).toEqual(['berry-react-ui']);
    expect(Object.keys(binOf('react-native-ui') ?? {})).toEqual(['berry-react-native-ui']);
    expect(binOf('devhub-ui')).toBeUndefined();
    expect(ui).toContain('`@berrypjh/devhub-ui`에는 bin이 없다');
  });

  it('상대 링크가 모두 있는 파일을 가리킨다', () => {
    for (const [, target] of ui.matchAll(/\]\(([^)#\s]+)[^)]*\)/g)) {
      expect(existsSync(path.join(path.dirname(PROFILE), target)), target).toBe(true);
    }
  });
});
