import type { EVAL_METRICS } from '@berrypjh/observability-contracts';

/**
 * 소비자 평가 화면의 용어표. 코드 이름(metric · 실패 분류 · 플랫폼)을 화면 글로 바꾸는 곳은 여기 하나다.
 * 뜻은 평가 harness 의 계산(`reporters/aggregate.ts`)과 실패 판정 순서(`graders/task-success.ts`)를
 * 그대로 옮긴 것이고, 새 해석을 더하지 않는다.
 */

export type Better = 'higher' | 'lower' | null;
export type Term = { label: string; meaning: string; better: Better };

type MetricKey =
  | keyof typeof EVAL_METRICS.primary
  | keyof typeof EVAL_METRICS.secondary
  | keyof typeof EVAL_METRICS.diagnostic;

export const METRIC_TERMS: Record<MetricKey, Term> = {
  verifiedTaskSuccessRate: {
    label: '검증까지 통과한 성공률',
    meaning:
      '플랫폼 · 패키지를 맞게 고르고, 공개 경로로만 import 하고, 필수 검증을 모두 통과한 시도의 비율',
    better: 'higher',
  },
  routingAccuracy: {
    label: '플랫폼 · 패키지 선택 정확도',
    meaning: '플랫폼과 패키지를 둘 다 맞게 고른 시도의 비율. 고른 것을 보고하지 않은 시도는 빠진다',
    better: 'higher',
  },
  requiredEvidenceRecallAtK: {
    label: '필요한 근거를 찾은 비율',
    meaning:
      '과제에 필요한 근거(컴포넌트 · prop · 문서 등) 중 처음 K개 조회 안에 찾은 비율의 평균. 필요한 근거가 없는 과제는 빠진다',
    better: 'higher',
  },
  medianInputTokens: {
    label: '입력 토큰 (중앙값)',
    meaning: '시도 하나가 모델에 보낸 입력 토큰의 중앙값',
    better: 'lower',
  },
  falseSuccessRate: {
    label: '거짓 성공 주장 비율',
    meaning:
      '"해냈다" 고 했는데 검증을 통과하지 못한 비율. 해냈는지 아닌지를 분명히 말한 시도만 센다',
    better: 'lower',
  },
  wrongPackageRate: {
    label: '패키지를 잘못 고른 비율',
    meaning: '패키지를 보고한 시도 중 틀린 패키지를 고른 비율',
    better: 'lower',
  },
  mrr: {
    label: '첫 근거 순위 점수 (MRR)',
    meaning: '필요한 근거가 조회 결과 몇 번째에 처음 나왔는지의 역수 평균. 1 이면 첫 번째',
    better: 'higher',
  },
  unnecessaryToolCallRate: {
    label: '불필요한 도구 호출 비율',
    meaning: '같은 대상을 다시 조회했거나 과제가 허용하지 않은 도구를 부른 호출의 비율',
    better: 'lower',
  },
  toolCallsPerSuccessfulTask: {
    label: '성공한 시도당 도구 호출 수',
    meaning: '성공한 시도에서 도구를 부른 횟수의 평균',
    better: 'lower',
  },
  tokensPerSuccessfulTask: {
    label: '성공한 시도당 입력 토큰',
    meaning: '성공한 시도가 모델에 보낸 입력 토큰의 평균',
    better: 'lower',
  },
  noToolCorrectness: {
    label: '도구 없이 성공한 비율',
    meaning: '도구를 한 번도 부르지 않은 시도 중 성공한 비율',
    better: null,
  },
  verificationInvocationRate: {
    label: '필수 검증을 돌린 비율',
    meaning: '시도마다 필수 검증 중 실제로 돌린 비율의 평균',
    better: 'higher',
  },
  verificationPassRate: {
    label: '검증 통과율',
    meaning: '검증 판정이 난 시도 중 필수 검증을 모두 통과한 비율',
    better: 'higher',
  },
  medianRepairAttempts: {
    label: '수정 시도 횟수 (중앙값)',
    meaning: '검증 실패 뒤 코드를 고쳐 다시 돌린 횟수의 중앙값',
    better: null,
  },
  repairSuccessRate: {
    label: '수정 성공률',
    meaning: '수정을 시도한 시도 중 수정 뒤 통과한 비율',
    better: 'higher',
  },
  repeatedFailureRate: {
    label: '같은 실패를 반복한 비율',
    meaning: '고친 뒤에도 같은 실패가 다시 나온 시도의 비율',
    better: 'lower',
  },
  verificationUnsupportedRate: {
    label: '검증할 수 없던 비율',
    meaning:
      '필수 검증 중 이 환경에서 돌릴 수 없는 것이 있던 시도의 비율 (예: React Native 테스트)',
    better: 'lower',
  },
  medianRetrievedTokens: {
    label: '찾아 읽은 토큰 (중앙값)',
    meaning: '도구로 찾아 읽은 내용의 토큰 수 중앙값',
    better: null,
  },
  medianRetrievedFiles: {
    label: '찾아 읽은 파일 수 (중앙값)',
    meaning: '도구로 찾아 읽은 파일 수의 중앙값',
    better: null,
  },
  medianDuplicateRetrievals: {
    label: '같은 근거를 다시 찾은 횟수 (중앙값)',
    meaning: '이미 찾은 근거를 다시 가져온 횟수의 중앙값',
    better: 'lower',
  },
  medianLatencyMs: {
    label: '걸린 시간 (중앙값)',
    meaning: '시도 하나가 끝날 때까지 걸린 시간의 중앙값',
    better: 'lower',
  },
  medianRepairTokens: {
    label: '수정에 쓴 토큰 (중앙값)',
    meaning: '수정 단계에서 모델에 보낸 입력 토큰의 중앙값',
    better: null,
  },
  medianVerificationMs: {
    label: '검증에 걸린 시간 (중앙값)',
    meaning: '시도 하나의 검증 실행 시간 합의 중앙값',
    better: null,
  },
};

