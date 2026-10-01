import { QuestionGuide } from '@berrypjh/devhub-ui';

import { EvalCommands } from '../ai/eval-commands';
import { VariantMetricChart } from '../ai/eval-overview';
import { Routing } from '../ai/routing';

import { EvalRuns } from './eval-runs';
import type { MeasureProps } from './types';

/** 라우팅: 선택 정확도 막대, variant 마다 정답 × 고른 플랫폼 표. */
export const EvalRouting = ({ run, data, alternatives }: MeasureProps) => (
  <EvalRuns run={run} data={data} alternatives={alternatives}>
    {(evalRun, variants) => (
      <>
        {variants.length > 0 && (
          <VariantMetricChart evalRun={evalRun} variants={variants} metric="routingAccuracy" />
        )}
        <Routing evalRun={evalRun} variant={data.query.variant} />
      </>
    )}
  </EvalRuns>
);

/** 데이터와 관계없이 보이는 머리: 이 화면이 답하는 질문과 평가 돌리는 법. */
export const EvalRoutingIntro = () => (
  <>
    <QuestionGuide
      question="에이전트가 과제에 맞는 플랫폼(웹 · React Native)과 패키지를 골랐나?"
      points={[
        '과제마다 정답 플랫폼이 있다 — 웹 앱이면 @berrypjh/react-ui, 모바일 앱이면 @berrypjh/react-native-ui, UI 가 필요 없으면 둘 다 아님.',
        '에이전트는 끝낼 때 고른 플랫폼과 패키지를 보고한다. 보고하지 않으면 "보고 안 함" 으로 센다.',
        '플랫폼을 틀리면 코드가 맞아도 실패다 — 실패 원인에서 가장 먼저 보는 항목이다.',
      ]}
    />
    <EvalCommands />
  </>
);
