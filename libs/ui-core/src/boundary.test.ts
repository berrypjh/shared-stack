/**
 * ui-core는 렌더러를 몰라야 한다.
 * 이 규칙은 지금 관례로만 지켜진다.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

/** ui-core가 import해서는 안 되는 패키지 */
const FORBIDDEN_MODULES = [/^react(\/|$)/, /^react-dom(\/|$)/, /^react-native(\/|$)/];

/** ui-core에 등장해서는 안 되는 렌더러 타입·전역 */
const FORBIDDEN_IDENTIFIERS = [
  'HTMLElement',
  'HTMLAttributes',
  'CSSProperties',
  'ReactNode',
  'ElementType',
  'ViewProps',
  'ViewStyle',
  'PressableProps',
  'TextInputProps',
  'StyleProp',
  'StyleSheet',
  'TextStyle',
  'Platform',
  'window',
  'document',
  // 렌더러 이벤트·스타일·a11y prop — 계약이 아니라 각 렌더러가 갖는다.
  'MouseEvent',
  'KeyboardEvent',
  'FocusEvent',
  'className',
  'accessibilityRole',
  'hitSlop',
];

/** 소스에서 주석 제거, 주석 안의 단어가 검사에 걸리지 않게 한다 */
const stripComments = (source: string): string =>
  source.replaceAll(/\/\*[\s\S]*?\*\//g, ' ').replaceAll(/\/\/[^\n]*/g, ' ');

const moduleSpecifiers = (source: string): string[] =>
  [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);

const collectSources = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collectSources(full)));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) files.push(full);
  }
  return files.sort();
};

const sources = await collectSources(SRC);

describe('ui-core 는 렌더러에 의존하지 않는다', () => {
  it('검사할 소스를 찾는다', () => {
    // 수집이 조용히 비면 아래 검사가 전부 통과해 버린다.
    // 개수 대신 진입점 존재로 확인한다 — 파일 수는 소유권 정리에 따라 움직인다.
    const found = sources.map((file) => path.relative(SRC, file));

    expect(found).toContain('index.ts');
    expect(found).toContain('tokens/types.ts');
    expect(found).toContain('contracts/box.ts');
  });

  it.each(sources.map((f) => [path.relative(SRC, f), f]))('%s', async (_label, file) => {
    const body = stripComments(await fs.readFile(file, 'utf8'));

    for (const pattern of FORBIDDEN_MODULES) {
      expect(moduleSpecifiers(body).filter((s) => pattern.test(s))).toEqual([]);
    }

    for (const identifier of FORBIDDEN_IDENTIFIERS) {
      expect(body).not.toMatch(new RegExp(`\\b${identifier}\\b`));
    }
  });
});
