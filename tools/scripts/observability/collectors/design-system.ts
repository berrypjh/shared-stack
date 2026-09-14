import fs from 'node:fs/promises';
import path from 'node:path';

import type {
  ComponentToken,
  DesignSystem,
  DesignSystemSignal,
  SourceRef,
} from '@berrypjh/observability-contracts';

import {
  comparePlatformValues,
  findAuthoredToken,
  leafAt,
  leafPaths,
  parseGeneratedTokens,
  parseNamespaces,
  parseRnProvider,
  parseThemeRegistry,
  parseTokenCategories,
  type TokenTree,
  validateTokenCatalog,
} from '../adapters/tokens';
import { ArtifactError, readText, resolveInside } from '../safe-fs';
import {
  findTokenConsumers,
  findUnmappedConsumers,
  resolveSignal,
  STATE_CELLS,
} from '../state-evidence';

/**
 * design system 근거 수집. authored registry·카테고리·authoring JSON 과 생성 산출물
 * (tokens.json·Web/RN 트리·CSS)·RN provider·UI source 소비·test 위치를 한 벌로 묶는다.
 * 어느 파일도 실행하지 않고, test 는 실행하지 않았으므로 not-run 이다.
 */

const DT = 'libs/design-tokens';
export const DESIGN_PATHS = {
  themes: `${DT}/src/themes.ts`,
  categories: `${DT}/src/lib/tokens.ts`,
  tokensDir: `${DT}/tokens`,
  catalog: `${DT}/dist/tokens.json`,
  generated: `${DT}/src/.generated`,
  css: `${DT}/dist/css`,
  rnProvider: 'libs/react-native-ui/src/theme/ThemeProvider.tsx',
  contrast: `${DT}/test/contrast.ts`,
  contrastTest: `${DT}/src/lib/contrast.test.ts`,
  docs: `${DT}/AGENTS.md`,
  genTsTokens: `${DT}/src/lib/genTsTokens.ts`,
} as const;

const CONSUMER_DIRS = ['libs/react-ui/src/components', 'libs/react-native-ui/src/components'];
const CONSUMER_FILE = /\.(scss|css|ts|tsx)$/;
const NOT_CONSUMER = /\.(test|spec|stories)\.tsx?$/;

/** 문서가 선언한 token 공개 정책. 문구가 없으면 undocumented 다. */
const DOCUMENTED_POLICIES = [
  {
    token: 'component.button',
    policy: 'internal' as const,
    path: DESIGN_PATHS.docs,
    phrase: '`component.button`은 소비처가 없어 **internal로 남긴다**',
  },
];

const readOptional = (root: string, file: string) =>
  readText(root, file).catch((error: unknown) => {
    if (error instanceof ArtifactError && error.kind === 'missing') return null;
    throw error;
  });

const lineOfPhrase = (text: string | null, phrase: string): number | null => {
  const index = text?.split('\n').findIndex((line) => line.includes(phrase)) ?? -1;
  return index === -1 ? null : index + 1;
};

const walk = async (root: string, dir: string): Promise<string[]> => {
  const entries = await fs
    .readdir(await resolveInside(root, dir), { withFileTypes: true })
    .catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(root, relative)));
    else if (entry.isFile() && CONSUMER_FILE.test(entry.name) && !NOT_CONSUMER.test(entry.name)) {
      files.push(relative);
    }
  }
  return files;
};

const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

type Artifact = DesignSystem['artifacts'][number];

const artifactOf = async (
  root: string,
  theme: string,
  kind: Artifact['kind'],
  file: string,
): Promise<{ artifact: Artifact; tree: TokenTree | null }> => {
  const text = await readOptional(root, file);
  if (text === null) {
    return {
      artifact: { theme, kind, path: file, status: 'missing', reason: `${file} 이 없다` },
      tree: null,
    };
  }
  if (kind === 'css')
    return { artifact: { theme, kind, path: file, status: 'present', reason: null }, tree: null };
  const tree = parseGeneratedTokens(text);
  return tree
    ? { artifact: { theme, kind, path: file, status: 'present', reason: null }, tree }
    : {
        artifact: {
          theme,
          kind,
          path: file,
          status: 'invalid',
          reason: `${file} 의 tokens 객체를 읽을 수 없다`,
        },
        tree: null,
      };
};

