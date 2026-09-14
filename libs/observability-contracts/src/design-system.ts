import { z } from 'zod';

import { countSchema, reasonSchema, relativePathSchema } from './primitives.js';
import { safeText } from './test-summary.js';

/**
 * 토큰·테마·component state·catalog·package surface 를 source 와 검사 근거로 잇는 계약.
 * 파일 존재나 문자열 참조는 behavior 통과가 아니다 — test 는 실행 결과 없이 위치만 가진다.
 */

export const DS_PLATFORMS = ['web', 'react-native'] as const;
/** 한 셀의 가장 강한 근거. 약한 쪽으로 뭉개지 않고, 없는 것은 unknown 이다. */
export const OBSERVATION_KINDS = [
  'declared',
  'consumed',
  'tested',
  'unknown',
  'not-applicable',
] as const;
/** 한정된 상태 어휘. 여기 없는 상태는 분류하지 않는다. */
export const SIGNAL_STATES = [
  'pressed',
  'focus-visible',
  'size-sm',
  'size-md',
  'reduced-motion',
] as const;
/** 렌더 결과를 단언하는 test 와 source·CSS 텍스트를 단언하는 test 는 다른 근거다. */
export const TEST_EVIDENCE_KINDS = ['behavior-assertion', 'source-assertion'] as const;
export const ARTIFACT_STATUSES = ['present', 'missing', 'invalid'] as const;

export const sourceRefSchema = z.strictObject({
  path: relativePathSchema,
  line: z.number().int().positive(),
});

export const testRefSchema = z.strictObject({
  path: relativePathSchema,
  line: z.number().int().positive(),
  title: safeText(300),
  evidenceKind: z.enum(TEST_EVIDENCE_KINDS),
  /** static 수집은 test 를 실행하지 않는다. runner 결과와 잇기 전까지 통과로 싣지 않는다. */
  execution: z.literal('not-run'),
});

const tokenPathSchema = z.string().regex(/^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$/, 'token path');
const themeNameSchema = z.string().regex(/^[a-z][a-zA-Z0-9]*$/);
const nameSchema = z.string().min(1).max(200);

export const designSystemSignalSchema = z
  .strictObject({
    id: z.string().max(200),
    component: z.string().regex(/^[A-Z][A-Za-z]+$/),
    platform: z.enum(DS_PLATFORMS),
    state: z.enum(SIGNAL_STATES),
    token: tokenPathSchema.nullable(),
    /** 색이 아닌 텍스트로 상태를 말한다. */
    label: safeText(200),
    observationKind: z.enum(OBSERVATION_KINDS),
    /** token 이 해당 플랫폼에 생성됐을 때의 authoring 위치. */
    declared: sourceRefSchema.nullable(),
    consumed: sourceRefSchema.nullable(),
    /** 소비가 다른 컴포넌트를 거칠 때 그 연결 위치 (예: IconButton → ButtonBase). */
    via: sourceRefSchema.nullable(),
    tested: testRefSchema.nullable(),
    reason: reasonSchema.nullable(),
  })
  .superRefine((signal, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (signal.id !== `${signal.component}.${signal.platform}.${signal.state}`) {
      issue('id must be component.platform.state');
    }
    if (signal.declared && signal.token === null) issue('a declaration needs a token');
    const { consumed, tested, declared, reason } = signal;
    switch (signal.observationKind) {
      case 'tested':
        if (!consumed || !tested) issue('tested needs consumed and tested evidence');
        break;
      case 'consumed':
        if (!consumed || tested) issue('consumed has consumed evidence and no test evidence');
        break;
      case 'declared':
        if (!declared || consumed || tested) issue('declared has only a declaration');
        break;
      case 'unknown':
        if (consumed || tested || !reason) issue('unknown has no evidence and a reason');
        break;
      case 'not-applicable':
        if (!reason) issue('not-applicable needs a reason');
        break;
    }
  });

const emittedValueSchema = z.union([z.string().max(200), z.number()]).nullable();

export const componentTokenSchema = z
  .strictObject({
    path: tokenPathSchema,
    /** tokens.json row 의 실제 cssVar. catalog 가 valid 가 아니면 null — 이름을 만들어 내지 않는다. */
    cssVar: z
      .string()
      .regex(/^--ds-[a-z0-9-]+$/)
      .nullable(),
    authored: z
      .strictObject({ source: sourceRefSchema, rawValue: safeText(200), type: safeText(40) })
      .nullable(),
    /** authoring 원문에서 읽은 참조까지만. 그 너머의 alias graph 는 catalog 로 복원할 수 없다. */
    lineage: z.discriminatedUnion('status', [
      z.strictObject({ status: z.literal('literal') }),
      z.strictObject({ status: z.literal('alias'), references: z.array(tokenPathSchema).min(1) }),
      z.strictObject({ status: z.literal('unavailable'), reason: reasonSchema }),
    ]),
    /** base 테마 기준 관측 산출물 값. 권장 소비 여부와 별개다. */
    emitted: z.strictObject({
      catalog: z.boolean(),
      web: emittedValueSchema,
      rn: emittedValueSchema,
    }),
    platformComparison: z.enum(['identical', 'unit-conversion', 'divergent', 'unavailable']),
    documentedPolicy: z.strictObject({
      policy: z.enum(['internal', 'public', 'undocumented']),
      source: sourceRefSchema.nullable(),
    }),
    /** UI 라이브러리 source 에서 찾은 소비 위치 (test·story 제외). */
    consumers: z.array(sourceRefSchema),
  })
  .superRefine((token, ctx) => {
    if ((token.authored === null) !== (token.lineage.status === 'unavailable')) {
      ctx.addIssue({
        code: 'custom',
        message: 'lineage is unavailable exactly when nothing is authored',
      });
    }
    if (
      (token.documentedPolicy.policy === 'undocumented') !==
      (token.documentedPolicy.source === null)
    ) {
      ctx.addIssue({ code: 'custom', message: 'a documented policy needs its document location' });
    }
  });

