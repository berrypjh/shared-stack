import {
  type ConsumerEvalTask,
  didPass,
  type Trace,
  type VerificationKind,
  wasInvoked,
} from '../runner/schema';

export type VerificationGrade = {
  requiredKinds: VerificationKind[];
  invokedKinds: VerificationKind[];
  missingRequired: VerificationKind[];
  failedRequired: VerificationKind[];
  /** repository/harness가 지원하지 않아 실행 자체가 불가능했던 required check. */
  unsupportedRequired: VerificationKind[];
  /** 실행된 required check 비율. required가 없으면 null. */
  invocationRate: number | null;
  /** required가 전부 실행되고 전부 통과했을 때만 true. */
  passed: boolean | null;
};

export const gradeVerification = (task: ConsumerEvalTask, trace: Trace): VerificationGrade => {
  const requiredKinds = task.verification.filter((v) => v.required).map((v) => v.kind);
  const runs = new Map(trace.verification.map((v) => [v.kind, v]));

  const statusOf = (kind: VerificationKind) => runs.get(kind);
  const missingRequired = requiredKinds.filter((k) => {
    const run = statusOf(k);
    return !run || (!wasInvoked(run) && run.status !== 'unsupported');
  });
  const unsupportedRequired = requiredKinds.filter((k) => statusOf(k)?.status === 'unsupported');
  const failedRequired = requiredKinds.filter((k) => {
    const run = statusOf(k);
    return run !== undefined && wasInvoked(run) && !didPass(run);
  });

  const invoked = requiredKinds.filter((k) => {
    const run = statusOf(k);
    return run !== undefined && wasInvoked(run);
  });

  return {
    requiredKinds,
    invokedKinds: trace.verification.filter(wasInvoked).map((v) => v.kind),
    missingRequired,
    failedRequired,
    unsupportedRequired,
    invocationRate: requiredKinds.length === 0 ? null : invoked.length / requiredKinds.length,
    passed:
      requiredKinds.length === 0
        ? null
        : missingRequired.length === 0 &&
          failedRequired.length === 0 &&
          unsupportedRequired.length === 0,
  };
};
