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

/**
 * 경로 spec 을 펼쳐 이어 붙인 내용. 측정과 live executor 가 같은 내용을 쓰도록 여기 한 벌만 둔다.
 * 없는 경로가 하나라도 있으면 `content` 는 null 이다 — 부분 내용을 전체인 척하지 않는다.
 */
export const readContextFiles = async (
  specs: string[],
): Promise<{ files: string[]; missingPaths: string[]; content: string | null }> => {
  const files: string[] = [];
  const missingPaths: string[] = [];
  for (const spec of specs) {
    const r = await expand(spec);
    files.push(...r.files);
    missingPaths.push(...r.missing);
  }
  const content =
    missingPaths.length > 0
      ? null
      : (await Promise.all(files.map((f) => fs.readFile(f, 'utf8')))).join('\n');
  return { files: files.map((f) => path.relative(REPO_ROOT, f)), missingPaths, content };
};

const measurePaths = async (specs: string[]): Promise<ContextSize> => {
  const { files, missingPaths, content } = await readContextFiles(specs);
  return content === null
    ? { files, missingPaths, chars: null, tokens: null }
    : { files, missingPaths, chars: content.length, tokens: countOpenAITokens(content) };
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
