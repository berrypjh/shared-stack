import type { TermItem } from '@berrypjh/devhub-ui';

import {
  BETTER_TEXT,
  metricTerm,
  PLATFORM_TERMS,
  VERIFICATION_KIND_LABEL,
} from '@/lib/evaluation/glossary';

/** 소비자 평가 화면의 상세 칸 "용어". 이름은 코드, 뜻은 화면 이름과 설명이다. */

const metric = (key: string): TermItem => {
  const { label, meaning, better } = metricTerm(key);
  return { term: key, meaning: `${label} — ${meaning}${better ? `. ${BETTER_TEXT[better]}` : ''}` };
};

const BASICS: TermItem[] = [
  {
    term: 'variant',
    meaning: '에이전트에게 주는 자료와 도구의 조합. 화면에는 이름 아래 코드로 보인다',
  },
  { term: 'trial (시도)', meaning: '과제 하나를 한 번 푼 것. 같은 과제를 여러 번 풀 수 있다' },
];

export const SCORECARD_TERMS: TermItem[] = [
  ...BASICS,
  ...[
    'verifiedTaskSuccessRate',
    'routingAccuracy',
    'requiredEvidenceRecallAtK',
    'medianInputTokens',
    'falseSuccessRate',
  ].map(metric),
];

export const ROUTING_TERMS: TermItem[] = [
  ...BASICS,
  metric('routingAccuracy'),
  ...Object.entries(PLATFORM_TERMS).map(([code, label]) => ({
    term: code,
    meaning: label,
  })),
  {
    term: 'resolver',
    meaning: '규칙 기반 판정기 — 모델 없이 과제 문장과 프로젝트 의존성으로 플랫폼을 정한다',
  },
];

export const RETRIEVAL_TERMS: TermItem[] = [
  ...BASICS,
  {
    term: 'evidence (근거)',
    meaning: '과제에 필요한 컴포넌트 · prop · 토큰 · 문서. 도구 결과에서만 생긴다',
  },
  { term: 'K', meaning: '찾은 것 중 앞에서부터 몇 개까지 셀지' },
  metric('requiredEvidenceRecallAtK'),
  metric('mrr'),
];

export const VERIFICATION_TERMS: TermItem[] = [
  ...BASICS,
  metric('verifiedTaskSuccessRate'),
  metric('falseSuccessRate'),
  ...Object.entries(VERIFICATION_KIND_LABEL).map(([code, label]) => ({
    term: code,
    meaning: label,
  })),
  {
    term: '수정 (repair)',
    meaning: '검증이 실패하면 실패 내용만 보고 코드를 고쳐 다시 돌리는 단계',
  },
];
