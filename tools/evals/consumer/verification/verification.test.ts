import fs from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadDataset } from '../runner/dataset';
import { fromRepoRoot } from '../runner/paths';
import type { ChangedFile, ConsumerEvalTask, VerificationRun } from '../runner/schema';
import { requireTask } from '../tests/helpers';

import { executePlan } from './execute';
import { failureFingerprint, normalizeCommand } from './fingerprint';
import {
  defaultVerificationsFor,
  KIND_ORDER,
  planVerifications,
  type VerificationPlan,
} from './policy';
import { DEFAULT_REPAIR_LIMIT, runVerificationLoop } from './repair';
import { materializeWorkspace } from './workspace';

const dev = await loadDataset('dev');
const held = await loadDataset('test');
const WORK = fromRepoRoot('tmp/llm-evals/verification-test');

const plansFor = (task: ConsumerEvalTask) =>
  planVerifications(task, { workspaceDir: path.join(WORK, task.taskId) });

/** 계획에 없는 kind를 조용히 건너뛰지 않고 실패시킨다. */
const requirePlan = (plans: VerificationPlan[], kind: string): VerificationPlan => {
  const plan = plans.find((p) => p.kind === kind);
  if (!plan) throw new Error(`no ${kind} plan was produced`);
  return plan;
};

const GOOD_APP: ChangedFile = {
  path: 'src/App.tsx',
  content: `import '@berrypjh/react-ui/styles.css';
import { Button } from '@berrypjh/react-ui';

export const App = () => (
  <Button variant="contained" loading loadingPosition="start">
    확인
  </Button>
);
`,
};

const BAD_APP: ChangedFile = {
  path: 'src/App.tsx',
  content: `import { DataGrid } from '@berrypjh/react-ui';

export const App = () => <DataGrid />;
`,
};

const PASSING_TEST: ChangedFile = {
  path: 'src/App.test.tsx',
  content: `import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders a button', () => {
    render(<App />);
    expect(screen.getByRole('button')).toBeDefined();
  });
});
`,
};

describe('verification policy', () => {
  it('honours the dataset gold over the default matrix', () => {
    const task = requireTask(dev, 'web-button-polymorphic');
    expect(plansFor(task).map((p) => p.kind)).toEqual(task.verification.map((v) => v.kind));
  });

  it('selects the smallest relevant check for a simple API use', () => {
    expect(defaultVerificationsFor('web-component').map((v) => v.kind)).toEqual([
      'public-import',
      'typecheck',
    ]);
  });

  it('adds a targeted test for behaviour and a build for integration', () => {
    expect(defaultVerificationsFor('web-form').map((v) => v.kind)).toContain('test');
    expect(defaultVerificationsFor('web-integration').map((v) => v.kind)).toContain('build');
  });

  it('never asks a no-library task for UI verification', () => {
    const task = requireTask(dev, 'no-ui-date-format');
    const plans = plansFor(task);
    expect(plans.some((p) => p.kind === 'build' && p.supported)).toBe(false);
    expect(plans.every((p) => p.kind !== 'lint')).toBe(true);
  });

  it('never plans the full suite for any dataset task', () => {
    for (const task of [...dev, ...held]) {
      const kinds = plansFor(task).map((p) => p.kind);
      expect(kinds.length, task.taskId).toBeLessThan(KIND_ORDER.length);
      expect(new Set(kinds).size).toBe(kinds.length);
    }
  });

  it('orders checks smallest first', () => {
    for (const task of [...dev, ...held]) {
      const indexes = plansFor(task).map((p) => KIND_ORDER.indexOf(p.kind));
      expect(
        [...indexes].sort((a, b) => a - b),
        task.taskId,
      ).toEqual(indexes);
    }
  });

  it('marks react-native fixture tests unsupported with a reason instead of passing them', () => {
    const task = requireTask(dev, 'rn-use-theme-getcolor');
    const test = plansFor(task).find((p) => p.kind === 'test');
    expect(test?.supported).toBe(false);
    expect(test?.unsupportedReason).toContain('react-native');
  });

  it('uses the existing Nx build target rather than a new global one', () => {
    const task = requireTask(dev, 'web-styles-css-import');
    const build = plansFor(task).find((p) => p.kind === 'build');
    expect(build?.targetSource).toBe('nx-target');
    expect(build?.args.join(' ')).toContain('@berrypjh/react-ui');
  });
});

