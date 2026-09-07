import { describe, expect, it } from 'vitest';

import { INTERNAL_PACKAGES, PLATFORM_PACKAGES, resolvePackages } from './packages';
import { NATIVE_PACKAGE, WEB_PACKAGE } from './platform';
import { loadCatalogs } from './repo-source';

const catalogs = await loadCatalogs();

describe('package resolution', () => {
  it('maps each platform to its public package', () => {
    expect(resolvePackages('web').packages).toEqual([WEB_PACKAGE]);
    expect(resolvePackages('react-native').packages).toEqual([NATIVE_PACKAGE]);
    expect(resolvePackages('both').packages).toEqual([WEB_PACKAGE, NATIVE_PACKAGE]);
    expect(resolvePackages('none').packages).toEqual([]);
  });

  it('forbids the other platform package on a single-platform route', () => {
    expect(resolvePackages('web').forbidden).toContain(NATIVE_PACKAGE);
    expect(resolvePackages('react-native').forbidden).toContain(WEB_PACKAGE);
  });

  it('always forbids the private internal packages', () => {
    for (const platform of ['web', 'react-native', 'both', 'none'] as const) {
      for (const internal of INTERNAL_PACKAGES) {
        expect(resolvePackages(platform).forbidden).toContain(internal);
      }
    }
  });

  it('chooses no package when the platform is ambiguous', () => {
    const decision = resolvePackages(null);
    expect(decision.packages).toEqual([]);
    expect(decision.reason).toContain('ambiguous');
  });

  it('confirms each platform package re-exports what its own consumers need from ui-core', () => {
    // ui-core를 직접 import하지 않아도 되는 근거 — 생성 카탈로그로 검증한다.
    const shared = [
      'themes',
      'ThemeName',
      'ThemeInfo',
      'ColorToken',
      'SpacingToken',
      'RadiusToken',
    ];
    const perPlatform: Record<string, string[]> = {
      [WEB_PACKAGE]: [...shared, 'Web', 'cx'],
      [NATIVE_PACKAGE]: [...shared, 'Native', 'getColor', 'createTheme', 'Theme', 'RNTokens'],
    };

    for (const [pkg, symbols] of Object.entries(perPlatform)) {
      for (const symbol of symbols) {
        expect(catalogs[pkg].symbols[symbol]).toBeDefined();
        expect(catalogs[pkg].symbols[symbol].deprecated).toBeUndefined();
      }
    }
  });

  it('does not present the other platform token tree as a live API', () => {
    // 아직 export는 되지만 deprecated라 카탈로그가 추천하지 않는다.
    expect(catalogs[WEB_PACKAGE].symbols.Native?.deprecated).toBe(true);
    expect(catalogs[NATIVE_PACKAGE].symbols.Web?.deprecated).toBe(true);
  });

  it('stops promoting build composition metadata to consumers', () => {
    // `ThemeDef.sourceDirs`는 토큰 파이프라인 내부 값이다. 소비자는 `ThemeInfo`를 쓴다.
    for (const pkg of Object.values(PLATFORM_PACKAGES)) {
      expect(catalogs[pkg].symbols.ThemeDef).toBeUndefined();
      expect(catalogs[pkg].symbols.ThemeInfo).toBeDefined();
    }
  });
});
