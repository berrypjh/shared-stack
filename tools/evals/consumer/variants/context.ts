import fs from 'node:fs/promises';
import path from 'node:path';

import { countOpenAITokens, openAIModelFromEnv } from '../../../lib/token-count';
import { fromRepoRoot, REPO_ROOT } from '../runner/paths';

import type { Variant } from './index';

/** `tools/scripts/measure-tokens`와 같은 tiktoken 구현을 재사용한다. */

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.json', '.md', '.d.ts']);
const SKIP_DIRS = new Set(['.generated', 'node_modules', 'dist', '__snapshots__']);

export type ContextSize = {
  files: string[];
  missingPaths: string[];
  chars: number | null;
  /** 선언된 경로 중 하나라도 없으면 null — 부분 측정값을 총량인 척하지 않는다. */
  tokens: number | null;
};

export type VariantContext = ContextSize & {
  variant: string;
  tokenModel: string;
  /**
   * routing이 있는 variant의 플랫폼별 실제 컨텍스트.
   * routing이 없으면 null — 0이나 union으로 대체하지 않는다.
   */
  routed: Record<string, ContextSize> | null;
};

const walk = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      out.push(...(await walk(path.join(dir, e.name))));
    } else if (SOURCE_EXTENSIONS.has(path.extname(e.name))) {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
};

const expand = async (spec: string): Promise<{ files: string[]; missing: string[] }> => {
  const isDir = spec.endsWith('/**');
  const target = fromRepoRoot(isDir ? spec.slice(0, -3) : spec);
  try {
    await fs.stat(target);
  } catch {
    return { files: [], missing: [spec] };
  }
  return { files: isDir ? await walk(target) : [target], missing: [] };
};

const measurePaths = async (specs: string[]): Promise<ContextSize> => {
  const files: string[] = [];
  const missingPaths: string[] = [];
  for (const spec of specs) {
    const r = await expand(spec);
    files.push(...r.files);
    missingPaths.push(...r.missing);
  }
  const relative = files.map((f) => path.relative(REPO_ROOT, f));

  if (missingPaths.length > 0) {
    return { files: relative, missingPaths, chars: null, tokens: null };
  }

  const content = (await Promise.all(files.map((f) => fs.readFile(f, 'utf8')))).join('\n');
  return {
    files: relative,
    missingPaths,
    chars: content.length,
    tokens: countOpenAITokens(content),
  };
};

/** variant의 initial context를 실제 파일에서 측정한다. 추정값을 쓰지 않는다. */
export const measureVariantContext = async (variant: Variant): Promise<VariantContext> => {
  const union = await measurePaths(variant.contextPaths);

  let routed: Record<string, ContextSize> | null = null;
  if (variant.routedContextPaths) {
    routed = {};
    for (const [platform, specs] of Object.entries(variant.routedContextPaths)) {
      routed[platform] = await measurePaths(specs);
    }
  }

  return { variant: variant.id, ...union, tokenModel: openAIModelFromEnv(), routed };
};
