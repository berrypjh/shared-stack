import { z } from 'zod';

import { excerptSchema } from './evidence.js';
import { countSchema, isoTimeSchema, reasonSchema, relativePathSchema } from './primitives.js';
import { safeText } from './test-summary.js';

/**
 * 접근성 검사 결과. 출처(sourceScope)마다 뜻이 달라 합치지 않는다 — axe 결과·token pair test·
 * compiled CSS 텍스트 검사·DOM test·사람의 관찰은 서로 다른 근거다. 접근성 점수는 만들지 않는다.
 */

export const ACCESSIBILITY_SOURCE_SCOPES = [
  'storybook',
  'quality-lab',
  'token-contrast',
  'static-css',
  'ui-test',
  'manual',
] as const;

/** axe 가 DOM 을 검사한 출처. 나머지는 test 결과나 사람의 기록이다. */
export const AXE_SCOPES = ['storybook', 'quality-lab'] as const;

export const ACCESSIBILITY_SOURCES = [
  'axe-playwright',
  'storybook-test-runner',
  'vitest-report',
  'manual-record',
] as const;

/** axe impact. 원본 null 은 adapter 가 node impact 로 채우거나 unknown 으로 둔다. */
export const AXE_IMPACTS = ['critical', 'serious', 'moderate', 'minor', 'unknown'] as const;

/** 검사 실행 자체의 결과. 접근성 판정이 아니다. */
export const AUDIT_OUTCOMES = ['completed', 'partial', 'scan-failed', 'not-run'] as const;

export const AUDIT_TARGET_STATUSES = ['scanned', 'skipped', 'scan-failed', 'not-run'] as const;

export const CHECK_KINDS = ['token-pair', 'css-rule', 'source-scan', 'dom-test'] as const;
export const CHECK_STATUSES = ['passed', 'failed', 'unknown', 'not-run'] as const;

/** 사람의 관찰. 자동 측정의 passed 와 다른 어휘다. */
export const MANUAL_STATUSES = ['observed-ok', 'observed-issue', 'not-run'] as const;
export const MANUAL_AREAS = [
  'keyboard',
  'focus',
  'screen-reader',
  'order',
  'contrast',
  'forced-colors',
  'motion',
] as const;

/** WCAG 기준과 프로젝트가 스스로 건 가시성 바닥을 섞지 않는다. */
export const CONTRAST_BASES = [
  'wcag-2.1-aa-text',
  'wcag-2.1-aa-non-text',
  'project-visibility-guard',
] as const;

export const WCAG_BASIS_RATIO = { 'wcag-2.1-aa-text': 4.5, 'wcag-2.1-aa-non-text': 3 } as const;

export const MAX_AXE_NODES = 20;

const ruleIdSchema = z.string().regex(/^[a-z0-9-]{1,80}$/, 'axe rule id');
const tagSchema = z.string().regex(/^[\w.-]{1,40}$/, 'axe tag');

export const axeNodeSchema = z.strictObject({
  /** CSS selector. iframe·shadow DOM 경로는 ` >>> ` 로 잇는다. */
  target: z.array(safeText(300)).min(1).max(5),
  /** 정제한 html 발췌. 원본 html 은 싣지 않는다. */
  excerpt: excerptSchema.nullable(),
});

export const axeRuleSchema = z
  .strictObject({
    id: ruleIdSchema,
    impact: z.enum(AXE_IMPACTS),
    tags: z.array(tagSchema).max(40),
    help: safeText(300),
    helpUrl: z.url({ protocol: /^https$/, hostname: /^dequeuniversity\.com$/ }).nullable(),
    /** 영향받은 node 전체 수. `nodes` 는 앞의 일부만 싣는다. */
    nodeCount: countSchema,
    nodes: z.array(axeNodeSchema).max(MAX_AXE_NODES),
  })
  .refine((rule) => rule.nodeCount >= rule.nodes.length, 'nodeCount counts every kept node');

/** rule 수와 node 수를 따로 둔다. passes·inapplicable 은 rule 수만 — 성공률로 쓰지 않는다. */
export const axeCountsSchema = z.strictObject({
  violationRules: countSchema,
  violationNodes: countSchema,
  incompleteRules: countSchema,
  incompleteNodes: countSchema,
  inapplicableRules: countSchema,
  passRules: countSchema,
});