export const CATALOG_ISSUE_CODES = [
  'json',
  'row-shape',
  'schema-text',
  'theme-order',
  'categories',
  'row-length',
  'css-var',
  'row-order',
] as const;

export const tokenCatalogSchema = z
  .strictObject({
    path: relativePathSchema,
    status: z.enum(['valid', 'invalid', 'missing']),
    /** tokens.json 은 resolved Web catalog 다. RN 값은 여기서 나오지 않는다. */
    resolvedFor: z.literal('web'),
    themes: z.array(themeNameSchema).nullable(),
    categories: z.array(nameSchema).nullable(),
    rowCount: countSchema.nullable(),
    issues: z.array(z.strictObject({ code: z.enum(CATALOG_ISSUE_CODES), message: reasonSchema })),
  })
  .superRefine((catalog, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (catalog.status === 'valid' && catalog.issues.length > 0)
      issue('a valid catalog has no issues');
    if (catalog.status === 'invalid' && catalog.issues.length === 0)
      issue('an invalid catalog says why');
    if (
      catalog.status === 'missing' &&
      (catalog.themes !== null ||
        catalog.categories !== null ||
        catalog.rowCount !== null ||
        catalog.issues.length > 0)
    ) {
      issue('a missing catalog has nothing read');
    }
  });

const artifactSchema = z
  .strictObject({
    theme: themeNameSchema,
    kind: z.enum(['web-tokens', 'rn-tokens', 'css']),
    path: relativePathSchema,
    status: z.enum(ARTIFACT_STATUSES),
    reason: reasonSchema.nullable(),
  })
  .refine(
    (artifact) => (artifact.status === 'present') === (artifact.reason === null),
    'a reason unless present',
  );

export const designSystemSchema = z
  .strictObject({
    /** authored 테마 등록부. 이름·순서·selector·sourceDirs 는 source 에서 읽는다. */
    registry: z.strictObject({
      path: relativePathSchema,
      themes: z
        .array(
          z.strictObject({
            name: themeNameSchema,
            selector: safeText(200),
            sourceDirs: z.array(z.string().regex(/^[a-z][a-zA-Z0-9]*$/)).min(1),
            line: z.number().int().positive(),
          }),
        )
        .min(1),
    }),
    categories: z.strictObject({
      path: relativePathSchema,
      line: z.number().int().positive(),
      names: z.array(nameSchema),
    }),
    artifacts: z.array(artifactSchema),
    namespaces: z.array(
      z.strictObject({
        platform: z.enum(DS_PLATFORMS),
        path: relativePathSchema,
        status: z.enum(ARTIFACT_STATUSES),
        namespaces: z.array(z.string().regex(/^[A-Z][A-Za-z0-9]*$/)),
      }),
    ),
    catalog: tokenCatalogSchema,
    rnProvider: z.strictObject({
      path: relativePathSchema,
      status: z.enum(ARTIFACT_STATUSES),
      modes: z.array(z.string().regex(/^\w+$/)),
      satisfiesThemeName: z.boolean(),
      missingThemes: z.array(themeNameSchema),
      extraModes: z.array(z.string().regex(/^\w+$/)),
      source: sourceRefSchema.nullable(),
    }),
    componentTokens: z.array(componentTokenSchema),
    signals: z.array(designSystemSignalSchema),
    /** 한정된 셀이 가리키지 않는 소비 위치. 셀 분모에 넣지 않는다. */
    unmappedConsumers: z.array(z.strictObject({ token: tokenPathSchema, source: sourceRefSchema })),
    contrastGuards: z.array(
      z.strictObject({
        id: z.string().regex(/^[a-z0-9-]+$/),
        label: safeText(120),
        ratio: z.number().positive(),
        /** WCAG 기준과 프로젝트가 스스로 건 가시성 바닥을 섞지 않는다. */
        basis: z.enum(['wcag-2.1-aa', 'project-visibility-guard']),
        source: sourceRefSchema,
      }),
    ),
    /** 문서와 현재 source 가 어긋나는 곳. 보고만 한다. */
    findings: z.array(
      z.strictObject({
        code: z.enum(['doc-contradicts-source', 'doc-stale-count', 'internal-token-emitted']),
        message: reasonSchema,
        doc: sourceRefSchema,
        evidence: z.array(sourceRefSchema),
      }),
    ),
  })
  .superRefine((ds, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    const names = ds.registry.themes.map((theme) => theme.name);
    const ids = ds.signals.map((signal) => signal.id);
    if (new Set(ids).size !== ids.length) issue('duplicate state cell');
    if (ds.artifacts.some((artifact) => !names.includes(artifact.theme))) {
      issue('artifacts belong to registered themes');
    }
    if (
      ds.catalog.status === 'valid' &&
      JSON.stringify(ds.catalog.themes) !== JSON.stringify(names)
    ) {
      issue('a valid catalog lists themes in registry order');
    }
  });

