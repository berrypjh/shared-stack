import { runIdSchema } from '@berrypjh/observability-contracts';

import { parseQualityArgs, QualityArgsError } from './audit';

/**
 * `pnpm quality` 의 두 가지 일.
 *
 *   pnpm quality --base-url=http://localhost:4300 [--run-id=<id>]   # 접근성 audit 을 새 run 으로 수집
 *   pnpm quality --run-id=<id> [--replace-baseline]                  # 이미 export 한 run 을 baseline 으로 가리킴
 */

export const QUALITY_USAGE = [
  'usage: pnpm quality --base-url=http://localhost:4300 [--run-id=<id>]',
  '       pnpm quality --run-id=<export 한 run id> [--replace-baseline]',
].join('\n');

export type QualityCommand =
  | { mode: 'audit'; baseUrl: string; runId: string }
  | { mode: 'baseline'; runId: string; replace: boolean };

const FLAG = /^--(base-url|run-id)=(.+)$/;

export const parseQualityCommand = (argv: string[], now: () => Date): QualityCommand => {
  const seen = new Set<string>();
  for (const arg of argv) {
    const name = arg === '--replace-baseline' ? arg : FLAG.exec(arg)?.[1];
    if (!name) throw new QualityArgsError(`알 수 없는 인자: ${arg}\n${QUALITY_USAGE}`);
    if (seen.has(name)) throw new QualityArgsError(`${name} 이 두 번 있습니다\n${QUALITY_USAGE}`);
    seen.add(name);
  }

  if (seen.has('base-url')) {
    if (seen.has('--replace-baseline')) {
      throw new QualityArgsError(
        `--replace-baseline 은 audit 과 함께 쓰지 않습니다\n${QUALITY_USAGE}`,
      );
    }
    return { mode: 'audit', ...parseQualityArgs(argv, now) };
  }

  const runId = argv.map((arg) => FLAG.exec(arg)).find((match) => match?.[1] === 'run-id')?.[2];
  if (!runId)
    throw new QualityArgsError(`--base-url 또는 --run-id 가 필요합니다\n${QUALITY_USAGE}`);
  if (!runIdSchema.safeParse(runId).success) {
    throw new QualityArgsError(`--run-id 는 소문자 kebab-case 여야 합니다\n${QUALITY_USAGE}`);
  }
  return { mode: 'baseline', runId, replace: seen.has('--replace-baseline') };
};
