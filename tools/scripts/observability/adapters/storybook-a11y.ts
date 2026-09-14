import {
  type AccessibilitySummary,
  type AuditTarget,
  isoTimeSchema,
} from '@berrypjh/observability-contracts';

import { z } from 'zod';

import { AxeResultError, normalizeAxeResults, WCAG_TAGS } from './axe';

/**
 * Storybook test-runner 가 opt-in 으로 남긴 story 별 기록을 읽는다. 검사 기준(tag·scope·rule)은
 * `libs/react-ui/.storybook/test-runner.ts` 와 같고, skip 은 runtime 의 inherited story context
 * 기록에서만 센다 — story 소스의 parameters 만으로 추정하지 않는다.
 */

export const STORYBOOK_A11Y = {
  scope: '#storybook-root',
  tags: [...WCAG_TAGS],
  enabledRules: ['color-contrast'],
} as const;

export const STORYBOOK_RESULTS_PATH = 'tmp/quality-lab/imports/a11y/storybook.jsonl';
export const STORYBOOK_INDEX_PATH = 'libs/react-ui/storybook-static/index.json';

export class StorybookA11yImportError extends Error {}

const indexSchema = z.looseObject({
  v: z.number(),
  entries: z.record(
    z.string(),
    z.looseObject({
      type: z.string(),
      id: z.string(),
      title: z.string(),
      name: z.string(),
      tags: z.array(z.string()).optional(),
    }),
  ),
});

export type StoryIndex = {
  storyCount: number;
  /** test-runner 가 방문하는 `test` tag story. */
  testStories: { id: string; title: string; name: string }[];
};

export const parseStoryIndex = (text: string): StoryIndex => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new StorybookA11yImportError('storybook index.json 이 JSON 이 아닙니다');
  }
  const parsed = indexSchema.safeParse(value);
  if (!parsed.success) throw new StorybookA11yImportError('storybook index.json 모양이 다릅니다');
  const stories = Object.values(parsed.data.entries).filter((entry) => entry.type === 'story');
  return {
    storyCount: stories.length,
    testStories: stories
      .filter((entry) => entry.tags?.includes('test'))
      .map(({ id, title, name }) => ({ id, title, name })),
  };
};

const recordSchema = z.looseObject({
  storyId: z.string().regex(/^[a-z0-9-]+--[a-z0-9-]+$/),
  title: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(['scanned', 'skipped']),
  reason: z.string().nullable(),
  scannedAt: isoTimeSchema,
  results: z.unknown().optional(),
});

type StoryRecord = z.infer<typeof recordSchema>;

const readRecords = (text: string): StoryRecord[] => {
  const records: StoryRecord[] = [];
  const seen = new Set<string>();
  text.split('\n').forEach((line, index) => {
    if (line.trim() === '') return;
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      throw new StorybookA11yImportError(`line ${index + 1}: JSON 이 아닙니다`);
    }
    const parsed = recordSchema.safeParse(value);
    if (!parsed.success) {
      throw new StorybookA11yImportError(`line ${index + 1}: story 기록 모양이 다릅니다`);
    }
    if (seen.has(parsed.data.storyId)) {
      throw new StorybookA11yImportError(
        `line ${index + 1}: duplicate story ${parsed.data.storyId}`,
      );
    }
    seen.add(parsed.data.storyId);
    records.push(parsed.data);
  });
  return records;
};

const LIMITATIONS = [
  'skip 수는 test-runner 가 runtime 에 읽은 inherited story context 기록입니다 — story 소스만으로 세지 않습니다',
  'story 하나의 #storybook-root 만 검사합니다 — docs 페이지나 앱 화면 전체가 아닙니다',
  'incomplete 는 사람이 확인해야 하는 결과이고 통과가 아닙니다',
];

const unscanned = {
  scannedAt: null,
  counts: null,
  impactNodes: null,
  violations: [],
  incomplete: [],
};

type StoryLabel = { title?: string; name?: string };

