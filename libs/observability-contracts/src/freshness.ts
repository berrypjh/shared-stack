import { UNKNOWN } from './primitives.js';
import type { RunMetadata } from './run.js';

export type Freshness = { status: 'fresh' | 'stale' | 'unknown'; reason: string };

const short = (sha: string) => sha.slice(0, 7);

/** 보고 있는 run 이 기대한 source 에서 나왔는지. 어느 쪽이든 모르면 fresh 로 치지 않는다. */
export const assessFreshness = (
  metadata: Pick<RunMetadata, 'source'>,
  expectedSha: string,
): Freshness => {
  const actual = metadata.source.sha;
  if (actual === UNKNOWN) return { status: 'unknown', reason: 'run 의 source SHA 를 모릅니다' };
  if (expectedSha === UNKNOWN) return { status: 'unknown', reason: '비교할 기준 SHA 를 모릅니다' };
  if (actual === expectedSha) return { status: 'fresh', reason: `source ${short(actual)}` };
  return {
    status: 'stale',
    reason: `run source ${short(actual)} 이 기준 ${short(expectedSha)} 과 다릅니다`,
  };
};
