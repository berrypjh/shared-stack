import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { accessibilitySummarySchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import {
  parseStoryIndex,
  STORYBOOK_A11Y,
  StorybookA11yImportError,
  storybookSummary,
} from './storybook-a11y';

const story = (id: string, tags: string[]) => ({
  type: 'story',
  subtype: 'story',
  id,
  title: 'Buttons/Button',
  name: id.split('--')[1],
  importPath: './src/components/button/Button.stories.tsx',
  tags,
});

const INDEX = JSON.stringify({
  v: 5,
  entries: {
    one: story('buttons-button--one', ['dev', 'test']),
    two: story('buttons-button--two', ['dev', 'test']),
    three: story('buttons-button--three', ['dev', 'test']),
    four: story('buttons-button--four', ['dev', 'test']),
    hidden: story('buttons-button--hidden', ['dev']),
    docs: {
      type: 'docs',
      id: 'buttons-button--docs',
      title: 'Buttons/Button',
      name: 'Docs',
      tags: ['dev'],
    },
  },
});

const axe = {
  testEngine: { name: 'axe-core', version: '4.11.1' },
  violations: [],
  incomplete: [],
  inapplicable: [],
  passes: [],
};

const line = (value: Record<string, unknown>) => JSON.stringify(value);

const RECORDS = [
  line({
    storyId: 'buttons-button--one',
    status: 'scanned',
    reason: null,
    scannedAt: '2026-09-13T12:00:00.000Z',
    results: axe,
  }),
  line({
    storyId: 'buttons-button--two',
    status: 'skipped',
    reason: 'parameters.a11y.disable',
    scannedAt: '2026-09-13T12:00:01.000Z',
  }),
  line({
    storyId: 'buttons-button--three',
    status: 'scanned',
    reason: null,
    scannedAt: '2026-09-13T12:00:02.000Z',
  }),
].join('\n');

const INDEX_PATH = 'libs/react-ui/storybook-static/index.json';

describe('parseStoryIndex', () => {
  it('story 와 test-runner 가 도는 test tag story 를 따로 센다', () => {
    const index = parseStoryIndex(INDEX);
    expect(index.storyCount).toBe(5);
    expect(index.testStories.map((item) => item.id)).toEqual([
      'buttons-button--one',
      'buttons-button--two',
      'buttons-button--three',
      'buttons-button--four',
    ]);
  });
});

describe('storybookSummary', () => {
  it('skip 은 runtime 의 inherited story context 기록에서만 오고, 결과 없는 scan·기록 없는 story 는 통과가 아니다', () => {
    const summary = storybookSummary({
      resultsText: RECORDS,
      index: parseStoryIndex(INDEX),
      indexPath: INDEX_PATH,
    });
    accessibilitySummarySchema.parse(summary);
    expect(summary).toMatchObject({
      sourceScope: 'storybook',
      source: 'storybook-test-runner',
      engine: { name: 'axe-core', version: '4.11.1' },
      tags: STORYBOOK_A11Y.tags,
      enabledRules: ['color-contrast'],
      index: { path: INDEX_PATH, storyCount: 5, testStoryCount: 4 },
      outcome: 'partial',
    });
    expect(summary.targets.map((item) => [item.storyId, item.status, item.scope])).toEqual([
      ['buttons-button--one', 'scanned', '#storybook-root'],
      ['buttons-button--two', 'skipped', '#storybook-root'],
      ['buttons-button--three', 'scan-failed', '#storybook-root'],
      ['buttons-button--four', 'not-run', '#storybook-root'],
    ]);
    expect(summary.targets[1].reason).toContain('parameters.a11y.disable');
    expect(summary.targets[2].reason).toContain('axe 결과가 없습니다');
  });

  it('결과 파일이 없으면 저장 명령과 함께 not-run 이다', () => {
    const summary = storybookSummary({
      resultsText: null,
      index: parseStoryIndex(INDEX),
      indexPath: INDEX_PATH,
    });
    accessibilitySummarySchema.parse(summary);
    expect(summary.outcome).toBe('not-run');
    expect(summary.targets).toEqual([]);
    expect(summary.reason).toContain(
      'QUALITY_A11Y_RESULTS=tmp/quality-lab/imports/a11y/storybook.jsonl',
    );
  });

  it('깨진 줄·중복 story 는 줄 번호와 함께 오류다', () => {
    expect(() =>
      storybookSummary({ resultsText: `${RECORDS}\n{oops`, index: null, indexPath: INDEX_PATH }),
    ).toThrow(StorybookA11yImportError);
    expect(() =>
      storybookSummary({ resultsText: `${RECORDS}\n{oops`, index: null, indexPath: INDEX_PATH }),
    ).toThrow(/line 4/);
    const duplicate = `${RECORDS}\n${RECORDS.split('\n')[0]}`;
    expect(() =>
      storybookSummary({ resultsText: duplicate, index: null, indexPath: INDEX_PATH }),
    ).toThrow(/duplicate story buttons-button--one/);
  });

  it('runner 의 WCAG tag·scope·enabled rule 을 그대로 쓴다', () => {
    const runner = readFileSync(
      fileURLToPath(
        new URL('../../../../libs/react-ui/.storybook/test-runner.ts', import.meta.url),
      ),
      'utf8',
    );
    for (const tag of STORYBOOK_A11Y.tags) expect(runner).toContain(`'${tag}'`);
    expect(runner).toContain(`'${STORYBOOK_A11Y.scope}'`);
    expect(runner).toContain("id: 'color-contrast', enabled: true");
    expect(runner).toContain('parameters?.a11y?.disable');
  });
});
