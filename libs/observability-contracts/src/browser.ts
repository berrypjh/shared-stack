import { z } from 'zod';

import { countSchema, isoTimeSchema, nonNegativeSchema, reasonSchema } from './primitives.js';

/**
 * 브라우저 한 탭에서 지금 새로 읽은 환경·capability·performance entry.
 * 저장소 run artifact 가 아니고 저장·전송하지 않는다. Core Web Vitals 도 아니다.
 */

/** API 를 이 브라우저·문맥에서 쓸 수 있는가. 값을 읽었는가와 다른 축이다. */
export const BROWSER_SUPPORT = [
  'supported',
  'unsupported',
  'unavailable',
  'permission-required',
  'not-measured',
] as const;

/** 값을 읽었는가. `sampled` 의 false·0 은 실제 값이다. */
export const BROWSER_VALUE_STATES = ['sampled', 'awaiting-sample', 'error', 'not-sampled'] as const;

export const CAPABILITY_GROUPS = [
  'viewport',
  'locale',
  'preference',
  'input',
  'connectivity',
  'device',
  'storage',
  'isolation',
  'api',
] as const;

export const BROWSER_UNITS = ['css-px', 'ratio', 'count', 'bytes', 'GiB', 'ms', 'Mbps'] as const;

/** epoch ms (`Date.now`, `performance.timeOrigin`). */
const epochMsSchema = nonNegativeSchema;
const textValueSchema = z.string().max(300);

type States = { support: string; state: string; reason: string | null };

/** 두 축의 조합 규칙. 지원되지 않거나 읽지 않은 값은 false·0 으로 채우지 않는다. */
const stateIssues = (item: States, hasValue: boolean, sampleTime: number | null): string[] => {
  const issues: string[] = [];
  const supported = item.support === 'supported';
  if (item.state === 'sampled') {
    if (!supported) issues.push('only a supported source is sampled');
    if (!hasValue) issues.push('a sampled item has a value');
    if (sampleTime === null) issues.push('a sampled item has a sample time');
  } else if (hasValue) {
    issues.push('only a sampled item has a value');
  }
  if (item.state === 'awaiting-sample' && !supported) {
    issues.push('only a supported source awaits a sample');
  }
  if (item.state === 'error' && item.reason === null) issues.push('an error says why');
  if (!supported && item.reason === null) issues.push('a non-supported item says why');
  return issues;
};

export const browserCapabilitySchema = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, 'capability id'),
    group: z.enum(CAPABILITY_GROUPS),
    label: z.string().min(1).max(120),
    support: z.enum(BROWSER_SUPPORT),
    state: z.enum(BROWSER_VALUE_STATES),
    value: z
      .union([textValueSchema, z.number(), z.boolean(), z.array(z.string().max(100)).max(20)])
      .nullable(),
    unit: z.enum(BROWSER_UNITS).nullable(),
    /** 브라우저가 반올림·양자화·추정한 값이면 true. */
    approximate: z.boolean(),
    /** 값의 뜻을 좁히는 설명 (hint·origin 추정·legacy 등). */
    limitation: reasonSchema.nullable(),
    /** 지원되지 않거나 읽지 못한 이유. */
    reason: reasonSchema.nullable(),
    /** 값을 해석하는 보조 결과 (media query 별 matches 등). */
    detail: z
      .array(
        z.strictObject({
          name: z.string().min(1).max(100),
          value: z.union([textValueSchema, z.number(), z.boolean(), z.null()]),
        }),
      )
      .max(20)
      .nullable(),
    sampleTime: epochMsSchema.nullable(),
  })
  .superRefine((item, ctx) => {
    for (const message of stateIssues(item, item.value !== null, item.sampleTime)) {
      ctx.addIssue({ code: 'custom', message });
    }
  });

export const PERFORMANCE_ENTRY_TYPES = [
  'navigation',
  'resource',
  'paint',
  'largest-contentful-paint',
  'layout-shift',
  'longtask',
  'event',
  'first-input',
] as const;

/**
 * entry 가 말하는 범위. navigation 은 hard navigation 한 번이고 SPA route 이동이 아니다.
 * 나머지 문서 entry 는 timeOrigin 부터의 문서 전체, event 는 개별 입력 이벤트다.
 */
export const PERFORMANCE_SCOPES = ['hard-navigation', 'document-lifetime', 'interaction'] as const;

export const PERFORMANCE_SCOPE_OF = {
  navigation: 'hard-navigation',
  resource: 'document-lifetime',
  paint: 'document-lifetime',
  'largest-contentful-paint': 'document-lifetime',
  'layout-shift': 'document-lifetime',
  longtask: 'document-lifetime',
  event: 'interaction',
  'first-input': 'interaction',
} as const satisfies Record<
  (typeof PERFORMANCE_ENTRY_TYPES)[number],
  (typeof PERFORMANCE_SCOPES)[number]
>;

/** cross-origin resource 는 Timing-Allow-Origin 이 없으면 세부 시간·크기가 0 으로 가려진다. */
export const TIMING_ALLOW = [
  'same-origin',
  'cross-origin-exposed',
  'cross-origin-restricted',
] as const;

/** transferSize 의 뜻. 0 은 캐시·로컬 응답일 수도, TAO 로 가려진 값일 수도 있다. */
export const TRANSFER_MEANINGS = [
  'measured',
  'zero-cache-or-local',
  'zero-timing-restricted',
  'absent',
] as const;

export const MAX_KEPT_ENTRIES = 200;

const timeFields = { startTime: nonNegativeSchema, duration: nonNegativeSchema };
const entryNameSchema = z.string().min(1).max(300);
const bytesSchema = nonNegativeSchema.nullable();

