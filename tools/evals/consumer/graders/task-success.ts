import type { Trace } from '../runner/schema';

import type { PublicImportGrade } from './public-import';
import type { RetrievalGrade } from './retrieval';
import type { RoutingGrade } from './routing';
import type { VerificationGrade } from './verification';

export const FAILURE_CATEGORIES = [
  'routing-unreported',
  'wrong-platform',
  'wrong-package',
  'forbidden-package',
  'unnecessary-ui-routing',
  'retrieval-failure',
  'hallucinated-api',
  'public-api-violation',
  'verification-failure',
  'verification-unsupported',
  'verification-omitted',
  'repeated-failure',
  'repair-failure',
  'implementation-failure',
  'tool-error',
] as const;

export type FailureCategory = (typeof FAILURE_CATEGORIES)[number];

export type TaskSuccessGrade = {
  taskSucceeded: boolean;
  /**
   * claimed success인데 required verification이 통과하지 않은 경우.
   * `claimedSuccess`가 `'unknown'`이거나 미보고(`null`)면 false success가 아니라
   * 분모에서 제외된다 — 모른다고 답한 것을 거짓 주장으로 세지 않는다.
   */
  falseSuccess: boolean;
  /** false success 분모에 포함되는지. `true`/`false`를 명시적으로 주장했을 때만. */
  claimCounted: boolean;
  failureCategory: FailureCategory | null;
};

type Inputs = {
  trace: Trace;
  routing: RoutingGrade;
  retrieval: RetrievalGrade;
  publicImport: PublicImportGrade;
  verification: VerificationGrade;
};

/** typecheck TS2305 = "has no exported member" — 존재하지 않는 API를 쓴 것. */
const hallucinatedApi = (trace: Trace): boolean =>
  trace.verification.some(
    (run) => run.status === 'failed' && (run.failureFingerprint ?? '').includes('TS2305'),
  );

const repeatedFailure = (trace: Trace): boolean => (trace.repeatedFailures ?? 0) > 0;

const repairFailed = (trace: Trace): boolean =>
  trace.repairAttempts > 0 && trace.repairSucceeded === false;

/** 코드가 틀려서 실패하는 check들 — 이쪽 실패는 구현 문제로 본다. */
const CODE_LEVEL_KINDS = new Set(['typecheck', 'test']);

/**
 * 원인을 하나로 좁힌다. 실제로 실패한 것이 있으면 그것이 이야기다 —
 * 앞선 required 실패 때문에 건너뛴 check를 "누락"으로 잘못 부르지 않도록
 * 실패/미지원을 누락보다 먼저 본다.
 *
 * retrieval recall은 성공 조건이 아니다. 검증이 실패했는데 필요한 근거를
 * 하나도 못 찾았을 때만, 더 유용한 설명으로서 retrieval-failure를 쓴다.
 */
const firstFailure = ({
  routing,
  retrieval,
  publicImport,
  verification,
  trace,
}: Inputs): FailureCategory | null => {
  if (routing.platformCorrect === null || routing.packageCorrect === null)
    return 'routing-unreported';
  if (!routing.platformCorrect) return 'wrong-platform';
  if (routing.forbiddenPackagesUsed.length > 0) return 'forbidden-package';
  if (routing.unnecessaryUiRouting === true) return 'unnecessary-ui-routing';
  if (!routing.packageCorrect) return 'wrong-package';
  if (!publicImport.passed) return 'public-api-violation';
  if (repeatedFailure(trace)) return 'repeated-failure';
  if (repairFailed(trace)) return 'repair-failure';

  if (verification.failedRequired.length > 0) {
    if (hallucinatedApi(trace)) return 'hallucinated-api';
    if (retrieval.recallAtK === 0) return 'retrieval-failure';
    return verification.failedRequired.some((k) => CODE_LEVEL_KINDS.has(k))
      ? 'implementation-failure'
      : 'verification-failure';
  }

  if (verification.unsupportedRequired.length > 0) return 'verification-unsupported';
  if (verification.missingRequired.length > 0) return 'verification-omitted';
  if (verification.passed !== true) return 'verification-failure';
  return null;
};

/** claimed success와 분리된, 검증으로 뒷받침된 성공. */
export const gradeTaskSuccess = (inputs: Inputs): TaskSuccessGrade => {
  const failureCategory = firstFailure(inputs);
  const claimed = inputs.trace.claimedSuccess;
  const claimCounted = claimed === true || claimed === false;

  return {
    taskSucceeded: failureCategory === null,
    falseSuccess: claimed === true && inputs.verification.passed !== true,
    claimCounted,
    failureCategory,
  };
};
