import fs from 'node:fs/promises';
import path from 'node:path';

import { themes } from '@berrypjh/design-tokens';

import { describe, expect, it } from 'vitest';

import { publicSpecifiers } from '../../lib/package-exports';

import { REPO_ROOT, TARGETS } from './config';
import { buildCatalog } from './generate';
import { type Catalog, catalogSchema, evidenceIdsOf, serializeCatalog } from './schema';

/**
 * 실제 빌드 산출물(dist declaration)에 대해 돈다.
 * dist가 없으면 generator가 명확한 메시지로 실패한다 — 조용히 통과하지 않는다.
 */

const web = await buildCatalog(TARGETS['react-ui']);
const native = await buildCatalog(TARGETS['react-native-ui']);

const readPkg = async (root: string) =>
  JSON.parse(await fs.readFile(path.join(REPO_ROOT, root, 'package.json'), 'utf8'));

/** source barrel에서 재export되는 심볼 이름 — catalog와의 drift를 잡는 독립 기준. */
const barrelExports = async (globDir: string): Promise<string[]> => {
  const dir = path.join(REPO_ROOT, globDir);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const names: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = path.join(dir, entry.name, 'index.ts');
    const text = await fs.readFile(file, 'utf8').catch(() => '');
    for (const m of text.matchAll(/export (?:type )?\{([^}]*)\}/g)) {
      for (const raw of m[1].split(',')) {
        const name = raw
          .trim()
          .split(/\s+as\s+/)
          .pop()
          ?.trim();
        if (name) names.push(name);
      }
    }
  }
  return [...new Set(names)].sort();
};

const declarationText = async (target: (typeof TARGETS)[string]) =>
  fs.readFile(path.join(REPO_ROOT, target.packageRoot, target.declarationFile), 'utf8');

describe.each([
  ['web', web, TARGETS['react-ui']],
  ['react-native', native, TARGETS['react-native-ui']],
] as const)('%s catalog', (_label, catalog, target) => {
  it('validates against the schema', () => {
    expect(catalogSchema.safeParse(catalog).success).toBe(true);
    expect(catalog.platform).toBe(target.platform);
  });

  it('is deterministic across regeneration', async () => {
    const again = await buildCatalog(target);
    expect(serializeCatalog(again)).toBe(serializeCatalog(catalog));
    expect(again).toEqual(catalog);
  });

  it('matches the catalog the package build wrote to dist', async () => {
    const onDisk = await fs.readFile(
      path.join(REPO_ROOT, target.packageRoot, target.outputFile),
      'utf8',
    );
    expect(serializeCatalog(catalog)).toBe(onDisk);
  });

  it('derives exports from package.json rather than hardcoding them', async () => {
    const pkg = await readPkg(target.packageRoot);
    expect(catalog.package).toBe(pkg.name);
    expect(Object.values(catalog.exports).sort()).toEqual(
      publicSpecifiers(pkg.name, pkg.exports).sort(),
    );
  });

  it('gives every symbol a public importFrom', () => {
    const allowed = new Set(Object.values(catalog.exports));
    for (const symbol of Object.values(catalog.symbols)) {
      expect(allowed.has(symbol.importFrom)).toBe(true);
    }
  });

  it('contains no symbol that is absent from the built declaration', async () => {
    const text = await declarationText(target);
    const missing = Object.keys(catalog.symbols).filter(
      (name) => !new RegExp(`\\b${name}\\b`).test(text),
    );
    expect(missing).toEqual([]);
  });

  it('points at the token catalog instead of copying tokens', () => {
    expect(catalog.tokenCatalog).toBe('tokens.json');
    expect(JSON.stringify(catalog)).not.toContain('--ds-');
  });

  it('emits evidence ids in the Command 01 convention', () => {
    const ids = evidenceIdsOf(catalog);
    expect(ids).toContain(`package:${catalog.package}`);
    expect(ids.every((id) => /^(package|component|export|prop):/.test(id))).toBe(true);
  });
});