describe('failure fingerprint', () => {
  const output = (dir: string) =>
    `${dir}/src/App.tsx(1,10): error TS2305: Module '"@berrypjh/react-ui"' has no exported member 'DataGrid'.`;

  it('is stable across different temp directories and command paths', () => {
    // 같은 검사가 서로 다른 임시 디렉터리에서 돌아도 지문은 같아야 한다.
    const a = failureFingerprint(
      'typecheck',
      '/tmp/run-a1b2c3d4/bin/tsc -p /tmp/run-a1b2c3d4/tsconfig.json',
      output('/tmp/run-a1b2c3d4'),
      2,
    );
    const b = failureFingerprint(
      'typecheck',
      '/var/run-99887766/bin/tsc -p /var/run-99887766/tsconfig.json',
      output('/var/run-99887766'),
      2,
    );
    expect(a).toBe(b);
    expect(a).toContain('TS2305');
    expect(a).toContain('App.tsx:1');
  });

  it('separates different diagnostics', () => {
    const other = 'src/App.tsx(3,5): error TS2322: Type mismatch.';
    expect(failureFingerprint('typecheck', 'tsc', other, 2)).not.toBe(
      failureFingerprint('typecheck', 'tsc', output('/tmp/x'), 2),
    );
  });

  it('falls back to the exit code when no diagnostic code is present', () => {
    expect(failureFingerprint('build', 'nx run x', 'something broke', 7)).toContain('exit:7');
  });

  it('normalises command identity rather than hashing raw stderr', () => {
    expect(
      normalizeCommand('/abs/path/node_modules/.bin/tsc -p /tmp/deadbeef99/tsconfig.json'),
    ).toBe('tsc -p tsconfig.json');
  });
});

describe('real verification execution', () => {
  const workspaceFor = async (name: string, files: ChangedFile[]) =>
    materializeWorkspace('web-basic', files, path.join(WORK, name));

  it('passes typecheck on correct consumer code', async () => {
    const ws = await workspaceFor('good', [GOOD_APP]);
    const plan = requirePlan(
      planVerifications(requireTask(dev, 'web-button-loading'), { workspaceDir: ws.dir }),
      'typecheck',
    );
    const run = await executePlan(plan, { attempt: 1 });
    expect(run.status).toBe('passed');
    expect(run.exitCode).toBe(0);
    expect(run.durationMs).toBeGreaterThan(0);
    expect(run.failureFingerprint).toBeNull();
  }, 60_000);

  it('fails typecheck and fingerprints a hallucinated export', async () => {
    const ws = await workspaceFor('bad', [BAD_APP]);
    const plan = requirePlan(
      planVerifications(requireTask(dev, 'web-button-loading'), { workspaceDir: ws.dir }),
      'typecheck',
    );
    const run = await executePlan(plan, { attempt: 1 });
    expect(run.status).toBe('failed');
    expect(run.exitCode).not.toBe(0);
    expect(run.failureFingerprint).toContain('TS2305');
    expect(run.excerpt).toContain('DataGrid');
  }, 60_000);

  it('runs a targeted fixture test for real', async () => {
    const ws = await workspaceFor('behaviour', [GOOD_APP, PASSING_TEST]);
    const plan = requirePlan(
      planVerifications(requireTask(dev, 'web-textfield-helper'), { workspaceDir: ws.dir }),
      'test',
    );
    const run = await executePlan(plan, { attempt: 1 });
    expect(run.status).toBe('passed');
    expect(run.command).toContain('vitest');
  }, 120_000);

  it('records an unsupported check without running anything', async () => {
    const task = requireTask(dev, 'rn-use-theme-getcolor');
    const run = await executePlan(requirePlan(plansFor(task), 'test'), { attempt: 1 });
    expect(run).toMatchObject({ status: 'unsupported', command: null, exitCode: null, attempt: 0 });
  });

  it('reports not-run when an in-process handler is missing', async () => {
    const run = await executePlan(
      requirePlan(plansFor(requireTask(dev, 'web-button-loading')), 'public-import'),
      { attempt: 1 },
    );
    expect(run.status).toBe('not-run');
  });
});

