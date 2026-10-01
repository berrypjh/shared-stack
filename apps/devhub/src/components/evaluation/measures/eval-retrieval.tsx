import { QuestionGuide } from '@berrypjh/devhub-ui';

import { EvalCommands } from '../ai/eval-commands';
import { VariantMetricChart } from '../ai/eval-overview';
import { Retrieval } from '../ai/retrieval';

import { EvalRuns } from './eval-runs';
import type { MeasureProps } from './types';

/** 검색: 근거 찾은 비율 막대, variant 마다 시도 별 근거 찾기. */
export const EvalRetrieval = ({ run, data, alternatives }: MeasureProps) => (
  <EvalRuns run={run} data={data} alternatives={alternatives}>
    {(evalRun, variants) => (
      <>
        {variants.length > 0 && (
          <VariantMetricChart
            evalRun={evalRun}
            variants={variants}
            metric="requiredEvidenceRecallAtK"
          />
        )}
        <Retrieval evalRun={evalRun} variant={data.query.variant} />
      </>
    )}
  </EvalRuns>
);

/** 데이터와 관계없이 보이는 머리: 이 화면이 답하는 질문과 평가 돌리는 법. */
export const EvalRetrievalIntro = () => (
  <>
    <QuestionGuide
      question="에이전트가 과제에 필요한 근거를 찾아 읽었나?"
      points={[
        '과제마다 꼭 확인해야 할 근거가 정해져 있다 — 예: Button 컴포넌트, 그 loading prop, 패키지 사용 안내 문서.',
        '에이전트가 도구로 찾은 것 중 처음 몇 개(K) 안에 그 근거가 있었는지를 센다. 일찍 찾을수록 좋다.',
        '파일을 통째로 읽는 variant 는 문서 · 패키지 근거만 남고 컴포넌트 · prop 근거는 조회 도구로만 생긴다 — 그래서 값이 낮게 나올 수 있다.',
        '필요한 근거가 없는 과제(예: UI 가 필요 없는 과제)는 계산에서 빠진다.',
      ]}
    />
    <EvalCommands />
  </>
);
