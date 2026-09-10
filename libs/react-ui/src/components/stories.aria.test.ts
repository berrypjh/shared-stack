/**
 * 스토리의 ARIA 참조가 실제로 무언가를 가리키는지 검사한다.
 *
 * `aria-describedby="x"` 는 같은 문서에 `id="x"` 가 없으면 **조용히 아무것도 하지 않는다** —
 * 타입도 렌더도 통과하고, 스크린리더에게만 설명이 사라진다. 실제로 7개 스토리가 설명 요소를
 * 렌더하지 않은 채 이 속성만 달고 있었고, axe 는 그것을 `aria-valid-attr-value` incomplete 로
 * 보고했다.
 *
 * `storybook:a11y` 가 런타임에서 같은 결함을 잡지만 정적 Storybook 을 통째로 빌드해야 한다.
 * 이 검사는 소스만 읽어 몇 밀리초 안에 끝나므로 빌드 전에 먼저 걸린다.
 *
 * 파싱이 아니라 텍스트 스캔이다. 스토리는 리터럴 id 를 쓰는 것이 관례라 그 관례를 검사하며,
 * 템플릿 리터럴로 만든 id(`id={`tm-${name}-error-helper`}`)도 같은 모양으로 수집한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COMPONENTS = path.dirname(fileURLToPath(import.meta.url));

/**
 * 검사 대상 속성. `aria-*` 는 값이 공백으로 나뉜 id 목록일 수 있고, `htmlFor` 는 하나뿐이다 —
 * 공백 분리는 후자에 무해하다. 어디를 가리키지도 않는 `<label htmlFor>` 도 같은 결함이라
 * 함께 본다.
 */
const ID_REF_ATTRS = ['aria-describedby', 'aria-labelledby', 'htmlFor'] as const;

const storyFiles = fs
  .readdirSync(COMPONENTS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => {
    const dir = path.join(COMPONENTS, entry.name);
    return fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.stories.tsx'))
      .map((file) => path.join(dir, file));
  })
  .sort();

/** 리터럴 `id="x"` 와 템플릿 `id={`x`}` 를 함께 모은다. */
const declaredIds = (source: string): Set<string> =>
  new Set([
    ...[...source.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]),
    ...[...source.matchAll(/\bid=\{`([^`]+)`\}/g)].map((m) => m[1]),
  ]);

const idReferences = (source: string): string[] =>
  ID_REF_ATTRS.flatMap((attr) =>
    [...source.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].flatMap((m) => m[1].split(/\s+/)),
  );

describe('스토리의 ARIA id 참조', () => {
  it('검사할 스토리를 찾는다', () => {
    // 수집이 조용히 비면 아래 검사가 전부 공허하게 통과한다.
    expect(storyFiles.length).toBeGreaterThan(10);
  });

  it('참조를 실제로 걷어낸다', () => {
    const total = storyFiles.reduce(
      (sum, file) => sum + idReferences(fs.readFileSync(file, 'utf8')).length,
      0,
    );

    expect(total).toBeGreaterThan(10);
  });

  it.each(storyFiles.map((file) => [path.relative(COMPONENTS, file), file]))(
    '%s',
    (_label, file) => {
      const source = fs.readFileSync(file, 'utf8');
      const ids = declaredIds(source);

      const dangling = idReferences(source).filter((ref) => !ids.has(ref));

      expect(dangling).toEqual([]);
    },
  );
});