export const performanceEntrySampleSchema = z.discriminatedUnion('entryType', [
  z.strictObject({
    entryType: z.literal('navigation'),
    /** 문서 경로. origin·query·hash 는 담지 않는다. */
    name: entryNameSchema,
    ...timeFields,
    navigationType: z.string().min(1).max(40),
    responseStart: nonNegativeSchema,
    domContentLoadedEventEnd: nonNegativeSchema,
    loadEventEnd: nonNegativeSchema,
    transferSize: bytesSchema,
  }),
  z.strictObject({
    entryType: z.literal('resource'),
    /** origin + 경로. query·hash 는 담지 않는다. */
    name: entryNameSchema,
    initiatorType: z.string().min(1).max(40),
    ...timeFields,
    timingAllow: z.enum(TIMING_ALLOW),
    transferSize: bytesSchema,
    transferMeaning: z.enum(TRANSFER_MEANINGS),
    encodedBodySize: bytesSchema,
    decodedBodySize: bytesSchema,
  }),
  z.strictObject({
    entryType: z.literal('paint'),
    name: z.enum(['first-paint', 'first-contentful-paint']),
    ...timeFields,
  }),
  z.strictObject({
    entryType: z.literal('largest-contentful-paint'),
    ...timeFields,
    size: nonNegativeSchema,
    renderTime: nonNegativeSchema,
    loadTime: nonNegativeSchema,
  }),
  z.strictObject({
    entryType: z.literal('layout-shift'),
    ...timeFields,
    value: nonNegativeSchema,
    hadRecentInput: z.boolean(),
  }),
  z.strictObject({ entryType: z.literal('longtask'), ...timeFields }),
  z.strictObject({
    entryType: z.literal('event'),
    name: z.string().min(1).max(40),
    ...timeFields,
    interactionId: countSchema,
  }),
  z.strictObject({
    entryType: z.literal('first-input'),
    name: z.string().min(1).max(40),
    ...timeFields,
    interactionId: countSchema,
  }),
]);

type ResourceSample = Extract<
  z.infer<typeof performanceEntrySampleSchema>,
  { entryType: 'resource' }
>;

const transferIssue = ({ transferSize, transferMeaning, timingAllow }: ResourceSample) => {
  if (transferMeaning === 'absent') {
    return transferSize === null ? null : 'an absent transfer size is null';
  }
  if (transferSize === null) return 'a transfer meaning needs a size';
  if (transferMeaning === 'measured') {
    return transferSize > 0 ? null : 'measured transfer bytes are positive';
  }
  if (transferSize !== 0) return 'a zero meaning needs a zero size';
  const restricted = timingAllow === 'cross-origin-restricted';
  if (transferMeaning === 'zero-timing-restricted') {
    return restricted ? null : 'only a timing-restricted entry hides its size';
  }
  return restricted ? 'a timing-restricted zero is not a cache hit' : null;
};

export const runtimePerformanceSchema = z
  .strictObject({
    entryType: z.enum(PERFORMANCE_ENTRY_TYPES),
    scope: z.enum(PERFORMANCE_SCOPES),
    support: z.enum(BROWSER_SUPPORT),
    state: z.enum(BROWSER_VALUE_STATES),
    timeOrigin: epochMsSchema.nullable(),
    /** 마지막 entry 를 받은 시각 (epoch ms). */
    sampleTime: epochMsSchema.nullable(),
    /** 뒤에 오는 entry 로 바뀔 수 있는 관측이면 true. */
    provisional: z.boolean(),
    /** 최근 entry. 전체 수는 `totalEntries` 다. */
    entries: z.array(performanceEntrySampleSchema).max(MAX_KEPT_ENTRIES),
    totalEntries: countSchema,
    reason: reasonSchema.nullable(),
  })
  .superRefine((item, ctx) => {
    const issues = stateIssues(item, item.totalEntries > 0, item.sampleTime);
    if (item.state === 'sampled' && item.timeOrigin === null) {
      issues.push('a sampled entry type has a time origin');
    }
    if (item.scope !== PERFORMANCE_SCOPE_OF[item.entryType]) {
      issues.push('scope follows the entry type');
    }
    if (item.totalEntries < item.entries.length) issues.push('total counts every kept entry');
    for (const entry of item.entries) {
      if (entry.entryType !== item.entryType) issues.push('entries share the entry type');
      if (entry.entryType === 'resource') {
        const issue = transferIssue(entry);
        if (issue) issues.push(issue);
      }
    }
    for (const message of issues) ctx.addIssue({ code: 'custom', message });
  });

/** artifact run 과 다른 출처. 이 탭의 메모리에만 있고 저장·전송하지 않는다. */
export const browserSessionSchema = z.strictObject({
  kind: z.literal('browser-session'),
  startedAt: isoTimeSchema,
  timeOrigin: epochMsSchema.nullable(),
  persisted: z.literal(false),
  transmitted: z.literal(false),
});

export type BrowserSupport = (typeof BROWSER_SUPPORT)[number];
export type BrowserValueState = (typeof BROWSER_VALUE_STATES)[number];
export type BrowserCapability = z.infer<typeof browserCapabilitySchema>;
export type PerformanceEntryType = (typeof PERFORMANCE_ENTRY_TYPES)[number];
export type PerformanceEntrySample = z.infer<typeof performanceEntrySampleSchema>;
export type RuntimePerformance = z.infer<typeof runtimePerformanceSchema>;
export type BrowserSession = z.infer<typeof browserSessionSchema>;
