import type { PlatformClass } from '../../../consumer-retrieval/types';

/**
 * Routing confusion raw data.
 * `both`는 별도 표로 뺀다. resolver가 라우팅을 거부하면 `unreported`로 센다 —
 * 임의의 클래스로 밀어 넣지 않는다.
 */

export const PREDICTED_CLASSES = ['web', 'react-native', 'none', 'both', 'unreported'] as const;
export type PredictedClass = (typeof PREDICTED_CLASSES)[number];

const SINGLE_ROWS: PlatformClass[] = ['web', 'react-native', 'none'];

export type ConfusionPair = { expected: PlatformClass; predicted: PlatformClass | null };

export type ConfusionMatrix = {
  rows: Record<PlatformClass, Record<PredictedClass, number>>;
  total: number;
  correct: number;
  unreported: number;
  /** total이 0이면 null. */
  accuracy: number | null;
};

const emptyRow = (): Record<PredictedClass, number> =>
  Object.fromEntries(PREDICTED_CLASSES.map((c) => [c, 0])) as Record<PredictedClass, number>;

export const buildConfusion = (pairs: ConfusionPair[]): ConfusionMatrix => {
  const rows = {
    web: emptyRow(),
    'react-native': emptyRow(),
    both: emptyRow(),
    none: emptyRow(),
  } as Record<PlatformClass, Record<PredictedClass, number>>;

  let correct = 0;
  let unreported = 0;
  for (const { expected, predicted } of pairs) {
    const key: PredictedClass = predicted ?? 'unreported';
    rows[expected][key] += 1;
    if (predicted === expected) correct += 1;
    if (predicted === null) unreported += 1;
  }

  return {
    rows,
    total: pairs.length,
    correct,
    unreported,
    accuracy: pairs.length === 0 ? null : correct / pairs.length,
  };
};

const table = (matrix: ConfusionMatrix, expectedRows: PlatformClass[]): string =>
  [
    `| Expected \\ Predicted | ${PREDICTED_CLASSES.join(' | ')} |`,
    `| --- | ${PREDICTED_CLASSES.map(() => '---').join(' | ')} |`,
    ...expectedRows.map(
      (row) => `| ${row} | ${PREDICTED_CLASSES.map((c) => matrix.rows[row][c]).join(' | ')} |`,
    ),
  ].join('\n');

export const renderConfusion = (matrix: ConfusionMatrix): string =>
  [
    '### Routing confusion (web / react-native / none)',
    '',
    table(matrix, SINGLE_ROWS),
    '',
    '### Cross-platform rows',
    '',
    table(matrix, ['both']),
    '',
    `- total: ${matrix.total}`,
    `- correct: ${matrix.correct}`,
    `- declined (unreported): ${matrix.unreported}`,
    `- accuracy: ${matrix.accuracy === null ? 'N/A' : `${(matrix.accuracy * 100).toFixed(1)}%`}`,
  ].join('\n');
