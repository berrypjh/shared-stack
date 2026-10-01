import { describe, expect, it } from 'vitest';

import { loadDataset } from '../dataset';

import { preflight } from './preflight';

describe('live preflight', () => {
  it('첫 메시지가 한도를 넘는 variant 는 빼고 토큰 수 · 한도 · 과제를 이유로 남긴다', async () => {
    const tasks = (await loadDataset('dev')).filter((task) => task.taskId === 'web-button-loading');
    const counted: string[] = [];
    const { runnable, skipped } = await preflight({
      variantIds: ['full-source', 'consumer-docs'],
      tasks,
      limit: 200_000,
      // 실제 API 대신 글자 수로 센다 — Full Source 만 한도를 넘는다.
      count: async (content) => {
        counted.push(content.slice(0, 10));
        return content.length > 400_000 ? 387_000 : 12_000;
      },
    });

    expect(counted).toHaveLength(2);
    expect(runnable).toEqual(['consumer-docs']);
    expect(skipped).toEqual([
      {
        variant: 'full-source',
        reason: '컨텍스트 한도 초과 — 첫 메시지 387,000 토큰 > 한도 200,000 (web-button-loading)',
      },
    ]);
  });
});
