import fs from 'node:fs/promises';

import type { TransformedToken } from 'style-dictionary/types';

import type { ThemeBuild } from './sd.js';
import { classifyTokenPath, cssVarName, getTokenValue } from './tokens.js';

const PREFIX = 'ds';

type Item = { cssVar: string; values: Record<string, unknown> };

/** 전 테마의 web 토큰을 path id별로 모아 테마별 값 채우기 */
const collectItems = (
  builds: ThemeBuild[],
): { items: Record<string, Item>; categories: Set<string>; themeOrder: string[] } => {
  const themeOrder = builds.map((b) => b.theme);
  const items: Record<string, Item> = {};
  const categories = new Set<string>();
  for (const build of builds) {
    for (const t of build.web.allTokens as TransformedToken[]) {
      const classified = classifyTokenPath(t.path);
      const id = classified.join('.');
      categories.add(classified[0] as string);
      if (!items[id]) {
        items[id] = { cssVar: cssVarName(PREFIX, t.path), values: {} };
      }
      items[id].values[build.theme] = getTokenValue(t);
    }
  }
  return { items, categories, themeOrder };
};

/**
 * 슬림 JSON 카탈로그 작성 (`tokens[path] = [cssVar, ...valuesInThemesOrder]`).
 * 토큰을 한 줄씩 직렬화해 들여쓰기·구두점을 최소화한다.
 */
export const writeTokensJson = async (builds: ThemeBuild[], outFileAbs: string): Promise<void> => {
  const { items, categories, themeOrder } = collectItems(builds);
  const sortedIds = Object.keys(items).sort();
  const sortedCategories = [...categories].sort();

  const lines = sortedIds.map((id) => {
    const item = items[id];
    const row = [item.cssVar, ...themeOrder.map((th) => item.values[th] ?? null)];
    return `    ${JSON.stringify(id)}: ${JSON.stringify(row)}`;
  });

  const out = [
    '{',
    `  "schema": "tokens[path] = [cssVar, ...valuesInThemesOrder]",`,
    `  "themes": ${JSON.stringify(themeOrder)},`,
    `  "categories": ${JSON.stringify(sortedCategories)},`,
    `  "tokens": {`,
    lines.join(',\n'),
    '  }',
    '}',
    '',
  ].join('\n');

  await fs.writeFile(outFileAbs, out, 'utf8');
};
