import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

/**
 * standards rule 본문과 shared-stack 적용 fixture 검사.
 * 추출 근거는 docs/claude-harness/standards-sources.md.
 */

type Rule = { id: string; source: string; scope: 'core' | 'optional' };
type Source = {
  plugin: { name: string; version: string };
  manifest: { schemaVersion: 1; rules: Rule[] };
  bodies: Record<string, string>;
};
type StandardsCore = {
  loadSource: () => Promise<Source>;
  validateConfig: (value: unknown, manifest: Source['manifest']) => unknown;
  buildExpectedFiles: (input: Source & { config: unknown }) => { path: string; content: string }[];
};

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const CORE_MODULE = path.join(REPO_ROOT, 'plugins/berry-dev/scripts/standards-core.mjs');
const FIXTURE = fileURLToPath(new URL('./fixtures/shared-stack.standards.json', import.meta.url));

/** 다른 저장소의 제품 · 플랫폼 세부가 공용 본문에 새지 않았는지 보는 표지. 통과가 의미 검토를 대신하지 않는다. */
const LEAK_MARKERS = [
  /\bsnapdone\b/i,
  /\bwebview\b/i,
  /\beas\b/i,
  /\bexpo\b/i,
  /\bgin\b/i,
  /\bswagger\b/i,
  /\bgo\b/i,
  /\bapps\/(web|mobile|api)\b/,
  /\blocalhost\b/i,
  /\bonboarding\b/i,
  '온보딩',
  '인증',
  '캘린더',
  '지출',
  '임베딩',
  '프롬프트',
  '신뢰도',
  '했습니다',
  '해요',
  'keep-all',
  '320',
  '44',
  '1.5',
  '010',
];

let core: StandardsCore;
let source: Source;
const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8')) as {
  rules: Record<string, true | { paths: string[] }>;
};
const pathsOf = (id: string) => {
  const choice = fixture.rules[id];
  return choice === true ? [] : choice.paths;
};

beforeAll(async () => {
  core = (await import(pathToFileURL(CORE_MODULE).href)) as StandardsCore;
  source = await core.loadSource();
});

describe('source rule 본문', () => {
  it('core 하나와 optional 넷을 등록한다', () => {
    expect(source.manifest.rules.map((rule) => [rule.id, rule.scope])).toEqual([
      ['berry-consumer', 'optional'],
      ['core', 'core'],
      ['cross-runtime-pure', 'optional'],
      ['docs-ko', 'optional'],
      ['ko-ui', 'optional'],
    ]);
  });

  it('모든 rule 이 적용 대상과 제외를 적는다', () => {
    for (const [id, body] of Object.entries(source.bodies)) {
      expect(body, id).toContain('## 적용 대상 · 제외');
      expect(body, id).toMatch(/^- 적용 — /m);
      expect(body, id).toMatch(/^- 제외 — /m);
    }
  });

  it('다른 저장소의 제품 · 플랫폼 표지와 숫자 값이 없다', () => {
    for (const [id, body] of Object.entries(source.bodies)) {
      const leaked = LEAK_MARKERS.filter((marker) =>
        typeof marker === 'string' ? body.includes(marker) : marker.test(body),
      );
      expect(leaked.map(String), id).toEqual([]);
      const withoutListNumbers = body.replace(/^\d+\. /gm, '');
      expect(withoutListNumbers.match(/\d+/g), id).toBeNull();
    }
  });

  it('berry-consumer 는 API · prop · 토큰 목록을 복제하지 않는다', () => {
    const body = source.bodies['berry-consumer'];
    for (const symbol of ['Button', 'Box', 'Stack', 'TextField', 'ThemeProvider', 'getColor']) {
      expect(body).not.toContain(symbol);
    }
    expect(body).not.toMatch(/`color\.|`spacing\./);
  });

  it('berry-consumer 는 maintainer 작업을 제외하고, source 읽기를 명시적 upstream 조사로 한정한다', () => {
    const body = source.bodies['berry-consumer'];
    expect(body).toMatch(/^- 제외 — 패키지 자체를 만드는 작업\(maintainer\)/m);
    expect(body).toContain('명시적으로 요청했을 때의 마지막 단계');
  });

  it('cross-runtime-pure 는 렌더러 · 앱 · UI 패키지를 제외한다', () => {
    expect(source.bodies['cross-runtime-pure']).toMatch(
      /^- 제외 — 렌더러 · 앱 · UI 컴포넌트 패키지/m,
    );
  });
});

describe('shared-stack 적용 fixture', () => {
  it('config 로 유효하고 core 외에는 고른 rule 만 생성한다', () => {
    const files = core.buildExpectedFiles({ ...source, config: fixture });
    expect(files.map((file) => file.path)).toEqual([
      'berry-consumer.md',
      'core.md',
      'cross-runtime-pure.md',
      'docs-ko.md',
      'manifest.json',
    ]);
  });

  it('pure rule 은 ui-core 의 소스 경로에만 매핑한다', () => {
    expect(pathsOf('cross-runtime-pure')).toEqual(['libs/ui-core/src/**']);
  });

  it('consumer rule 은 demo · quality-lab 의 소비 경로에만 매핑하고 libs 에는 없다', () => {
    const paths = pathsOf('berry-consumer');
    expect(paths.length).toBeGreaterThan(0);
    for (const entry of paths) {
      expect(entry).toMatch(/^apps\/(demo-web|demo-mobile|quality-lab)\/src\/\*\*$/);
    }
  });

  it('두 rule 의 경로가 겹치지 않는다 — maintainer 와 consumer 가 한 파일에 함께 걸리지 않는다', () => {
    const top = (entry: string) => entry.split('/').slice(0, 2).join('/');
    const pure = new Set(pathsOf('cross-runtime-pure').map(top));
    expect(pathsOf('berry-consumer').filter((entry) => pure.has(top(entry)))).toEqual([]);
  });

  it('모든 경로의 glob 앞부분이 저장소에 디렉터리로 있다', () => {
    const entries = Object.keys(fixture.rules).flatMap(pathsOf);
    for (const entry of entries) {
      const prefix = entry.split('/').filter((segment) => !/[*?{[]/.test(segment));
      const dir = path.join(REPO_ROOT, ...prefix);
      expect(existsSync(dir) && statSync(dir).isDirectory(), entry).toBe(true);
    }
  });

  it('생성 rule 은 frontmatter · comment 뒤에 source 본문을 byte 그대로 싣고, 두 번 만들어도 같다', () => {
    const first = core.buildExpectedFiles({ ...source, config: fixture });
    expect(core.buildExpectedFiles({ ...source, config: fixture })).toEqual(first);
    for (const file of first.filter((entry) => entry.path.endsWith('.md'))) {
      const id = file.path.replace(/\.md$/, '');
      const paths = pathsOf(id);
      const lines = file.content.split('\n');
      const header = paths.length
        ? ['---', 'paths:', ...paths.map((entry) => `  - ${JSON.stringify(entry)}`), '---']
        : [];
      expect(lines.slice(0, header.length), id).toEqual(header);
      expect(lines[header.length], id).toMatch(/^<!-- berry-dev\/standards format 1 \| /);
      expect(lines.slice(header.length + 2).join('\n'), id).toBe(source.bodies[id]);
    }
  });
});