describe('web catalog contents', () => {
  it('covers every symbol re-exported from the source component barrels', async () => {
    const declared = await barrelExports('libs/react-ui/src/components');
    const missing = declared.filter((name) => !(name in web.symbols));
    expect(missing).toEqual([]);
  });

  it('exposes the components the handwritten doc had drifted away from', () => {
    for (const name of [
      'Popover',
      'PopoverPanel',
      'PopoverTrigger',
      'SegmentControl',
      'SkipLink',
    ]) {
      expect(web.symbols[name]?.kind).toBe('component');
    }
  });

  it('extracts library props and literal unions for a complex component', () => {
    const button = web.symbols.Button;
    expect(button.kind).toBe('component');
    expect(button.propsUnion).toBe(true);
    expect(Object.keys(button.props ?? {})).toEqual(
      expect.arrayContaining([
        'variant',
        'size',
        'color',
        'loading',
        'loadingPosition',
        'component',
      ]),
    );
    expect(button.props?.variant?.values).toEqual(['contained', 'outlined', 'text']);
    expect(button.props?.loading).toMatchObject({ type: 'boolean', required: false });
  });

  it('drops DOM props inherited from React typings', () => {
    const props = Object.keys(web.symbols.Button.props ?? {});
    for (const inherited of ['onClick', 'aria-label', 'id', 'tabIndex', 'onKeyDown', 'style']) {
      expect(props).not.toContain(inherited);
    }
    expect(props.length).toBeLessThan(40);
  });

  it('records a large literal union as a count instead of inlining it', () => {
    const bg = web.symbols.Box.props?.bg;
    expect(bg?.values).toBeUndefined();
    expect(bg?.valueCount).toBeGreaterThan(50);
  });

  it('marks a props type that is not publicly exported as null', () => {
    expect(web.symbols.TextField.propsType).toBeNull();
    expect(Object.keys(web.symbols.TextField.props ?? {})).toContain('helperText');
  });

  it('classifies non-component exports', () => {
    expect(web.symbols.cx.kind).toBe('function');
    expect(web.symbols.useFormControl.kind).toBe('hook');
    expect(web.symbols.Web.kind).toBe('namespace');
    expect(web.symbols.ThemeName.kind).toBe('type');
  });

  it('states an omitted type explicitly rather than emitting a fake one', () => {
    // 어느 심볼이 잘리는지는 선언 크기에 달렸으므로 이름을 박지 않고 규칙 자체를 검사한다.
    const omitted = Object.entries(web.symbols).filter(([, symbol]) => symbol.typeOmitted);

    expect(omitted.length).toBeGreaterThan(0);
    for (const [, symbol] of omitted) {
      expect(symbol.type).toBeNull();
    }
  });

  it('테마 레지스트리는 소비자용 형태라 타입이 그대로 실린다', () => {
    // 예전에는 테마별 리터럴이 길어 잘려 나갔다. ui-core가 `ThemeInfo[]`로 좁힌 뒤로는 실린다.
    expect(web.symbols.themes.typeOmitted).toBeUndefined();
    expect(web.symbols.themes.type).toBe('readonly ThemeInfo[]');
    expect(web.symbols.ThemeInfo.kind).toBe('type');
  });
});

describe('react-native catalog contents', () => {
  it('covers the source component and theme barrels', async () => {
    const declared = await barrelExports('libs/react-native-ui/src/components');
    expect(declared.filter((name) => !(name in native.symbols))).toEqual([]);
    for (const name of ['ThemeProvider', 'useTheme']) {
      expect(native.symbols[name]).toBeDefined();
    }
  });

  /**
   * 배럴이 없는 내부 원시는 **빌드 산출물에도** 나오면 안 된다.
   *
   * 소스 쪽 검사(`FormControl.test.tsx` 의 "배럴은 FormControl 만 내보낸다")는 배럴을 통한
   * 승격만 막는다. `src/index.ts` 가 그 파일을 직접 내보내면 배럴은 그대로인 채 선언과
   * 카탈로그로 샌다. 방향이 반대라 두 검사가 모두 필요하다.
   *
   * 위 `covers …` 검사도 이것을 대신하지 못한다 — 그쪽은 "배럴에 있는 것이 카탈로그에 있는가"
   * 이고, 카탈로그에 더 있는 것은 통과시킨다.
   */
  it('keeps barrel-less internals out of the built surface', async () => {
    const text = await declarationText(TARGETS['react-native-ui']);

    for (const internal of ['useFormControl', 'FormControlContext', 'InputBase', 'ButtonBase']) {
      expect(native.symbols[internal]).toBeUndefined();
      expect(new RegExp(`^export .*\\b${internal}\\b`, 'm').test(text)).toBe(false);
    }
  });

  it('extracts token-based Box props without React Native ViewProps', () => {
    const props = Object.keys(native.symbols.Box.props ?? {});
    expect(props).toEqual(expect.arrayContaining(['p', 'bg', 'radius', 'style']));
    for (const inherited of ['onLayout', 'accessible', 'testID', 'pointerEvents']) {
      expect(props).not.toContain(inherited);
    }
  });

  it('extracts theme symbols with their literal modes', () => {
    // 목록을 박아 두면 테마가 늘 때마다 낡는다. 레지스트리에서 유도해
    // "ThemeProvider가 등록된 테마 전부를 받는다"는 사실 자체를 검사한다.
    const registered = themes.map((theme) => theme.name).sort();

    expect(native.symbols.ThemeProvider.props?.mode?.values).toEqual(registered);
    expect(native.symbols.ThemeProvider.props?.children?.required).toBe(true);
    expect(native.symbols.useTheme.kind).toBe('hook');
    expect(native.symbols.getColor.kind).toBe('function');
  });
});

describe('catalog is smaller than the declaration it is derived from', () => {
  it.each([
    ['react-ui', web, TARGETS['react-ui']],
    ['react-native-ui', native, TARGETS['react-native-ui']],
  ] as const)('%s', async (_id, catalog: Catalog, target) => {
    const declaration = await declarationText(target);
    expect(serializeCatalog(catalog).length).toBeLessThan(declaration.length);
  });
});