const targetBase = (storyId: string, story: StoryLabel | undefined) => ({
  id: `storybook:${storyId}`,
  label: story?.title && story.name ? `${story.title} · ${story.name}` : storyId,
  route: null,
  storyId,
  theme: null,
  viewport: null,
  scope: STORYBOOK_A11Y.scope,
});

export const storybookSummary = ({
  resultsText,
  index,
  indexPath,
}: {
  resultsText: string | null;
  index: StoryIndex | null;
  indexPath: string;
}): AccessibilitySummary => {
  const base = {
    id: 'a11y:storybook',
    sourceScope: 'storybook' as const,
    source: 'storybook-test-runner' as const,
    tags: [...STORYBOOK_A11Y.tags],
    enabledRules: [...STORYBOOK_A11Y.enabledRules],
    exclusions: [],
    index: index
      ? { path: indexPath, storyCount: index.storyCount, testStoryCount: index.testStories.length }
      : null,
    checks: [],
    manual: [],
    limitations: LIMITATIONS,
  };

  if (resultsText === null) {
    return {
      ...base,
      engine: null,
      startedAt: null,
      finishedAt: null,
      outcome: 'not-run',
      reason: `Storybook a11y 결과를 저장하지 않았습니다 — pnpm build-storybook 뒤 QUALITY_A11Y_RESULTS=${STORYBOOK_RESULTS_PATH} pnpm storybook:a11y`,
      targets: [],
    };
  }

  const records = readRecords(resultsText);
  const byStory = new Map(records.map((record) => [record.storyId, record]));
  const stories = new Map((index?.testStories ?? []).map((story) => [story.id, story]));
  let engine: AccessibilitySummary['engine'] = null;

  const fromRecord = (record: StoryRecord): AuditTarget => {
    const head = targetBase(record.storyId, stories.get(record.storyId) ?? record);
    if (record.status === 'skipped') {
      return {
        ...head,
        ...unscanned,
        status: 'skipped',
        reason: `story context 가 검사를 껐습니다 — ${record.reason ?? 'parameters.a11y.disable'}`,
      };
    }
    try {
      const normalized = normalizeAxeResults(record.results);
      if (engine && engine.version !== normalized.engine.version) {
        throw new StorybookA11yImportError(
          `axe-core 버전이 섞였습니다 (${engine.version}, ${normalized.engine.version})`,
        );
      }
      engine = normalized.engine;
      return {
        ...head,
        status: 'scanned',
        reason: null,
        scannedAt: record.scannedAt,
        counts: normalized.counts,
        impactNodes: normalized.impactNodes,
        violations: normalized.violations,
        incomplete: normalized.incomplete,
      };
    } catch (error) {
      if (!(error instanceof AxeResultError)) throw error;
      return { ...head, ...unscanned, status: 'scan-failed', reason: error.message };
    }
  };

  const targets: AuditTarget[] = [
    ...(index?.testStories ?? []).map((story) => {
      const record = byStory.get(story.id);
      return record
        ? fromRecord(record)
        : {
            ...targetBase(story.id, story),
            ...unscanned,
            status: 'not-run' as const,
            reason: 'test-runner 기록에 이 story 가 없습니다 (test tag story 인데 방문 기록 없음)',
          };
    }),
    ...records.filter((record) => !stories.has(record.storyId)).map(fromRecord),
  ];

  const count = (status: AuditTarget['status']) =>
    targets.filter((target) => target.status === status).length;
  const failed = count('scan-failed');
  const notRun = count('not-run');
  const scanned = count('scanned');
  const times = records.map((record) => record.scannedAt).sort();
  const outcome =
    scanned === 0
      ? failed > 0
        ? 'scan-failed'
        : 'not-run'
      : failed + notRun > 0
        ? 'partial'
        : 'completed';

  return {
    ...base,
    engine,
    startedAt: times[0] ?? null,
    finishedAt: times[times.length - 1] ?? null,
    outcome,
    reason:
      outcome === 'completed'
        ? null
        : `scan 실패 ${failed}개 · 기록 없음 ${notRun}개 · 검사 ${scanned}개`,
    targets,
  };
};
