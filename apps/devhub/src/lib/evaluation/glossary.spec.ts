// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { EVAL_METRICS } from '@berrypjh/observability-contracts';

import { FAILURE_TERMS, METRIC_TERMS } from './glossary';

const GRADER = join(
  import.meta.dirname,
  '../../../../../tools/evals/consumer/graders/task-success.ts',
);

describe('소비자 평가 용어표', () => {
  it('채점기의 실패 분류를 빠짐없이 설명한다 (순서는 판정 순서라 다를 수 있다)', () => {
    const block = /FAILURE_CATEGORIES = \[([^\]]+)\]/.exec(readFileSync(GRADER, 'utf8'))?.[1] ?? '';
    const categories = [...block.matchAll(/'([a-z-]+)'/g)].map((match) => match[1]);
    expect(categories.length).toBeGreaterThan(0);
    expect(Object.keys(FAILURE_TERMS).sort()).toEqual([...categories].sort());
  });

  it('계약의 모든 지표에 한국어 이름과 뜻이 있다', () => {
    const keys = Object.values(EVAL_METRICS).flatMap((group) => Object.keys(group));
    for (const key of keys) {
      const term = METRIC_TERMS[key as keyof typeof METRIC_TERMS];
      expect({ key, label: Boolean(term?.label), meaning: Boolean(term?.meaning) }).toEqual({
        key,
        label: true,
        meaning: true,
      });
    }
  });
});