describe('bounded repair loop', () => {
  const plan: VerificationPlan = {
    kind: 'typecheck',
    required: true,
    supported: true,
    unsupportedReason: null,
    command: 'tsc',
    args: [],
    cwd: '.',
    targetSource: 'workspace',
  };
  const failed = (fingerprint: string): VerificationRun => ({
    kind: 'typecheck',
    required: true,
    status: 'failed',
    command: 'tsc',
    exitCode: 2,
    durationMs: 5,
    attempt: 1,
    failureFingerprint: fingerprint,
    excerpt: 'boom',
  });
  const passed: VerificationRun = {
    ...failed('x'),
    status: 'passed',
    exitCode: 0,
    failureFingerprint: null,
  };

  it('observes without repairing when no repair hook is given (D4)', async () => {
    const result = await runVerificationLoop({
      plans: [plan],
      execute: async () => failed('a'),
    });
    expect(result.repairAttempts).toBe(0);
    expect(result.repairSucceeded).toBeNull();
    expect(result.stoppedBecause).toBe('required-failed');
  });

  it('repairs once and re-runs only the smallest failing check', async () => {
    const executed: number[] = [];
    const result = await runVerificationLoop({
      plans: [plan],
      execute: async (_p, attempt) => {
        executed.push(attempt);
        return attempt === 1 ? failed('a') : passed;
      },
      repair: async () => ({ changedFiles: [], inputTokens: 120, toolCalls: [] }),
    });
    expect(executed).toEqual([1, 2]);
    expect(result.repairAttempts).toBe(1);
    expect(result.repairSucceeded).toBe(true);
    expect(result.repairTokens).toBe(120);
    expect(result.stoppedBecause).toBe('all-passed');
  });

  it('stops on a repeated failure fingerprint instead of retrying the same repair', async () => {
    const result = await runVerificationLoop({
      plans: [plan],
      execute: async () => failed('same'),
      repair: async () => ({ changedFiles: [], inputTokens: null, toolCalls: [] }),
    });
    expect(result.repeatedFailures).toBe(1);
    expect(result.repairAttempts).toBe(1);
    expect(result.stoppedBecause).toBe('repeated-failure');
    expect(result.repairTokens).toBeNull();
  });

  it('keeps a different failure after repair and stays inside the attempt budget', async () => {
    let call = 0;
    const result = await runVerificationLoop({
      plans: [plan],
      execute: async () => failed(`fp-${(call += 1)}`),
      repair: async () => ({ changedFiles: [], inputTokens: 10, toolCalls: [] }),
    });
    expect(result.repairAttempts).toBe(DEFAULT_REPAIR_LIMIT);
    expect(result.repairSucceeded).toBe(false);
    expect(result.stoppedBecause).toBe('repair-exhausted');
    expect(result.runs.filter((r) => r.status === 'failed')).toHaveLength(DEFAULT_REPAIR_LIMIT + 1);
  });

  it('records a declined repair rather than inventing an empty edit', async () => {
    const result = await runVerificationLoop({
      plans: [plan],
      execute: async () => failed('a'),
      repair: async () => null,
    });
    expect(result.repairAttempts).toBe(0);
    expect(result.stoppedBecause).toBe('repair-declined');
  });

  it('marks checks skipped after an earlier required failure as not-run', async () => {
    const second: VerificationPlan = { ...plan, kind: 'build' };
    const result = await runVerificationLoop({
      plans: [plan, second],
      execute: async () => failed('a'),
    });
    expect(result.runs[1]).toMatchObject({ status: 'not-run' });
    expect(result.runs[1].excerpt).toContain('skipped');
  });
});

describe('workspace materialisation', () => {
  it('writes agent files over the fixture and generates verification config', async () => {
    const ws = await materializeWorkspace('web-basic', [GOOD_APP], path.join(WORK, 'ws'));
    expect(await fs.readFile(path.join(ws.dir, 'src/App.tsx'), 'utf8')).toContain(
      'loadingPosition',
    );
    for (const generated of ['tsconfig.json', 'globals.d.ts', 'vitest.config.mts']) {
      expect(await fs.stat(path.join(ws.dir, generated))).toBeDefined();
    }
  });

  it('refuses a changed file that escapes the workspace', async () => {
    await expect(
      materializeWorkspace(
        'web-basic',
        [{ path: '../../escape.ts', content: 'export {};' }],
        path.join(WORK, 'escape'),
      ),
    ).rejects.toThrow(/escapes the workspace/);
  });
});
