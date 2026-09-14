import { describe, expect, it } from 'vitest';

import {
  componentTokenSchema,
  designSystemSchema,
  designSystemSignalSchema,
  packageSurfaceSchema,
  runArtifactSchema,
  SIGNAL_STATES,
  tokenCatalogSchema,
} from '../src/index.js';

import {
  catalogSummary,
  componentToken,
  designSystem,
  packageSurface,
  ref,
  signal,
  testRef,
  tokenCatalog,
} from './design-system-fixtures.js';
import { artifact } from './fixtures.js';

const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) =>
  schema.safeParse(value).success;

describe('DesignSystemSignal — 상태 셀 하나의 근거', () => {
  it('fixture 가 통과한다', () => {
    expect(ok(designSystemSignalSchema, signal())).toBe(true);
  });

  it('한정된 상태 어휘만 받는다 — 분류되지 않은 상태는 거부한다', () => {
    expect([...SIGNAL_STATES]).toEqual([
      'pressed',
      'focus-visible',
      'size-sm',
      'size-md',
      'reduced-motion',
    ]);
    expect(ok(designSystemSignalSchema, signal({ state: 'hover' }))).toBe(false);
  });

  it('tested 는 소비 근거와 test 근거가 모두 있어야 한다', () => {
    expect(ok(designSystemSignalSchema, signal({ tested: null }))).toBe(false);
    expect(ok(designSystemSignalSchema, signal({ consumed: null }))).toBe(false);
  });

  it('consumed 는 test 근거를 갖지 않는다 — 있으면 tested 다', () => {
    expect(ok(designSystemSignalSchema, signal({ observationKind: 'consumed' }))).toBe(false);
    expect(
      ok(designSystemSignalSchema, signal({ observationKind: 'consumed', tested: null })),
    ).toBe(true);
  });

  it('declared 는 token 과 선언 위치만 가진다', () => {
    const declared = { observationKind: 'declared', consumed: null, tested: null };
    expect(ok(designSystemSignalSchema, signal(declared))).toBe(true);
    expect(ok(designSystemSignalSchema, signal({ ...declared, token: null, declared: null }))).toBe(
      false,
    );
  });

  it('unknown·not-applicable 은 이유가 필요하다', () => {
    const unknown = { observationKind: 'unknown', consumed: null, tested: null };
    expect(ok(designSystemSignalSchema, signal(unknown))).toBe(false);
    expect(ok(designSystemSignalSchema, signal({ ...unknown, reason: '소비 근거 없음' }))).toBe(
      true,
    );
    expect(ok(designSystemSignalSchema, signal({ observationKind: 'not-applicable' }))).toBe(false);
    expect(
      ok(
        designSystemSignalSchema,
        signal({ observationKind: 'not-applicable', reason: 'elevation 으로 표현' }),
      ),
    ).toBe(true);
  });

  it('실행하지 않은 test 를 통과로 싣지 않는다', () => {
    expect(ok(designSystemSignalSchema, signal({ tested: testRef({ execution: 'passed' }) }))).toBe(
      false,
    );
  });

  it('상태는 색 외 텍스트 label 을 가진다', () => {
    expect(ok(designSystemSignalSchema, signal({ label: '' }))).toBe(false);
  });

  it('id 는 component.platform.state 다', () => {
    expect(ok(designSystemSignalSchema, { ...signal(), id: 'Button.web.pressed' })).toBe(false);
  });
});

describe('componentToken — authored source 와 생성 산출물을 구분한다', () => {
  it('fixture 가 통과한다', () => {
    expect(ok(componentTokenSchema, componentToken())).toBe(true);
  });

  it('authoring 근거가 없으면 lineage 는 unavailable 이다', () => {
    const noSource = {
      authored: null,
      lineage: { status: 'unavailable', reason: 'authored 없음' },
    };
    expect(ok(componentTokenSchema, componentToken(noSource))).toBe(true);
    expect(ok(componentTokenSchema, componentToken({ authored: null }))).toBe(false);
    expect(
      ok(
        componentTokenSchema,
        componentToken({ authored: null, lineage: { status: 'alias', references: ['a.b'] } }),
      ),
    ).toBe(false);
  });

  it('문서 정책은 문서 위치와 함께만 주장한다', () => {
    expect(
      ok(
        componentTokenSchema,
        componentToken({ documentedPolicy: { policy: 'internal', source: null } }),
      ),
    ).toBe(false);
  });
});

