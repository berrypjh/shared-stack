import { QuestionGuide } from '@berrypjh/devhub-ui';

import { EvalCommands } from '../ai/eval-commands';
import { VariantMetricChart } from '../ai/eval-overview';
import { Verification } from '../ai/verification';

import { EvalRuns } from './eval-runs';
import type { MeasureProps } from './types';

/** 검증: 성공률 · 거짓 성공 막대, variant 마다 검증 결과와 시도 별 판정. */
export const EvalVerification = ({ run, data, alternatives }: MeasureProps) => (
  <EvalRuns run={run} data={data} alternatives={alternatives}>
    {(evalRun, variants) => (
      <>
        {variants.length > 0 && (
          <>
            <VariantMetricChart
              evalRun={evalRun}
              variants={variants}
              metric="verifiedTaskSuccessRate"
            />
            <VariantMetricChart evalRun={evalRun} variants={variants} metric="falseSuccessRate" />
          </>
        )}
        <Verification evalRun={evalRun} variant={data.query.variant} />
      </>
    )}
  </EvalRuns>
);

/** 데이터와 관계없이 보이는 머리: 이 화면이 답하는 질문과 평가 돌리는 법. */
export const EvalVerificationIntro = () => (
  <>
    <QuestionGuide
      question="에이전트가 만든 코드가 실제로 동작하나? 해냈다는 말을 믿어도 되나?"
      points={[
        '과제마다 필수 검증이 정해져 있다 — 공개 경로 import 검사, 타입 검사, 테스트 등.',
        '검증 단계가 있는 variant(Progressive + Verification · Progressive + Repair)는 평가 도구가 만든 코드로 검증을 직접 돌린다.',
        '나머지 variant 는 평가 도구가 검증을 돌리지 않는다. live 실행에서는 "검증을 돌리지 않음" 으로 실패가 되는데, 코드가 틀렸다는 뜻이 아니다.',
        '"해냈다" 고 했는데 검증을 통과하지 못하면 거짓 성공이다.',
      ]}
    />
    <EvalCommands />
  </>
);
