import { importReason } from '@/lib/evaluation/ai';
import { notRunState } from '@/lib/evaluation/status';

import { Scorecard } from '../ai/eval-overview';
import { StatusNotice } from '../status-notice';

import { EvalRuns } from './eval-runs';
import type { MeasureProps } from './types';

/** 성적표: 실행 요약, 핵심 지표 표 · 막대 · 실패 원인 · 세부 지표. */
export const EvalScorecard = ({ run, data, alternatives }: MeasureProps) => (
  <EvalRuns run={run} data={data} alternatives={alternatives}>
    {(evalRun, variants) =>
      evalRun.variants.length === 0 ? (
        <StatusNotice
          state={notRunState({
            section: 'variant 별 지표',
            runId: evalRun.sourceId,
            reason: importReason('summary', evalRun.import.summary),
            collectProfile: 'eval',
            alternatives: null,
          })}
        />
      ) : (
        <Scorecard evalRun={evalRun} variants={variants} />
      )
    }
  </EvalRuns>
);