/** 위반 node 수를 rule impact 별로. */
export const impactNodesSchema = z.strictObject({
  critical: countSchema,
  serious: countSchema,
  moderate: countSchema,
  minor: countSchema,
  unknown: countSchema,
});

const nodeTotal = (rules: { nodeCount: number }[]) =>
  rules.reduce((sum, rule) => sum + rule.nodeCount, 0);

const duplicateIds = (ids: string[]) => ids.filter((id, index) => ids.indexOf(id) !== index);

export const auditTargetSchema = z
  .strictObject({
    id: z.string().regex(/^[\w.:/@-]{1,200}$/, 'audit target id'),
    label: safeText(200),
    route: z
      .string()
      .regex(/^\/[\w\-/]*$/)
      .nullable(),
    storyId: z
      .string()
      .regex(/^[a-z0-9-]+--[a-z0-9-]+$/)
      .nullable(),
    theme: z
      .string()
      .regex(/^[a-z][a-zA-Z0-9]*$/)
      .nullable(),
    viewport: z
      .strictObject({
        name: z.string().regex(/^[a-z][a-z0-9-]{0,20}$/),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .nullable(),
    /** axe 가 본 범위. `#storybook-root` 또는 `document`. */
    scope: safeText(100),
    status: z.enum(AUDIT_TARGET_STATUSES),
    reason: reasonSchema.nullable(),
    scannedAt: isoTimeSchema.nullable(),
    counts: axeCountsSchema.nullable(),
    impactNodes: impactNodesSchema.nullable(),
    violations: z.array(axeRuleSchema),
    incomplete: z.array(axeRuleSchema),
  })
  .superRefine((target, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    const scanned = target.status === 'scanned';
    if (
      scanned !== (target.counts !== null) ||
      scanned !== (target.impactNodes !== null) ||
      scanned !== (target.scannedAt !== null)
    ) {
      issue('only a scanned target has counts, impact nodes and a scan time');
    }
    if (!scanned && (target.violations.length > 0 || target.incomplete.length > 0)) {
      issue('only a scanned target has rules');
    }
    if (!scanned && target.reason === null) issue('a target that was not scanned says why');
    for (const list of [target.violations, target.incomplete]) {
      for (const id of duplicateIds(list.map((rule) => rule.id))) issue(`duplicate rule ${id}`);
    }
    const { counts, impactNodes } = target;
    if (!counts || !impactNodes) return;
    if (
      counts.violationRules !== target.violations.length ||
      counts.violationNodes !== nodeTotal(target.violations) ||
      counts.incompleteRules !== target.incomplete.length ||
      counts.incompleteNodes !== nodeTotal(target.incomplete)
    ) {
      issue('counts follow the kept rules');
    }
    for (const impact of AXE_IMPACTS) {
      const expected = nodeTotal(target.violations.filter((rule) => rule.impact === impact));
      if (impactNodes[impact] !== expected) issue(`${impact} nodes follow the violations`);
    }
  });

const locationSchema = z.strictObject({
  path: relativePathSchema,
  line: z.number().int().positive().nullable(),
});

/** axe 가 아닌 자동 검사. 결과는 runner report 의 case 에서만 온다. */
export const automatedCheckSchema = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/, 'check id'),
    label: safeText(200),
    kind: z.enum(CHECK_KINDS),
    status: z.enum(CHECK_STATUSES),
    threshold: z
      .strictObject({ ratio: z.number().positive(), basis: z.enum(CONTRAST_BASES) })
      .nullable(),
    cases: z
      .strictObject({ passed: countSchema, failed: countSchema, skipped: countSchema })
      .nullable(),
    evidence: z.array(locationSchema).max(10),
    reason: reasonSchema.nullable(),
  })
  .superRefine((check, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    const { threshold, cases } = check;
    if (threshold && threshold.basis !== 'project-visibility-guard') {
      if (threshold.ratio !== WCAG_BASIS_RATIO[threshold.basis]) {
        issue('a WCAG basis keeps its fixed ratio');
      }
    }
    switch (check.status) {
      case 'passed':
        if (!cases || cases.passed === 0 || cases.failed > 0) {
          issue('passed needs passing cases and no failures');
        }
        break;
      case 'failed':
        if (!cases || cases.failed === 0) issue('failed needs a failing case');
        break;
      case 'unknown':
        if (check.reason === null) issue('unknown says why');
        break;
      case 'not-run':
        if (check.reason === null || cases !== null) issue('not-run has a reason and no cases');
        break;
    }
  });