export const contrastGuards = (
  contrast: string | null,
  contrastTest: string | null,
): DesignSystem['contrastGuards'] => {
  const guards: DesignSystem['contrastGuards'] = [];
  const aa =
    contrast && /export const WCAG_AA = \{ text: ([\d.]+), nonText: ([\d.]+) \}/.exec(contrast);
  if (contrast && aa) {
    const source = {
      path: DESIGN_PATHS.contrast,
      line: contrast.slice(0, aa.index).split('\n').length,
    };
    guards.push(
      {
        id: 'wcag-aa-text',
        label: 'WCAG 2.1 AA 텍스트 대비 (1.4.3)',
        ratio: Number(aa[1]),
        basis: 'wcag-2.1-aa',
        source,
      },
      {
        id: 'wcag-aa-non-text',
        label: 'WCAG 2.1 AA 비텍스트 대비 (1.4.11)',
        ratio: Number(aa[2]),
        basis: 'wcag-2.1-aa',
        source,
      },
    );
  }
  const divider = contrastTest && /const DIVIDER_MIN = ([\d.]+);/.exec(contrastTest);
  if (contrastTest && divider) {
    guards.push({
      id: 'divider-visibility',
      label: '프로젝트 가시성 가드 — WCAG 기준 아님',
      ratio: Number(divider[1]),
      basis: 'project-visibility-guard',
      source: {
        path: DESIGN_PATHS.contrastTest,
        line: contrastTest.slice(0, divider.index).split('\n').length,
      },
    });
  }
  return guards;
};

type Finding = DesignSystem['findings'][number];

const findingsOf = (
  texts: Record<string, string | null>,
  categories: string[],
  categoriesRef: SourceRef,
  signals: DesignSystemSignal[],
  tokens: ComponentToken[],
): Finding[] => {
  const findings: Finding[] = [];
  const docLine = lineOfPhrase(
    texts[DESIGN_PATHS.docs],
    'RN Button·IconButton은 아직 눌림 표현이 없다',
  );
  const pressed = signals.filter(
    (signal) =>
      ['Button.react-native.pressed', 'IconButton.react-native.pressed'].includes(signal.id) &&
      signal.consumed !== null,
  );
  if (docLine && pressed.length > 0) {
    findings.push({
      code: 'doc-contradicts-source',
      message:
        '문서는 RN Button·IconButton 에 눌림 표현이 없다고 적지만 source 는 pressedOffset translateY 를 쓴다',
      doc: { path: DESIGN_PATHS.docs, line: docLine },
      evidence: pressed.flatMap((signal) => (signal.consumed ? [signal.consumed] : [])),
    });
  }
  for (const file of [DESIGN_PATHS.categories, DESIGN_PATHS.genTsTokens]) {
    const line = lineOfPhrase(texts[file], '9개 카테고리');
    if (line && categories.length !== 9) {
      findings.push({
        code: 'doc-stale-count',
        message: `주석은 9개 카테고리라 적지만 TOKEN_CATEGORIES 는 ${categories.length}개다`,
        doc: { path: file, line },
        evidence: [categoriesRef],
      });
    }
  }
  for (const token of tokens) {
    const { emitted, documentedPolicy } = token;
    if (documentedPolicy.policy !== 'internal' || !documentedPolicy.source) continue;
    if (!emitted.catalog && emitted.web === null && emitted.rn === null) continue;
    findings.push({
      code: 'internal-token-emitted',
      message: `${token.path} 은 문서상 internal 이지만 생성 산출물에 내보내진다 (소비 위치 ${token.consumers.length}개) — 권장 소비와 관측 산출물은 다르다`,
      doc: documentedPolicy.source,
      evidence: token.consumers,
    });
  }
  return findings;
};

