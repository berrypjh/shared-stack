import { NATIVE_PACKAGE, WEB_PACKAGE } from './platform';
import type { PlatformClass } from './types';

/**
 * Platform → package. 소비자는 platform package의 re-export만으로 충분하므로
 * `ui-core`/`design-tokens`는 항상 forbidden이다 (둘 다 `private: true`이기도 하다).
 * 이 주장은 `packages.test.ts`가 생성 카탈로그로 검증한다.
 */

export const INTERNAL_PACKAGES = ['@berrypjh/ui-core', '@berrypjh/design-tokens'] as const;

export const PLATFORM_PACKAGES: Record<'web' | 'react-native', string> = {
  web: WEB_PACKAGE,
  'react-native': NATIVE_PACKAGE,
};

export type PackageDecision = {
  packages: string[];
  forbidden: string[];
  reason: string;
};

const forbid = (allowed: string[]): string[] =>
  [...Object.values(PLATFORM_PACKAGES), ...INTERNAL_PACKAGES]
    .filter((p) => !allowed.includes(p))
    .sort();

/** platform이 null(ambiguous)이면 package를 고르지 않는다. */
export const resolvePackages = (platform: PlatformClass | null): PackageDecision => {
  if (platform === null) {
    return {
      packages: [],
      forbidden: forbid([]),
      reason: 'platform is ambiguous — gather more evidence before choosing a package',
    };
  }
  if (platform === 'none') {
    return { packages: [], forbidden: forbid([]), reason: 'task does not need a UI package' };
  }
  const packages =
    platform === 'both'
      ? [PLATFORM_PACKAGES.web, PLATFORM_PACKAGES['react-native']]
      : [PLATFORM_PACKAGES[platform]];
  return { packages, forbidden: forbid(packages), reason: `platform is ${platform}` };
};
