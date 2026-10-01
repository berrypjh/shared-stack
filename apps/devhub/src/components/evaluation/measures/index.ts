import type { RunSummary } from '@berrypjh/observability-contracts';

import type { EvaluationKind } from '@/domain/model';
import type { QuerySpec } from '@/lib/evaluation/query';

import { CONTEXT_COLUMNS, CONTEXT_PANELS } from '../ai/context-panels';
import { BUDGET_COLUMNS } from '../bundles/budget-section';
import { TREESHAKE_COLUMNS } from '../bundles/treeshake-section';

import { BundleBudget } from './bundle-budget';
import { ContextTokens } from './context-tokens';
import { EvalRetrieval, EvalRetrievalIntro } from './eval-retrieval';
import { EvalRouting, EvalRoutingIntro } from './eval-routing';
import { EvalScorecard, EvalScorecardIntro } from './eval-scorecard';
import { RETRIEVAL_TERMS, ROUTING_TERMS, SCORECARD_TERMS, VERIFICATION_TERMS } from './eval-terms';
import { EvalVerification, EvalVerificationIntro } from './eval-verification';
import { Treeshake } from './treeshake';
import type { MeasureProps, Terms } from './types';

export type { MeasureProps } from './types';

const columns = (items: Terms['items']): Terms => ({ title: '표 컬럼', items });
const terms = (items: Terms['items']): Terms => ({ title: '용어', items });

type Measure = {
  /** 주소가 받는 키. 그 밖의 키는 주소 오류로 보인다. */
  spec: QuerySpec;
  render: (props: MeasureProps) => React.JSX.Element;
  /** 실행이 없어도 보이는 머리 (이 화면이 답하는 질문 · 돌리는 법). */
  intro?: () => React.JSX.Element;
  /** 본문 표의 컬럼 · 용어 뜻. 상세 칸 개요에 보인다. */
  terms?: Terms;
};

const EVAL_SPEC: QuerySpec = { keys: ['run', 'variant'] };

/** 평가 항목 ID(`data/evaluations.ts`)마다 본문과 주소 규격. 테스트가 카탈로그 전부를 대조한다. */
export const MEASURES: Record<string, Measure> = {
  'bundle-budget': {
    spec: { keys: ['run', 'base', 'package'] },
    render: BundleBudget,
    terms: columns(BUDGET_COLUMNS),
  },
  treeshake: {
    spec: { keys: ['run', 'package'] },
    render: Treeshake,
    terms: columns(TREESHAKE_COLUMNS),
  },
  'context-tokens': {
    spec: { keys: ['run', 'panel'], panels: CONTEXT_PANELS },
    render: ContextTokens,
    terms: columns(CONTEXT_COLUMNS),
  },
  'eval-scorecard': {
    spec: EVAL_SPEC,
    render: EvalScorecard,
    intro: EvalScorecardIntro,
    terms: terms(SCORECARD_TERMS),
  },
  'eval-routing': {
    spec: EVAL_SPEC,
    render: EvalRouting,
    intro: EvalRoutingIntro,
    terms: terms(ROUTING_TERMS),
  },
  'eval-retrieval': {
    spec: EVAL_SPEC,
    render: EvalRetrieval,
    intro: EvalRetrievalIntro,
    terms: terms(RETRIEVAL_TERMS),
  },
  'eval-verification': {
    spec: EVAL_SPEC,
    render: EvalVerification,
    intro: EvalVerificationIntro,
    terms: terms(VERIFICATION_TERMS),
  },
};

/** 그 묶음의 값이 요약에 있는가. 다른 실행을 안내할 때 쓴다. */
export const HAS_AREA: Record<EvaluationKind, (summary: RunSummary) => boolean> = {
  bundle: (summary) => summary.sections.bundles > 0,
  context: (summary) => summary.sections.contexts > 0,
  eval: (summary) => summary.sections.evals > 0,
};
