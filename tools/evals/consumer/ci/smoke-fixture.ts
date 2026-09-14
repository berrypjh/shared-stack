import type { ExecutorOutcome } from '../runner/executor';
import type { ConsumerEvalTask } from '../runner/schema';

/**
 * PR smoke용 결정적 scripted agent.
 *
 * **모델 성능 측정이 아니다.** catalog → resolver → grader → verification → report 사슬이
 * 실제로 도는지 확인하려고 고정된 입력을 넣는 것이다. run의 executor 이름이
 * `smoke-scripted`라서 report에서 벤치마크와 혼동되지 않는다.
 */

export const SMOKE_TASK_IDS = [
  'web-button-loading',
  'web-button-polymorphic',
  // harness 자기 검증용 고정 fixture입니다 — `ci.test.ts`가 이 조합이 만드는 성공/실패
  // 비율(0.5)과 실패 종류를 검증합니다. 통과하는 task를 더하면 그 불변식이 희석됩니다.
  'negative-deep-source-import',
  'no-ui-date-format',
];

const base = (task: ConsumerEvalTask): ExecutorOutcome => ({
  selectedPlatform: task.expected.platform,
  selectedPackages: task.expected.packages,
  retrieved: task.expected.requiredEvidence,
  toolCalls: task.expected.allowedCapabilities
    .slice(0, 1)
    .map((capability) => ({ capability, target: null, duplicate: false })),
  changedFiles: [],
  inputTokens: 1000,
  outputTokens: null,
  retrievedTokens: null,
  retrievedFiles: null,
  retrievedChunks: null,
  latencyMs: null,
  claimedSuccess: true,
  verification: [],
  repairAttempts: 0,
  repairTokens: null,
  repairSucceeded: null,
  repeatedFailures: null,
});

const WORKING = `import '@berrypjh/react-ui/styles.css';
import { Button } from '@berrypjh/react-ui';

export const App = () => (
  <Button variant="contained" loading loadingPosition="start">
    확인
  </Button>
);
`;

const WORKING_TEST = `import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the button', () => {
    render(<App />);
    expect(screen.getByRole('button')).toBeDefined();
  });
});
`;

const NO_UI_SOURCE = `export const formatIsoDate = (value: Date): string => value.toISOString().slice(0, 10);
`;

const NO_UI_TEST = `import { describe, expect, it } from 'vitest';

import { formatIsoDate } from './format';

describe('formatIsoDate', () => {
  it('keeps only the date part', () => {
    expect(formatIsoDate(new Date('2026-01-02T03:04:05Z'))).toBe('2026-01-02');
  });
});
`;

const HALLUCINATED = `import { DataGrid } from '@berrypjh/react-ui';

export const App = () => <DataGrid />;
`;

const DEEP_IMPORT = `import { Button } from '@berrypjh/react-ui/src/components/button';

export const App = () => <Button />;
`;

/** taskId별 고정 결과. 각 시행이 서로 다른 실패 경로를 밟는다. */
export const smokeOutcome = (task: ConsumerEvalTask): ExecutorOutcome => {
  switch (task.taskId) {
    // 정상 경로 — 검증까지 통과해야 한다.
    case 'web-button-loading':
      return {
        ...base(task),
        changedFiles: [
          { path: 'src/App.tsx', content: WORKING },
          { path: 'src/App.test.tsx', content: WORKING_TEST },
        ],
      };
    // 없는 export를 쓰고 성공을 주장한다 — D4에서 typecheck가 잡아야 한다.
    case 'web-button-polymorphic':
      return { ...base(task), changedFiles: [{ path: 'src/App.tsx', content: HALLUCINATED }] };
    // public entry 대신 내부 경로를 쓴다 — public-import grader가 잡아야 한다.
    case 'negative-deep-source-import':
      return { ...base(task), changedFiles: [{ path: 'src/App.tsx', content: DEEP_IMPORT }] };
    // UI 라이브러리와 무관한 task — UI로 라우팅하면 안 된다.
    case 'no-ui-date-format':
      return {
        ...base(task),
        changedFiles: [
          { path: 'src/format.ts', content: NO_UI_SOURCE },
          { path: 'src/format.test.ts', content: NO_UI_TEST },
        ],
      };
    default:
      return base(task);
  }
};
