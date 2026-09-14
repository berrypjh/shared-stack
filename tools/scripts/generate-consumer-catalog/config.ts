import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Platform } from './schema';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Web/RN은 build sequencing이 다르다 (react-ui는 build-types가 별도 target,
 * react-native-ui는 build 내부 단계). 두 build를 통일하지 않고 declaration 경로만
 * 설정으로 받아 같은 generator를 쓴다.
 */
export type CatalogTarget = {
  id: string;
  packageRoot: string;
  platform: Platform;
  /** packageRoot 기준 최종 번들 declaration 경로. */
  declarationFile: string;
  /** packageRoot 기준 출력 경로. */
  outputFile: string;
  /** 토큰 인벤토리 포인터. 복제하지 않는다. */
  tokenCatalog: string;
};

export const TARGETS: Record<string, CatalogTarget> = {
  'react-ui': {
    id: 'react-ui',
    packageRoot: 'libs/react-ui',
    platform: 'web',
    declarationFile: 'dist/types/index.d.ts',
    outputFile: 'dist/llm-catalog.json',
    tokenCatalog: 'tokens.json',
  },
  'react-native-ui': {
    id: 'react-native-ui',
    packageRoot: 'libs/react-native-ui',
    platform: 'react-native',
    declarationFile: 'dist/index.d.ts',
    outputFile: 'dist/llm-catalog.json',
    tokenCatalog: 'tokens.json',
  },
};

export const resolveTargets = (ids: string[]): CatalogTarget[] =>
  ids.map((id) => {
    const target = TARGETS[id];
    if (!target) {
      throw new Error(`unknown target "${id}". valid: ${Object.keys(TARGETS).join(', ')}`);
    }
    return target;
  });
