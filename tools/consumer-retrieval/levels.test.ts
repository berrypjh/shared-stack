import { describe, expect, it } from 'vitest';

import { canUseSourceFallback, createRecorder, type RetrievalEvent } from './levels';

const event = (over: Partial<RetrievalEvent> = {}) => ({
  level: 'L2' as const,
  capability: 'lookup-symbol',
  target: '@berrypjh/react-ui#Button',
  outcome: 'ok' as const,
  payload: { props: { loading: { type: 'boolean' } } },
  ...over,
});

describe('retrieval telemetry', () => {
  it('records level, size and measured tokens per event', () => {
    const recorder = createRecorder();
    const recorded = recorder.record(event());
    expect(recorded.level).toBe('L2');
    expect(recorded.bytes).toBeGreaterThan(0);
    expect(recorded.contextTokens).toBeGreaterThan(0);

    const telemetry = recorder.telemetry();
    expect(telemetry.levelsUsed).toEqual(['L2']);
    expect(telemetry.retrievedFiles).toBe(1);
    expect(telemetry.totalTokens).toBe(recorded.contextTokens);
  });

  it('flags a repeated retrieval of the same target at the same level', () => {
    const recorder = createRecorder();
    recorder.record(event());
    recorder.record(event());
    expect(recorder.telemetry().duplicateRetrievals).toBe(1);
    expect(recorder.telemetry().retrievedFiles).toBe(1);
  });

  it('leaves totalTokens null when nothing was measured', () => {
    const recorder = createRecorder();
    recorder.record({ ...event(), countTokens: false });
    const telemetry = recorder.telemetry();
    expect(telemetry.events[0].contextTokens).toBeNull();
    expect(telemetry.totalTokens).toBeNull();
    expect(telemetry.totalBytes).toBeGreaterThan(0);
  });

  it('orders levels from summary to source fallback', () => {
    const recorder = createRecorder();
    recorder.record({ ...event(), level: 'L4', target: 'libs/react-ui/src/x.tsx' });
    recorder.record({ ...event(), level: 'L0', target: '@berrypjh/react-ui' });
    expect(recorder.telemetry().levelsUsed).toEqual(['L0', 'L4']);
  });
});

describe('source fallback policy', () => {
  it('refuses source before the symbol was looked up', () => {
    expect(canUseSourceFallback([])).toMatchObject({ allowed: false });
    const recorder = createRecorder();
    recorder.record(event());
    expect(canUseSourceFallback(recorder.telemetry().events)).toMatchObject({ allowed: false });
  });

  it('allows source once an exact lookup came back not-found', () => {
    const recorder = createRecorder();
    recorder.record({ ...event(), outcome: 'not-found' });
    const decision = canUseSourceFallback(recorder.telemetry().events);
    expect(decision.allowed).toBe(true);
    expect(decision.because).toContain('not-found');
  });

  it('allows source for an explicit implementation or debug question', () => {
    expect(canUseSourceFallback([], 'implementation-detail').allowed).toBe(true);
    expect(canUseSourceFallback([], 'debug').allowed).toBe(true);
  });
});