export const collectDesignSystem = async ({
  workspaceRoot: root,
}: {
  workspaceRoot: string;
}): Promise<DesignSystem> => {
  const texts: Record<string, string | null> = {};
  const read = async (file: string) => (texts[file] ??= await readOptional(root, file));

  const themesText = await read(DESIGN_PATHS.themes);
  if (themesText === null) throw new ArtifactError('missing', `${DESIGN_PATHS.themes} 이 없다`);
  const themes = parseThemeRegistry(themesText);
  const names = themes.map((theme) => theme.name);
  const categoriesText = await read(DESIGN_PATHS.categories);
  if (categoriesText === null)
    throw new ArtifactError('missing', `${DESIGN_PATHS.categories} 이 없다`);
  const categories = parseTokenCategories(categoriesText);
  const categoriesRef = { path: DESIGN_PATHS.categories, line: categories.line };

  const artifacts: Artifact[] = [];
  const trees: Record<string, TokenTree | null> = {};
  for (const theme of names) {
    for (const [kind, file] of [
      ['web-tokens', `${DESIGN_PATHS.generated}/web/themes/${theme}/tokens.ts`],
      ['rn-tokens', `${DESIGN_PATHS.generated}/rn/themes/${theme}/tokens.ts`],
      ['css', `${DESIGN_PATHS.css}/variables.${theme}.css`],
    ] as const) {
      const { artifact, tree } = await artifactOf(root, theme, kind, file);
      artifacts.push(artifact);
      trees[`${kind}:${theme}`] = tree;
    }
  }
  const [base] = names;
  const webTree = trees[`web-tokens:${base}`];
  const rnTree = trees[`rn-tokens:${base}`];

  const namespaces: DesignSystem['namespaces'] = [];
  for (const [platform, dir] of [
    ['web', 'web'],
    ['react-native', 'rn'],
  ] as const) {
    const file = `${DESIGN_PATHS.generated}/${dir}/index.ts`;
    const text = await read(file);
    namespaces.push({
      platform,
      path: file,
      status: text === null ? 'missing' : 'present',
      namespaces: text === null ? [] : parseNamespaces(text),
    });
  }

  const validation = validateTokenCatalog(
    await read(DESIGN_PATHS.catalog),
    names,
    categories.names,
  );
  const validRows = validation.status === 'valid' ? validation.rows : null;

  const providerText = await read(DESIGN_PATHS.rnProvider);
  const provider = providerText === null ? null : parseRnProvider(providerText);
  const rnProvider: DesignSystem['rnProvider'] = {
    path: DESIGN_PATHS.rnProvider,
    status: providerText === null ? 'missing' : provider ? 'present' : 'invalid',
    modes: provider?.modes ?? [],
    satisfiesThemeName: provider?.satisfiesThemeName ?? false,
    missingThemes: provider ? names.filter((name) => !provider.modes.includes(name)) : [],
    extraModes: provider ? provider.modes.filter((mode) => !names.includes(mode)) : [],
    source: provider ? { path: DESIGN_PATHS.rnProvider, line: provider.line } : null,
  };

  // component token 은 base 테마 authoring 에만 둔다 (테마 델타 없음).
  const authoredFiles = themes[0].sourceDirs.map(
    (dir) => `${DESIGN_PATHS.tokensDir}/${dir}/component.json`,
  );
  for (const file of authoredFiles) await read(file);

  const tokenPaths = [
    ...new Set([
      ...Object.keys(validation.rows ?? {}).filter((id) => id.startsWith('component.')),
      ...(webTree && typeof webTree.component === 'object' && webTree.component
        ? leafPaths(webTree.component as TokenTree, 'component')
        : []),
      ...(rnTree && typeof rnTree.component === 'object' && rnTree.component
        ? leafPaths(rnTree.component as TokenTree, 'component')
        : []),
    ]),
  ].sort();

  const consumerFiles = [];
  for (const dir of CONSUMER_DIRS) {
    for (const file of await walk(root, dir)) {
      const text = await read(file);
      if (text !== null) consumerFiles.push({ path: file, text });
    }
  }
  const cssVars = Object.fromEntries(
    Object.entries(validRows ?? {}).flatMap(([id, row]) =>
      typeof row[0] === 'string' ? [[row[0], id]] : [],
    ),
  );
  const consumers = findTokenConsumers(consumerFiles, cssVars, tokenPaths);

  const authoredOf = (tokenPath: string) => {
    for (const file of [...authoredFiles].reverse()) {
      const text = texts[file];
      const found = text ? findAuthoredToken(text, tokenPath) : null;
      if (found) return { file, found };
    }
    return null;
  };

  const componentTokens: ComponentToken[] = [];
  for (const tokenPath of tokenPaths) {
    const row = validRows?.[tokenPath];
    const web = leafAt(webTree, tokenPath);
    const rn = leafAt(rnTree, tokenPath);
    const authored = authoredOf(tokenPath);
    const policy = DOCUMENTED_POLICIES.find((entry) => entry.token === tokenPath);
    const policyLine = policy ? lineOfPhrase(await read(policy.path), policy.phrase) : null;
    componentTokens.push({
      path: tokenPath,
      cssVar: row && typeof row[0] === 'string' ? row[0] : null,
      authored: authored
        ? {
            source: { path: authored.file, line: authored.found.line },
            rawValue: authored.found.rawValue,
            type: authored.found.type,
          }
        : null,
      lineage: !authored
        ? {
            status: 'unavailable',
            reason: `${authoredFiles.join(', ')} 에 ${tokenPath} authoring 이 없다`,
          }
        : authored.found.references.length > 0
          ? { status: 'alias', references: authored.found.references }
          : { status: 'literal' },
      emitted: { catalog: Boolean(row), web, rn },
      platformComparison: comparePlatformValues(web, rn),
      documentedPolicy:
        policy && policyLine
          ? { policy: policy.policy, source: { path: policy.path, line: policyLine } }
          : { policy: 'undocumented', source: null },
      consumers: consumers
        .filter((consumer) => consumer.token === tokenPath)
        .map((consumer) => consumer.source),
    });
  }

  for (const spec of STATE_CELLS) {
    for (const locator of [spec.consumed, spec.via, spec.test])
      if (locator) await read(locator.path);
  }
  const signals = STATE_CELLS.map((spec) =>
    resolveSignal(spec, {
      read: (file) => texts[file] ?? null,
      declared: (tokenPath, platform) => {
        const token = componentTokens.find((candidate) => candidate.path === tokenPath);
        const emitted = platform === 'web' ? token?.emitted.web : token?.emitted.rn;
        return token?.authored && emitted !== null && emitted !== undefined
          ? token.authored.source
          : null;
      },
    }),
  );

  for (const file of [
    DESIGN_PATHS.docs,
    DESIGN_PATHS.genTsTokens,
    DESIGN_PATHS.contrast,
    DESIGN_PATHS.contrastTest,
  ]) {
    await read(file);
  }

  return {
    registry: {
      path: DESIGN_PATHS.themes,
      themes: themes.map(({ name, selector, sourceDirs, line }) => ({
        name,
        selector,
        sourceDirs,
        line,
      })),
    },
    categories: { path: DESIGN_PATHS.categories, line: categories.line, names: categories.names },
    artifacts,
    namespaces: namespaces.map((entry) => ({
      ...entry,
      status:
        entry.status === 'present' &&
        JSON.stringify(entry.namespaces) !== JSON.stringify(names.map(capitalize))
          ? 'invalid'
          : entry.status,
    })),
    catalog: {
      path: DESIGN_PATHS.catalog,
      status: validation.status,
      resolvedFor: 'web',
      themes: validation.themes,
      categories: validation.categories,
      rowCount: validation.rowCount,
      issues: validation.issues as DesignSystem['catalog']['issues'],
    },
    rnProvider,
    componentTokens,
    signals,
    unmappedConsumers: findUnmappedConsumers(consumerFiles, STATE_CELLS, cssVars, tokenPaths),
    contrastGuards: contrastGuards(texts[DESIGN_PATHS.contrast], texts[DESIGN_PATHS.contrastTest]),
    findings: findingsOf(texts, categories.names, categoriesRef, signals, componentTokens),
  };
};
