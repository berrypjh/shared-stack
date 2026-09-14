import type { ChangedFile, ToolCall, VerificationRun } from '../runner/schema';

import type { VerificationPlan } from './policy';

/**
 * Bounded verification + minimal repair loop.
 *
 * 정책: 작은 check부터 실행하고, required check가 실패하면 거기서 멈춘다.
 * repair hook이 없으면(D4) 관찰만 하고 자동 수정하지 않는다.
 */

/**
 * repair 시도 상한. **engineering guardrail이지 업계 표준이 아니다.**
 * 무한 loop를 막고 repair 비용을 유한하게 유지하려고 임의로 2를 골랐다.
 */
export const DEFAULT_REPAIR_LIMIT = 2;

export type RepairRequest = {
  failure: VerificationRun;
  plan: VerificationPlan;
  attempt: number;
};

/** null이면 agent가 수리를 포기했다는 뜻 — 빈 수정으로 위장하지 않는다. */
export type RepairResult = {
  changedFiles: ChangedFile[];
  inputTokens: number | null;
  toolCalls: ToolCall[];
} | null;

export type RepairHook = (request: RepairRequest) => Promise<RepairResult>;

export type LoopStop =
  | 'all-passed'
  | 'required-failed'
  | 'required-unsupported'
  | 'repair-declined'
  | 'repair-exhausted'
  | 'repeated-failure';

export type LoopOptions = {
  plans: VerificationPlan[];
  execute: (plan: VerificationPlan, attempt: number) => Promise<VerificationRun>;
  /** D4는 주지 않는다(observation only). D5에서만 준다. */
  repair?: RepairHook;
  applyRepair?: (files: ChangedFile[]) => Promise<void>;
  maxRepairAttempts?: number;
};

export type LoopResult = {
  runs: VerificationRun[];
  repairAttempts: number;
  /** repair를 시도하지 않았으면 null. */
  repairSucceeded: boolean | null;
  repeatedFailures: number;
  /** executor가 토큰을 보고하지 않으면 null. */
  repairTokens: number | null;
  repairToolCalls: ToolCall[];
  stoppedBecause: LoopStop;
};

const skipped = (plan: VerificationPlan, reason: string): VerificationRun => ({
  kind: plan.kind,
  required: plan.required,
  status: 'not-run',
  command: null,
  exitCode: null,
  durationMs: null,
  attempt: 0,
  failureFingerprint: null,
  excerpt: reason,
});

export const runVerificationLoop = async ({
  plans,
  execute,
  repair,
  applyRepair,
  maxRepairAttempts = DEFAULT_REPAIR_LIMIT,
}: LoopOptions): Promise<LoopResult> => {
  const runs: VerificationRun[] = [];
  const repairToolCalls: ToolCall[] = [];
  let repairAttempts = 0;
  let repeatedFailures = 0;
  let repairTokens: number | null = null;
  let stoppedBecause: LoopStop = 'all-passed';

  const addTokens = (value: number | null) => {
    if (value === null) return;
    repairTokens = (repairTokens ?? 0) + value;
  };

  for (const [index, plan] of plans.entries()) {
    if (stoppedBecause !== 'all-passed') {
      runs.push(skipped(plan, 'skipped: an earlier required check did not pass'));
      continue;
    }

    let run = await execute(plan, 1);
    runs.push(run);

    if (run.status === 'passed') continue;
    if (!plan.required) continue;

    if (run.status === 'unsupported') {
      stoppedBecause = 'required-unsupported';
      continue;
    }

    if (!repair) {
      stoppedBecause = 'required-failed';
      continue;
    }

    const seen = new Set<string>([run.failureFingerprint ?? 'unknown']);
    let repaired = false;

    for (let attempt = 1; attempt <= maxRepairAttempts; attempt += 1) {
      const result = await repair({ failure: run, plan, attempt });
      if (!result) {
        stoppedBecause = 'repair-declined';
        break;
      }

      repairAttempts += 1;
      addTokens(result.inputTokens);
      repairToolCalls.push(...result.toolCalls);
      await applyRepair?.(result.changedFiles);

      // 가장 작은 실패 check만 다시 돌린다.
      run = await execute(plan, attempt + 1);
      runs.push(run);

      if (run.status === 'passed') {
        repaired = true;
        break;
      }

      const fingerprint = run.failureFingerprint ?? 'unknown';
      if (seen.has(fingerprint)) {
        // 같은 실패가 반복되면 같은 수리를 또 하지 않는다.
        repeatedFailures += 1;
        stoppedBecause = 'repeated-failure';
        break;
      }
      seen.add(fingerprint);
    }

    if (!repaired && stoppedBecause === 'all-passed') stoppedBecause = 'repair-exhausted';
    if (repaired && index === plans.length - 1) stoppedBecause = 'all-passed';
  }

  return {
    runs,
    repairAttempts,
    repairSucceeded: repairAttempts === 0 ? null : stoppedBecause === 'all-passed',
    repeatedFailures,
    repairTokens,
    repairToolCalls,
    stoppedBecause,
  };
};