const subpathSchema = z.string().regex(/^\.(\/[\w.@-]+)*$/);
const targetSchema = z.string().regex(/^\.\/[\w./@-]+$/);
const exportEntrySchema = z.strictObject({
  subpath: subpathSchema,
  conditions: z.array(z.string().regex(/^[\w-]+$/)),
  target: targetSchema,
});
const binSchema = z.strictObject({ name: z.string().regex(/^[\w@./-]+$/), target: targetSchema });
const presence = z.enum(['present', 'missing']);

export const catalogSummarySchema = z
  .strictObject({
    path: relativePathSchema,
    status: z.enum(['valid', 'invalid', 'missing']),
    reason: reasonSchema.nullable(),
    schemaVersion: z.number().int().nullable(),
    platform: z.enum(DS_PLATFORMS).nullable(),
    symbolCount: countSchema.nullable(),
    deprecated: z.array(nameSchema),
    propsUnion: z.array(nameSchema),
    typeOmittedSymbols: z.array(nameSchema),
    /** `Symbol.prop`. catalog 에 없는 prop 은 여기서도 판정하지 않는다 (상속 prop 은 싣지 않는다). */
    typeOmittedProps: z.array(nameSchema),
    valueCounts: z.array(
      z.strictObject({ symbol: nameSchema, prop: nameSchema, count: z.number().int().positive() }),
    ),
    /** 기존 catalog generator 로 다시 만들어 dist 바이트와 비교한 결과. */
    regenerated: z.enum(['identical', 'differs', 'not-run']),
    regeneratedReason: reasonSchema.nullable(),
  })
  .superRefine((summary, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if ((summary.status === 'valid') !== (summary.reason === null)) issue('a reason unless valid');
    if ((summary.regenerated === 'not-run') !== (summary.regeneratedReason !== null)) {
      issue('regeneration that did not run says why');
    }
    if (summary.status !== 'valid' && summary.symbolCount !== null)
      issue('only a valid catalog is counted');
  });

export const BUILD_STATES = ['complete', 'partial', 'missing', 'not-applicable'] as const;

export const packageSurfaceSchema = z
  .strictObject({
    name: z.string().regex(/^@?[\w.-]+(\/[\w.-]+)?$/),
    path: relativePathSchema,
    private: z.boolean(),
    /** 소스 package.json 이 선언한 것. */
    sourceManifest: z.strictObject({
      path: relativePathSchema,
      exports: z.array(exportEntrySchema),
      bin: z.array(binSchema),
    }),
    /** 선언된 target 이 실제로 만들어졌는지. */
    emitted: z.array(exportEntrySchema.extend({ status: presence })),
    emittedBin: z.array(binSchema.extend({ status: presence })),
    build: z.enum(BUILD_STATES),
    /** 빌드가 dist 에 남긴 manifest 사본. 없으면 null. */
    emittedManifest: z
      .strictObject({
        path: relativePathSchema,
        status: presence,
        exportsRemoved: z.boolean().nullable(),
      })
      .nullable(),
    tokensCopy: z
      .strictObject({
        path: relativePathSchema,
        status: presence,
        identicalToDesignTokens: z.boolean().nullable(),
      })
      .nullable(),
    catalog: catalogSummarySchema.nullable(),
    /** 이 표면을 고정하는 기존 test 위치. 실행 결과는 싣지 않는다. */
    tests: z.array(testRefSchema),
  })
  .superRefine((surface, ctx) => {
    const statuses = surface.emitted.map((entry) => entry.status);
    const expected =
      statuses.length === 0
        ? 'not-applicable'
        : statuses.every((status) => status === 'present')
          ? 'complete'
          : statuses.every((status) => status === 'missing')
            ? 'missing'
            : 'partial';
    if (surface.build !== expected) {
      ctx.addIssue({ code: 'custom', path: ['build'], message: `build must be ${expected}` });
    }
  });

export type SourceRef = z.infer<typeof sourceRefSchema>;
export type TestRef = z.infer<typeof testRefSchema>;
export type DesignSystemSignal = z.infer<typeof designSystemSignalSchema>;
export type ComponentToken = z.infer<typeof componentTokenSchema>;
export type TokenCatalog = z.infer<typeof tokenCatalogSchema>;
export type DesignSystem = z.infer<typeof designSystemSchema>;
export type CatalogSummary = z.infer<typeof catalogSummarySchema>;
export type PackageSurface = z.infer<typeof packageSurfaceSchema>;
