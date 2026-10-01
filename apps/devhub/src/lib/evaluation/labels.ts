/** 상태·종류를 색 밖에서 읽히는 글로. 원본 상태 이름을 바꾸지 않고 옆에 설명만 붙인다. */

export const VERIFICATION_LABEL: Record<string, string> = {
  passed: '통과',
  failed: '실패',
  timeout: '시간 초과',
  'not-run': '실행 안 함',
  unsupported: '지원 안 함',
};

export const OUTCOME_LABEL: Record<string, string> = {
  pass: '통과',
  fail: '실패',
  warn: '경고',
  info: '정보',
};

export const STATE_LABEL: Record<string, string> = {
  running: '수집 중',
  complete: '완료',
  partial: '일부만 수집',
  failed: '실패',
  cancelled: '취소',
};

export const SOURCE_KIND_LABEL: Record<string, string> = {
  local: '로컬',
  ci: 'CI',
  unknown: '모름',
};

export const FRESHNESS_LABEL: Record<string, string> = {
  fresh: '기준과 같음',
  stale: '기준과 다름',
  unknown: '비교할 수 없음',
};

export const REPORT_LABEL: Record<string, string> = {
  parsed: '읽음',
  missing: '없음',
  corrupt: '깨짐',
  invalid: '형식 오류',
  'not-requested': '요청 안 함',
  'not-run': '실행 안 함',
};

export const EXECUTOR_LABEL: Record<string, string> = {
  'harness-smoke': '고정 입력 확인 — 모델이 푼 것이 아님',
  live: '모델을 실제로 호출',
  scripted: '테스트용 고정 결과 — 모델이 푼 것이 아님',
  replay: '기록된 결과를 다시 채점',
  unavailable: '실행기 없음',
  unknown: '실행기 종류 모름',
};

/** live 실행기 이름 → 모델 제공자. `anthropic-live` 는 제공자를 고르기 전에 쓰던 이름이다. */
export const LIVE_PROVIDER_LABEL: Record<string, string> = {
  'live-claude': 'Claude',
  'live-openai': 'OpenAI',
  'live-local': '로컬 LLM',
  'anthropic-live': 'Claude',
};

/** 평가 실행의 모델을 "제공자 · 모델" 로. 모델을 부르지 않은 실행은 null 이다. */
export const modelText = (origin: { executor: string; model: string | null } | null) =>
  origin?.model
    ? `${LIVE_PROVIDER_LABEL[origin.executor] ? `${LIVE_PROVIDER_LABEL[origin.executor]} · ` : ''}${origin.model}`
    : null;

export const NOTICE_LABEL: Record<string, string> = {
  'harness-smoke': '고정 입력으로 평가 도구만 확인한 실행 — 점수는 모델 성능이 아님',
  'no-live-executor': '모델을 호출하지 않은 실행 — 성공률을 모델 성능으로 읽으면 안 됨',
  'no-baseline': '비교할 기준 실행이 없어 이번 값만 보임',
  'baseline-not-requested': '기준 실행과의 비교를 요청하지 않음',
  'unsupported-required-check': '필수 검증 일부를 이 환경에서 돌릴 수 없음',
  'replay-without-repair-hook': '기록을 다시 채점한 실행이라 수정 단계를 돌리지 못함',
  'partial-import': '평가 산출물 일부만 읽음',
};

export const ARTIFACT_STATUS_LABEL: Record<string, string> = {
  present: '있음',
  missing: '없음',
  invalid: '형식 오류',
};

export const AUTHORITY_LABEL: Record<string, string> = {
  'harness-executed': '평가 도구가 검증을 직접 돌림',
  'executor-reported': '검증 단계가 없음 — 실행기가 보고한 것만 있음',
};

export const REPAIR_LABEL: Record<string, string> = {
  'not-in-variant': '이 variant 에는 수정 단계가 없음',
  'no-repair-hook': '수정 단계가 있지만 실행기가 지원하지 않아 시도하지 못함',
  unknown: '수정 단계를 확인할 수 없음',
};