describe('tokenCatalog — resolved Web catalog', () => {
  it('fixture 가 통과한다', () => {
    expect(ok(tokenCatalogSchema, tokenCatalog())).toBe(true);
  });

  it('RN 값을 제공하지 않는다', () => {
    expect(ok(tokenCatalogSchema, tokenCatalog({ resolvedFor: 'react-native' }))).toBe(false);
  });

  it('valid 는 issue 가 없고, missing 은 읽은 값이 없다', () => {
    const issue = { code: 'row-length', message: 'color.x has 2 values for 3 themes' };
    expect(ok(tokenCatalogSchema, tokenCatalog({ issues: [issue] }))).toBe(false);
    expect(ok(tokenCatalogSchema, tokenCatalog({ status: 'invalid', issues: [issue] }))).toBe(true);
    expect(ok(tokenCatalogSchema, tokenCatalog({ status: 'missing' }))).toBe(false);
    expect(
      ok(
        tokenCatalogSchema,
        tokenCatalog({ status: 'missing', themes: null, categories: null, rowCount: null }),
      ),
    ).toBe(true);
  });
});

describe('designSystem', () => {
  it('fixture 가 통과한다', () => {
    expect(ok(designSystemSchema, designSystem())).toBe(true);
  });

  it('상태 셀 id 는 겹치지 않는다', () => {
    expect(ok(designSystemSchema, designSystem({ signals: [signal(), signal()] }))).toBe(false);
  });

  it('생성 산출물은 등록된 테마에 대해서만 기록한다', () => {
    const stray = {
      theme: 'sepia',
      kind: 'css',
      path: 'libs/design-tokens/dist/css/variables.sepia.css',
      status: 'present',
      reason: null,
    };
    expect(ok(designSystemSchema, designSystem({ artifacts: [stray] }))).toBe(false);
  });

  it('valid catalog 의 테마 순서는 registry 순서와 같아야 한다', () => {
    expect(
      ok(
        designSystemSchema,
        designSystem({ catalog: tokenCatalog({ themes: ['dark', 'light'] }) }),
      ),
    ).toBe(false);
  });

  it('없는 산출물은 이유를 가진다', () => {
    const [first, ...rest] = designSystem().artifacts;
    const missing = { ...first, status: 'missing', reason: null };
    expect(ok(designSystemSchema, designSystem({ artifacts: [missing, ...rest] }))).toBe(false);
  });

  it('WCAG 기준과 프로젝트 가시성 가드를 다른 basis 로 둔다', () => {
    const [wcag, visibility] = designSystem().contrastGuards;
    expect(wcag.basis).not.toBe(visibility.basis);
    expect(
      ok(
        designSystemSchema,
        designSystem({ contrastGuards: [{ ...visibility, basis: 'unknown' }] }),
      ),
    ).toBe(false);
  });
});

describe('packageSurface — source manifest 와 실제 산출물을 분리한다', () => {
  it('fixture 가 통과한다', () => {
    expect(ok(packageSurfaceSchema, packageSurface())).toBe(true);
  });

  it('산출물 일부만 있으면 partial 이다', () => {
    const [index, tokens] = packageSurface().emitted;
    const emitted = [index, { ...tokens, status: 'missing' }];
    expect(ok(packageSurfaceSchema, packageSurface({ emitted }))).toBe(false);
    expect(ok(packageSurfaceSchema, packageSurface({ emitted, build: 'partial' }))).toBe(true);
    const none = emitted.map((entry) => ({ ...entry, status: 'missing' }));
    expect(ok(packageSurfaceSchema, packageSurface({ emitted: none, build: 'missing' }))).toBe(
      true,
    );
  });

  it('catalog 재생성을 하지 않았으면 이유를 남긴다', () => {
    expect(
      ok(
        packageSurfaceSchema,
        packageSurface({ catalog: catalogSummary({ regenerated: 'not-run' }) }),
      ),
    ).toBe(false);
  });

  it('deprecated·typeOmitted·valueCount 를 보존한다', () => {
    const parsed = packageSurfaceSchema.parse(packageSurface());
    expect(parsed.catalog).toMatchObject({
      deprecated: ['cx', 'Web'],
      typeOmittedProps: ['Select.options'],
      valueCounts: [{ symbol: 'Icon', prop: 'name', count: 40 }],
    });
  });
});

describe('RunArtifact.designSystem·packageSurfaces', () => {
  it('artifact 는 design system 과 package surface 를 담는다', () => {
    expect(
      ok(
        runArtifactSchema,
        artifact({ designSystem: designSystem(), packageSurfaces: [packageSurface()] }),
      ),
    ).toBe(true);
  });

  it('이전에 수집된 run 은 수집하지 않은 것으로 읽힌다', () => {
    const {
      designSystem: _designSystem,
      packageSurfaces: _packageSurfaces,
      ...before
    } = artifact();
    expect(runArtifactSchema.parse(before)).toMatchObject({
      designSystem: null,
      packageSurfaces: [],
    });
  });

  it('source 위치는 안전한 상대 경로다', () => {
    const escaped = signal({ consumed: ref('../outside.ts', 1) });
    expect(ok(designSystemSignalSchema, escaped)).toBe(false);
  });
});