/** 실패 원인. 위에서부터 차례로 보고 처음 걸린 하나로 정한다 (판정 순서 그대로). */
export const FAILURE_TERMS: Record<string, Term> = {
  'routing-unreported': {
    label: '고른 플랫폼 · 패키지를 보고하지 않음',
    meaning: '끝낼 때 어떤 플랫폼 · 패키지를 골랐는지 말하지 않았다',
    better: null,
  },
  'wrong-platform': {
    label: '플랫폼을 잘못 고름',
    meaning: '웹 · React Native 를 틀렸다',
    better: null,
  },
  'forbidden-package': {
    label: '쓰면 안 되는 패키지를 씀',
    meaning: '이 과제에서 금지한 패키지를 골랐다',
    better: null,
  },
  'unnecessary-ui-routing': {
    label: '필요 없는 UI 패키지를 고름',
    meaning: 'UI 가 필요 없는 과제인데 UI 패키지를 골랐다',
    better: null,
  },
  'wrong-package': {
    label: '패키지를 잘못 고름',
    meaning: '필요한 패키지와 다르게 골랐다',
    better: null,
  },
  'public-api-violation': {
    label: '공개 경로가 아닌 곳에서 import',
    meaning: '패키지 내부 경로(src 등)를 직접 import 했다',
    better: null,
  },
  'repeated-failure': {
    label: '같은 실패를 반복',
    meaning: '고친 뒤에도 같은 검증 실패가 다시 나왔다',
    better: null,
  },
  'repair-failure': { label: '수정 실패', meaning: '고쳐 봤지만 통과하지 못했다', better: null },
  'hallucinated-api': {
    label: '없는 API 를 씀',
    meaning: '타입 검사에서 패키지에 없는 export 를 썼다고 나왔다',
    better: null,
  },
  'retrieval-failure': {
    label: '필요한 근거를 못 찾음',
    meaning: '검증이 실패했고, 필요한 근거를 하나도 찾지 못했다',
    better: null,
  },
  'implementation-failure': {
    label: '구현 오류',
    meaning: '타입 검사나 테스트가 실패했다',
    better: null,
  },
  'verification-failure': {
    label: '검증 실패',
    meaning: '그 밖의 필수 검증이 실패했다',
    better: null,
  },
  'verification-unsupported': {
    label: '검증할 수 없음',
    meaning: '필수 검증을 이 환경에서 돌릴 수 없었다',
    better: null,
  },
  'verification-omitted': {
    label: '검증을 돌리지 않음',
    meaning: '필수 검증이 실행되지 않았다. 검증 단계가 없는 variant 에서는 늘 이렇다',
    better: null,
  },
  'tool-error': {
    label: '도구 오류',
    meaning: '분류만 있고 지금 채점기는 이 원인으로 판정하지 않는다',
    better: null,
  },
};

/** 라우팅 표의 플랫폼. `unreported` 는 고른 것을 보고하지 않은 시도다. */
export const PLATFORM_TERMS: Record<string, string> = {
  web: '웹',
  'react-native': 'React Native',
  both: '둘 다',
  none: 'UI 없음',
  unreported: '보고 안 함',
};

export const VERIFICATION_KIND_LABEL: Record<string, string> = {
  'public-import': '공개 경로 import 검사',
  typecheck: '타입 검사',
  test: '테스트',
  build: '빌드',
  lint: 'lint',
};

export const BETTER_TEXT: Record<Exclude<Better, null>, string> = {
  higher: '높을수록 좋음',
  lower: '낮을수록 좋음',
};

/** 화면 글과 코드 이름. 표에 없는 이름은 코드 그대로 보이되 지어내지 않는다. */
export const metricTerm = (key: string): Term =>
  METRIC_TERMS[key as MetricKey] ?? { label: key, meaning: '', better: null };
export const failureTerm = (key: string): Term =>
  FAILURE_TERMS[key] ?? { label: key, meaning: '', better: null };

/** 시도 하나의 이름 — trace id 대신 과제와 몇 번째 시도인지. */
export const attemptName = (trace: { taskId: string; trial: number }) =>
  `${trace.taskId} · ${trace.trial}번째`;