export const manualCheckSchema = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9-]{1,60}$/),
    label: safeText(200),
    area: z.enum(MANUAL_AREAS),
    status: z.enum(MANUAL_STATUSES),
    note: reasonSchema.nullable(),
    checkedAt: isoTimeSchema.nullable(),
    /** 브라우저·보조기술·OS. 관찰이 어디서 나왔는지다. */
    environment: safeText(200).nullable(),
  })
  .superRefine((check, ctx) => {
    const observed = check.status !== 'not-run';
    if (observed !== (check.checkedAt !== null) || observed !== (check.environment !== null)) {
      ctx.addIssue({
        code: 'custom',
        message: 'only an observation has a check time and an environment',
      });
    }
  });

export const accessibilitySummarySchema = z
  .strictObject({
    id: z.string().regex(/^a11y:[a-z0-9-]+$/),
    sourceScope: z.enum(ACCESSIBILITY_SOURCE_SCOPES),
    source: z.enum(ACCESSIBILITY_SOURCES),
    engine: z
      .strictObject({ name: z.literal('axe-core'), version: z.string().regex(/^\d+\.\d+\.\d+$/) })
      .nullable(),
    /** axe runOnly tag. */
    tags: z.array(tagSchema).max(20),
    /** 기본값과 다르게 켠 rule. */
    enabledRules: z.array(ruleIdSchema).max(20),
    /** 검사 범위에서 뺀 selector. */
    exclusions: z.array(safeText(200)).max(20),
    /** Storybook build index. */
    index: z
      .strictObject({
        path: relativePathSchema,
        storyCount: countSchema,
        testStoryCount: countSchema,
      })
      .nullable(),
    startedAt: isoTimeSchema.nullable(),
    finishedAt: isoTimeSchema.nullable(),
    outcome: z.enum(AUDIT_OUTCOMES),
    reason: reasonSchema.nullable(),
    targets: z.array(auditTargetSchema),
    checks: z.array(automatedCheckSchema),
    manual: z.array(manualCheckSchema),
    /** 이 출처가 볼 수 없는 것. */
    limitations: z.array(reasonSchema).max(20),
  })
  .superRefine((summary, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    const axe = (AXE_SCOPES as readonly string[]).includes(summary.sourceScope);
    if (axe && (summary.checks.length > 0 || summary.manual.length > 0)) {
      issue('an axe scope holds only targets');
    }
    if (!axe && summary.targets.length > 0) issue('only an axe scope holds targets');
    if (summary.sourceScope === 'manual' && summary.checks.length > 0) {
      issue('the manual scope holds only manual checks');
    }
    if (summary.sourceScope !== 'manual' && summary.manual.length > 0) {
      issue('only the manual scope holds manual checks');
    }
    if (summary.outcome !== 'completed' && summary.reason === null) {
      issue('an outcome other than completed says why');
    }
    for (const id of duplicateIds(summary.targets.map((target) => target.id))) {
      issue(`duplicate target ${id}`);
    }
    if (!axe) return;
    const statuses = summary.targets.map((target) => target.status);
    if (
      summary.outcome === 'completed' &&
      (!statuses.includes('scanned') ||
        statuses.some((status) => status === 'scan-failed' || status === 'not-run'))
    ) {
      issue('a completed audit scanned every target it did not skip');
    }
    if (statuses.includes('scanned') && summary.engine === null) {
      issue('scanned targets name the axe engine');
    }
  });

export type AxeImpact = (typeof AXE_IMPACTS)[number];
export type AxeRule = z.infer<typeof axeRuleSchema>;
export type AxeCounts = z.infer<typeof axeCountsSchema>;
export type ImpactNodes = z.infer<typeof impactNodesSchema>;
export type AuditTarget = z.infer<typeof auditTargetSchema>;
export type AutomatedCheck = z.infer<typeof automatedCheckSchema>;
export type ManualCheck = z.infer<typeof manualCheckSchema>;
export type AccessibilitySummary = z.infer<typeof accessibilitySummarySchema>;
