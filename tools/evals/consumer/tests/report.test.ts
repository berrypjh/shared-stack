import { describe, expect, it } from 'vitest';

import { gradeTask, loadPackageSurfaces } from '../graders';
import { aggregateVariant, confusionByVariant, type RunSummary } from '../reporters/aggregate';
import { renderMarkdown } from '../reporters/markdown';
import { loadDataset } from '../runner/dataset';
import type { GradedTrace } from '../runner/trace';
import { HARNESS_VERSION } from '../runner/version';
import { measureVariantContext } from '../variants/context';
import { VARIANTS } from '../variants/index';

import { passingVerification, requireTask, traceFor } from './helpers';

const dev = await loadDataset('dev');
const surfaces = await loadPackageSurfaces();
const variant = VARIANTS['consumer-docs'];
const context = await measureVariantContext(variant);

const tasks = dev.filter((t) => ['web-button-loading', 'no-ui-date-format'].includes(t.taskId));

const grade = (trace: ReturnType<typeof traceFor>, taskId: string): GradedTrace => ({
  ...trace,
  grade: gradeTask(requireTask(tasks, taskId), trace, { surfaces }),
});

const web = requireTask(tasks, 'web-button-loading');
const none = requireTask(tasks, 'no-ui-date-format');

const traces: GradedTrace[] = [
  grade(
    traceFor(web, {
      selectedPlatform: 'web',
      selectedPackages: ['@berrypjh/react-ui'],
      retrieved: web.expected.requiredEvidence,
      changedFiles: [
        { path: 'src/App.tsx', content: `import { Button } from '@berrypjh/react-ui';` },
      ],
      verification: passingVerification(web),
      claimedSuccess: true,
      inputTokens: 4000,
    }),
    'web-button-loading',
  ),
  grade(
    traceFor(none, {
      selectedPlatform: 'none',
      selectedPackages: [],
      verification: passingVerification(none),
      claimedSuccess: true,
      inputTokens: 1000,
    }),
    'no-ui-date-format',
  ),
];

const metrics = aggregateVariant(variant, context, tasks, traces);

const summary: RunSummary = {
  runId: 'run-fixed',
  createdAt: '2026-01-01T00:00:00.000Z',
  split: 'dev',
  gitSha: 'deadbeef',
  executor: 'scripted',
  model: null,
  harnessVersion: HARNESS_VERSION,
  taskCount: tasks.length,
  trialCount: 1,
  k: 5,
  variants: [metrics],
  routingConfusion: confusionByVariant(traces),
  conditions: null,
  comparison: null,
};

describe('aggregation', () => {
  it('computes primary metrics over trials', () => {
    expect(metrics.primary.verifiedTaskSuccessRate).toEqual({
      value: 1,
      numerator: 2,
      denominator: 2,
    });
    expect(metrics.primary.medianInputTokens).toEqual({ value: 2500, n: 2 });
    expect(metrics.primary.falseSuccessRate.value).toBe(0);
  });

  it('averages recall only over tasks that declare evidence', () => {
    expect(metrics.primary.requiredEvidenceRecallAtK).toEqual({ value: 1, n: 1 });
  });

  it('marks metrics with no data as null and lists them as unsupported', () => {
    expect(metrics.diagnostic.medianLatencyMs.value).toBeNull();
    expect(metrics.secondary.unnecessaryToolCallRate.value).toBeNull();
    expect(metrics.unsupported).toContain('diagnostic.medianLatencyMs');
    expect(metrics.unsupported).toContain('secondary.unnecessaryToolCallRate');
    expect(metrics.unsupported).not.toContain('primary.verifiedTaskSuccessRate');
  });

  it('measures the variant initial context from real files', () => {
    expect(context.missingPaths).toEqual([]);
    expect(context.tokens).toBeGreaterThan(0);
  });
});

describe('markdown report', () => {
  const md = renderMarkdown(summary);

  it('is deterministic for the same summary', () => {
    expect(renderMarkdown(summary)).toBe(md);
  });

  it('renders N/A for unsupported metrics and a real 0 for measured zeroes', () => {
    expect(md).toContain('| Consumer Docs | 100.0% (2/2) |');
    expect(md).toContain('N/A');
    expect(md).toContain('0.0% (0/2)');
    expect(md).toContain('- Consumer Docs: secondary.unnecessaryToolCallRate');
    expect(md).toContain('diagnostic.medianRetrievedTokens');
  });

  it('reports the four axes as independent sections', () => {
    for (const heading of [
      '## Overall Scorecard',
      '## Correctness',
      '## Routing',
      '## Context Efficiency',
      '## Verification',
      '### Failure breakdown',
    ]) {
      expect(md).toContain(heading);
    }
  });

  it('never emits a composite score', () => {
    expect(md).not.toMatch(/composite score:/i);
    expect(md).toContain('There is no composite score, by design.');
  });

  it('says so plainly when no baseline exists', () => {
    expect(md).toContain('Baseline comparison was not requested for this run.');
  });

  it('records split, git sha and executor provenance', () => {
    expect(md).toContain('- split: **dev**');
    expect(md).toContain('- git sha: deadbeef');
    expect(md).toContain('- executor: scripted');
    expect(md).toContain('- model: N/A');
  });
});
