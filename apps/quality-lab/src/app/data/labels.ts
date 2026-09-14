/** 상태·종류를 색 밖에서 읽히는 글로. 원본 상태 이름을 바꾸지 않고 옆에 설명만 붙인다. */

export const DOMAIN_LABEL: Record<string, string> = {
  test: '테스트',
  bundle: '번들',
  context: '컨텍스트',
  eval: '평가',
  verification: '검증',
  a11y: '접근성',
  browser: '브라우저',
  'package-surface': '패키지 표면',
};

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

export const EXECUTION_LABEL: Record<string, string> = {
  completed: '완료',
  failed: '실패 종료',
  timeout: '시간 초과',
  cancelled: '중단',
  imported: 'import',
  'not-run': '실행 안 함',
  unsupported: '지원 안 함',
  unavailable: '실행 불가',
};

export const REPORT_LABEL: Record<string, string> = {
  parsed: '읽음',
  missing: '없음',
  corrupt: '깨짐',
  invalid: '형식 오류',
  'not-requested': '요청 안 함',
};

export const CASE_STATUS_LABEL: Record<string, string> = {
  passed: '통과',
  failed: '실패',
  skipped: 'skip',
  todo: 'todo',
};

export const CHECK_KIND_LABEL: Record<string, string> = {
  lint: 'Lint — 정적 규칙',
  typecheck: 'Typecheck — 타입',
  build: 'Build — 산출물',
  'public-import': 'Public import — 공개 진입점',
  test: 'Test — 실행',
};

export const EXECUTOR_LABEL: Record<string, string> = {
  'harness-smoke': 'harness smoke — 모델 성능이 아님',
  scripted: 'scripted — 모델 성능이 아님',
  replay: 'replay — 기록된 trace 재채점',
  unavailable: 'executor 없음',
  unknown: 'executor 종류 모름',
};

export const NOTICE_LABEL: Record<string, string> = {
  'harness-smoke': 'harness smoke 입력',
  'no-live-executor': 'live executor 없음',
  'no-baseline': 'baseline 없음',
  'baseline-not-requested': 'baseline 비교 요청 안 함',
  'unsupported-required-check': '필수 검증 일부 지원 안 함',
  'replay-without-repair-hook': 'replay — repair hook 없음',
  'partial-import': '일부만 import',
};

export const ARTIFACT_STATUS_LABEL: Record<string, string> = {
  present: '있음',
  missing: '없음',
  invalid: '형식 오류',
};

export const AUTHORITY_LABEL: Record<string, string> = {
  'harness-executed': 'harness-executed — harness 가 검증을 직접 실행',
  'executor-reported': 'executor-reported — executor 의 보고만 있음',
};

export const REPAIR_LABEL: Record<string, string> = {
  'not-in-variant': 'not-in-variant — 이 variant 에 repair 단계가 없음',
  'no-repair-hook': 'no-repair-hook — repair hook 이 없어 시도하지 못함',
  unknown: 'unknown — 확인할 수 없음',
};

export const CONTRAST_BASIS_LABEL: Record<string, string> = {
  'wcag-2.1-aa': 'WCAG 2.1 AA',
  'project-visibility-guard': '프로젝트 가시성 가드 (WCAG 기준 아님)',
};

export const REGENERATED_LABEL: Record<string, string> = {
  identical: '재생성 결과 같음',
  differs: '재생성 결과 다름',
  'not-run': '재생성 안 함',
};
