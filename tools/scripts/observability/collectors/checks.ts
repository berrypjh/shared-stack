import {
  sanitizeExcerpt,
  VERIFICATION_MEANING,
  type VerificationObservation,
  verificationObservationSchema,
  type VerificationStatus,
} from '@berrypjh/observability-contracts';

import { COMMANDS, type CommandSpec } from '../registry';

import { type Exec, executionOf } from './exec';

type VerificationCommand = Extract<CommandSpec, { domain: 'verification' }>;

export type CheckSpec = {
  commandId: string;
  kind: VerificationCommand['kind'];
  scope: string;
  argv: readonly string[];
};

/** registry 의 verification 명령 전부. 여기서 argv 를 새로 만들지 않는다. */
export const CHECKS: CheckSpec[] = COMMANDS.flatMap((command) =>
  command.domain === 'verification'
    ? [{ commandId: command.id, kind: command.kind, scope: command.scope, argv: command.argv }]
    : [],
);

type CheckInput = { spec: CheckSpec; exec: Exec; workspaceRoot: string; timeoutMs: number };

const observation = (
  spec: CheckSpec,
  status: VerificationStatus,
  fields: {
    exitCode: number | null;
    durationMs: number | null;
    reason: string | null;
    excerpt: string | null;
  },
): VerificationObservation => {
  const meaning = VERIFICATION_MEANING[status];
  return verificationObservationSchema.parse({
    id: spec.commandId,
    domain: 'verification',
    scope: spec.scope,
    kind: spec.kind,
    status,
    availability: meaning.availability,
    outcome: meaning.outcome,
    exitCode: fields.exitCode,
    durationMs: fields.durationMs,
    reason: fields.reason,
    evidence: [
      {
        source: 'command',
        commandId: spec.commandId,
        exitCode: fields.exitCode,
        excerpt: fields.excerpt,
      },
    ],
  });
};

/**
 * lint·typecheck·build 명령 하나를 registry argv 로 실행한다. 원본 5상태를 보존하고, 실행하지
 * 못했거나 signal 로 끊긴 명령은 pass·fail 로 바꾸지 않고 이유와 함께 not-run 으로 둔다.
 * build 가 통과해도 typecheck 결과가 되지 않는다 — 명령마다 자기 kind 만 가진다.
 */
export const collectCheck = async ({
  spec,
  exec,
  workspaceRoot,
  timeoutMs,
}: CheckInput): Promise<VerificationObservation> => {
  let result;
  try {
    result = await exec(spec.argv, { cwd: workspaceRoot, timeoutMs });
  } catch (error) {
    const reason = sanitizeExcerpt(`실행하지 못했다: ${(error as Error).message}`, 400);
    return observation(spec, 'not-run', {
      exitCode: null,
      durationMs: null,
      reason,
      excerpt: null,
    });
  }
  const execution = executionOf(result, timeoutMs);
  if (execution.status === 'cancelled') {
    return observation(spec, 'not-run', {
      exitCode: null,
      durationMs: result.wallMs,
      reason: execution.reason,
      excerpt: execution.excerpt,
    });
  }
  const status: VerificationStatus =
    execution.status === 'completed'
      ? 'passed'
      : execution.status === 'timeout'
        ? 'timeout'
        : 'failed';
  return observation(spec, status, {
    exitCode: execution.exitCode,
    durationMs: result.wallMs,
    reason: null,
    excerpt: execution.excerpt,
  });
};
