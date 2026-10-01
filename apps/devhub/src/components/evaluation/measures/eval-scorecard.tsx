import { QuestionGuide } from '@berrypjh/devhub-ui';

import { importReason } from '@/lib/evaluation/ai';
import { notRunState } from '@/lib/evaluation/status';

import { EvalCommands } from '../ai/eval-commands';
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

/** 데이터와 관계없이 보이는 머리: 이 화면이 답하는 질문과 평가 돌리는 법. */
export const EvalScorecardIntro = () => (
  <>
    <QuestionGuide
      question="평가 에이전트가 과제를 실제로 해냈나? 해냈다고 거짓말하지는 않았나?"
      points={[
        '과제 하나를 정해 둔 횟수만큼 풀게 하고, 한 번을 "시도" 라 부른다. variant 는 에이전트에게 주는 자료와 도구의 조합이다.',
        '"검증까지 통과한 성공률" 이 가장 중요한 값이다 — 맞는 패키지를 골라 타입 검사 · 테스트까지 통과해야 성공으로 친다.',
        '"거짓 성공 주장 비율" 은 해냈다고 했는데 실제로는 통과하지 못한 비율이라 낮을수록 좋다.',
        '검증 단계가 없는 variant 는 평가 도구가 검증을 돌리지 않는다. live 실행에서는 실행기도 검증을 보고하지 않아 성공률이 0% 가 되고, 실패 원인 표에 "검증을 돌리지 않음" 으로 보인다.',
      ]}
    />
    <EvalCommands />
  </>
);
