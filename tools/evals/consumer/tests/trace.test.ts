import { describe, expect, it } from 'vitest';

import { gradeTask, loadPackageSurfaces } from '../graders';
import { loadDataset } from '../runner/dataset';
import { toJsonl } from '../runner/jsonl';
import { parseTraces } from '../runner/trace';

import { passingVerification, requireTask, traceFor } from './helpers';

const dev = await loadDataset('dev');
const surfaces = await loadPackageSurfaces();
const task = requireTask(dev, 'web-button-loading');

const trace = traceFor(task, {
  selectedPlatform: 'web',
  selectedPackages: ['@berrypjh/react-ui'],
  retrieved: task.expected.requiredEvidence,
  toolCalls: [
    {
      capability: 'read-consumer-doc',
      target: 'libs/react-ui/AGENTS.consumer.md',
      duplicate: false,
    },
  ],
  changedFiles: [{ path: 'src/App.tsx', content: `import { Button } from '@berrypjh/react-ui';` }],
  verification: passingVerification(task),
  claimedSuccess: true,
  inputTokens: 4210,
});

describe('trace jsonl', () => {
  it('round-trips a raw trace', () => {
    const [back] = parseTraces(toJsonl([trace]), 'inline.jsonl');
    expect(back).toEqual(trace);
  });

  it('round-trips a graded trace and strips the grade back off', () => {
    const graded = { ...trace, grade: gradeTask(task, trace, { surfaces }) };
    const [back] = parseTraces(toJsonl([graded]), 'inline.jsonl');
    expect(back).toEqual(trace);
    expect(back).not.toHaveProperty('grade');
  });

  it('keeps unsupported measurements as null instead of zero', () => {
    const [back] = parseTraces(toJsonl([trace]), 'inline.jsonl');
    expect(back.outputTokens).toBeNull();
    expect(back.latencyMs).toBeNull();
    expect(back.retrievedTokens).toBeNull();
  });

  it('rejects a trace whose numeric field was stringified', () => {
    expect(() => parseTraces(toJsonl([{ ...trace, inputTokens: '4210' }]), 'inline.jsonl')).toThrow(
      /invalid trace/,
    );
  });

  it('rejects malformed jsonl with a line number', () => {
    expect(() => parseTraces('{"a":1}\n{not json}\n', 'inline.jsonl')).toThrow(
      /inline\.jsonl:2 invalid JSON/,
    );
  });
});
