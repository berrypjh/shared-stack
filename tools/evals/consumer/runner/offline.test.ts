import { describe, expect, it } from 'vitest';

import { buildConfusion, PREDICTED_CLASSES } from '../reporters/confusion';
import { measureVariantContext } from '../variants/context';
import { VARIANTS } from '../variants/index';

import { loadDataset } from './dataset';
import type { FixtureContext } from './fixture-context';
import { decideRouting, measureContexts, resolveRouting } from './offline';
import { consumerEvalTaskSchema, type Platform } from './schema';

const PACKAGES: Record<Platform, string[]> = {
  web: ['@berrypjh/react-ui'],
  'react-native': ['@berrypjh/react-native-ui'],
  both: ['@berrypjh/react-ui', '@berrypjh/react-native-ui'],
  none: [],
};

const task = (taskId: string, platform: Platform, prompt: string, fixture: string) =>
  consumerEvalTaskSchema.parse({
    taskId,
    category: 'routing',
    prompt,
    fixture,
    expected: { platform, packages: PACKAGES[platform] },
    verification: [{ kind: 'public-import', required: true }],
  });

const context = (fixture: string, dependencies: Record<string, string>): FixtureContext => ({
  fixture,
  dependencies,
  projectFiles: ['src/App.tsx'],
});

/**
 * `--routing-only` 의 판정을 데이터로 돌려주는 함수. 콘솔 출력과 JSON writer 가 같은 판정을 쓴다.
 */
describe('decideRouting', () => {
  const tasks = [
    task('web-plain', 'web', 'Button 을 추가해 주세요', 'web-app'),
    task('both-explicit', 'both', '양쪽 화면에 Button 을 추가해 주세요', 'both-app'),
    task('web-on-native-project', 'web', '웹 화면에 Button 을 추가해 주세요', 'rn-app'),
    task('no-ui', 'none', '날짜 포맷 함수를 만들어 주세요', 'plain'),
  ];
  const contexts = {
    'web-app': context('web-app', { '@berrypjh/react-ui': '1.0.0' }),
    'both-app': context('both-app', {
      '@berrypjh/react-ui': '1.0.0',
      '@berrypjh/react-native-ui': '1.0.0',
    }),
    'rn-app': context('rn-app', { '@berrypjh/react-native-ui': '1.0.0' }),
    plain: context('plain', {}),
  };
  const decisions = decideRouting(tasks, contexts);

  it('resolver 의 canonical 결과를 그대로 쓴다 — ambiguous 는 null 이다', () => {
    expect(decisions.map((d) => [d.taskId, d.expected, d.predicted, d.diagnosis])).toEqual([
      ['web-plain', 'web', 'web', 'web'],
      ['both-explicit', 'both', 'both', 'both'],
      ['web-on-native-project', 'web', null, 'ambiguous'],
      ['no-ui', 'none', 'none', 'none'],
    ]);
  });

  it('confusion 은 buildConfusion 이 만든다 — null 은 none 이 아니라 unreported 칸이다', () => {
    const matrix = buildConfusion(
      decisions.map((d) => ({ expected: d.expected, predicted: d.predicted })),
    );
    expect(matrix.rows.web.unreported).toBe(1);
    expect(matrix.rows.web.none).toBe(0);
    expect(matrix.rows.both.both).toBe(1);
    expect(matrix).toMatchObject({ total: 4, correct: 3, unreported: 1, accuracy: 0.75 });
  });

  it('fixture context 가 없는 task 는 추측하지 않고 실패한다', () => {
    expect(() => decideRouting([task('orphan', 'web', 'Button', 'missing')], contexts)).toThrow(
      'missing',
    );
  });
});

describe('resolveRouting', () => {
  it('dataset 전체의 판정과 그 confusion 을 함께 돌려준다 (expected 4행 × predicted 5열)', async () => {
    const report = await resolveRouting('dev');
    const tasks = await loadDataset('dev');
    expect(report).toMatchObject({ split: 'dev', resolver: 'deterministic' });
    expect(report.decisions).toHaveLength(tasks.length);
    expect(report.matrix).toEqual(
      buildConfusion(
        report.decisions.map((d) => ({ expected: d.expected, predicted: d.predicted })),
      ),
    );
    expect(Object.keys(report.matrix.rows).sort()).toEqual(['both', 'none', 'react-native', 'web']);
    for (const row of Object.values(report.matrix.rows)) {
      expect(Object.keys(row)).toEqual([...PREDICTED_CLASSES]);
    }
  });
});

describe('measureContexts', () => {
  it('variant 마다 measureVariantContext 결과를 그대로 돌려준다', async () => {
    const [measured] = await measureContexts(['consumer-docs']);
    expect(measured).toEqual(await measureVariantContext(VARIANTS['consumer-docs']));
  });
});
