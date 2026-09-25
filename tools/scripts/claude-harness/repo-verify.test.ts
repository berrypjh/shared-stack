import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * `repo-verify` skill 과 profile 의 구조 검사.
 *
 * 문서의 모양 · 참조 · 문구만 본다. 모델이 이 절차를 실제로 따르는지는 검증하지 않는다.
 */

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const SKILL = path.join(REPO_ROOT, 'plugins/berry-dev/skills/repo-verify/SKILL.md');
const EXAMPLE_PROFILE = path.join(REPO_ROOT, 'plugins/berry-dev/examples/harness.profile.md');
const PROFILE = path.join(REPO_ROOT, '.claude/harness.profile.md');

const skill = readFileSync(SKILL, 'utf8');
const profile = readFileSync(PROFILE, 'utf8');
const example = readFileSync(EXAMPLE_PROFILE, 'utf8');

/** `---` 로 감싼 첫 블록의 `key: value` 줄. */
const frontmatter = (text: string) => {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error('no frontmatter');
  return Object.fromEntries(
    match[1].split('\n').map((line) => {
      const index = line.indexOf(':');
      return [line.slice(0, index), line.slice(index + 1).trim()];
    }),
  );
};
const body = skill.replace(/^---\n[\s\S]*?\n---\n/, '');
const headings = (text: string) => text.match(/^#{2,3} .+$/gm) ?? [];

describe('skill frontmatter', () => {
  const fields = frontmatter(skill);

  it('공식 필드만 쓰고 name 이 폴더 이름과 같다', () => {
    expect(Object.keys(fields).sort()).toEqual([
      'argument-hint',
      'description',
      'name',
      'when_to_use',
    ]);
    expect(fields.name).toBe('repo-verify');
    expect(fields.description.length).toBeGreaterThan(0);
  });

  it('자동 호출을 막지 않고, 도구를 미리 허용하지 않는다', () => {
    expect(fields).not.toHaveProperty('disable-model-invocation');
    expect(fields).not.toHaveProperty('allowed-tools');
  });
});

describe('skill 본문 — generic', () => {
  it('작업 중인 저장소 root 의 profile 을 읽고 plugin 위치를 root 로 쓰지 않는다', () => {
    expect(body).toContain('git rev-parse --show-toplevel');
    expect(body).toContain('<root>/.claude/harness.profile.md');
    expect(body).not.toContain('CLAUDE_PLUGIN_ROOT');
    expect(body).toContain('profile 없음');
  });

  it('설치된 nx 로 affected 와 실제 target 을 묻고, 없으면 설치하지 않는다', () => {
    expect(body).toContain('nx show projects --affected --files=');
    expect(body).toContain('nx show project <이름> --json');
    expect(body).toContain('npx --no-install nx');
    expect(body).toContain('도구를 새로 설치하지 않는다');
  });

  it('보고 상태는 다섯 가지다', () => {
    for (const status of ['passed', 'failed', 'not-run', 'unsupported', 'timeout']) {
      expect(body).toMatch(new RegExp(`^\\| ${status} +\\|`, 'm'));
    }
  });

  it('다른 저장소의 이름 · 경로 · 환경 가정과 숫자 값이 없다', () => {
    const markers = [
      /\bsnapdone\b/i,
      /\bberrypjh\b/i,
      /\bshared-stack\b/i,
      /\beas\b/i,
      /\bexpo\b/i,
      /\bgo\b/i,
      /\bapps\//,
      /\blibs\//,
      /devhub|quality-lab|demo-/i,
      /tools:check|pnpm verify/,
    ];
    expect(markers.filter((marker) => marker.test(skill)).map(String)).toEqual([]);
    const withoutNumbering = body.replace(/^(?:#+ )?\d+\. /gm, '').replace(/\be2e\b/g, '');
    expect(withoutNumbering.match(/\d+/g)).toBeNull();
  });
});

/** 문구 검사다. 모델이 이 사례에서 그렇게 행동하는지는 검증하지 않는다. */
describe('skill 본문이 다루는 사례 — 문구 검사, 모델 행동 검증 아님', () => {
  it.each([
    ['tools · 설정만 바뀜(affected 에 없는 경로)', '프로젝트 밖 경로의 검사'],
    ['target 없음', '"no tasks" 는 통과가 아니라 not-run'],
    [
      '클라우드 빌드 · 배포',
      '클라우드 빌드 · 배포 · 게시 · 비용이 드는 명령은 검증 목적으로 실행하지 않는다',
    ],
    ['test 실패', '앞 단계가 실패하면 뒤 단계로 가지 않는다'],
    ['test 실패 보고', '실패하면 출력 그대로 보고한다'],
    ['runtime 미지원', '이 환경 · 도구로는 돌릴 수 없다'],
    ['사용자 변경', '시작 전부터 있던 사용자 변경을 구분한다'],
  ])('%s', (_label, phrase) => {
    expect(body).toContain(phrase);
  });
});

describe('shared-stack profile', () => {
  const scripts = Object.keys(
    (
      JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')) as {
        scripts: Record<string, string>;
      }
    ).scripts,
  );

  it('예시 profile 과 같은 검증 절 구조를 쓴다', () => {
    const exampleHeadings = headings(example.split('## 한국어')[0]);
    const profileHeadings = headings(profile);
    for (const heading of exampleHeadings) expect(profileHeadings).toContain(heading);
  });

  it('적은 pnpm script 가 모두 package.json 에 있다', () => {
    const named = [...profile.matchAll(/pnpm ([a-z][\w:-]*)/g)].map((m) => m[1]);
    const builtins = new Set(['exec', 'install', 'nx']);
    expect(named.filter((name) => !builtins.has(name) && !scripts.includes(name))).toEqual([]);
  });

  it('적은 프로젝트 이름이 모두 실제 manifest 에 있다', () => {
    const manifests = ['apps', 'libs', 'plugins'].flatMap((dir) =>
      readdirSync(path.join(REPO_ROOT, dir))
        .flatMap((name) =>
          ['package.json', 'project.json'].map((file) => path.join(dir, name, file)),
        )
        .filter((file) => existsSync(path.join(REPO_ROOT, file))),
    );
    const names = new Set([
      '@berrypjh/shared-stack',
      ...manifests.map(
        (file) =>
          (JSON.parse(readFileSync(path.join(REPO_ROOT, file), 'utf8')) as { name: string }).name,
      ),
    ]);
    const mentioned = [...profile.matchAll(/`(@berrypjh\/[a-z-]+|commit-mcp)`/g)].map((m) => m[1]);
    expect(mentioned.length).toBeGreaterThan(0);
    expect(mentioned.filter((name) => !names.has(name))).toEqual([]);
  });

  it('상대 링크가 모두 있는 파일을 가리킨다', () => {
    for (const [, target] of profile.matchAll(/\]\(([^)#\s]+)[^)]*\)/g)) {
      expect(existsSync(path.join(path.dirname(PROFILE), target)), target).toBe(true);
    }
  });

  it('tools 검사 · libs 산출물 · eval 실행기 · commit plugin dist · 실행 제약을 적는다', () => {
    for (const fact of [
      'pnpm tools:check',
      'pnpm build:libs',
      'scripted executor',
      '--replay=',
      'unavailableExecutor',
      'pnpm build:mcp:commit',
      'PORT_BOUND',
    ]) {
      expect(profile).toContain(fact);
    }
  });

  it('target 표를 옮겨 적지 않는다', () => {
    expect(profile).not.toMatch(/^\|[^\n]*\btargets?\b[^\n]*\|$/im);
  });
});
