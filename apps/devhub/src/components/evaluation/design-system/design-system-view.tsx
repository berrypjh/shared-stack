import type { RunArtifact } from '@berrypjh/observability-contracts';

import type { SummaryResult } from '@/lib/evaluation/client';
import { unsupportedState } from '@/lib/evaluation/status';

import { StatusNotice } from '../status-notice';
import { type RunData, runsWith } from '../use-run-data';

import { ComponentTokens } from './component-tokens';
import { ContrastGuards } from './contrast-guards';
import { DemoLinks } from './demo-links';
import { StateMatrix } from './state-matrix';
import { Themes } from './themes';

/** 고른 실행의 design-system 근거. 근거가 없는 실행은 unsupported 와 대안 실행을 준다. */
export const DesignSystemView = ({
  run,
  data,
  summaries,
}: {
  run: RunArtifact;
  data: RunData;
  summaries: Record<string, SummaryResult>;
}) => {
  const { runId, profile } = run.metadata;
  const ds = run.designSystem;
  if (!ds) {
    return (
      <StatusNotice
        state={unsupportedState({
          section: 'design-system 근거',
          runId,
          profile,
          collectProfile: 'static',
          alternatives: runsWith(summaries, (summary) => summary.sections.designSystem, runId),
        })}
      />
    );
  }
  const signals = ds.signals.filter(
    (signal) => !data.query.platform || signal.platform === data.query.platform,
  );
  return (
    <>
      <DemoLinks />
      <Themes ds={ds} />
      <StateMatrix signals={signals} total={ds.signals.length} data={data} />
      <ComponentTokens ds={ds} />
      <ContrastGuards ds={ds} />
    </>
  );
};
