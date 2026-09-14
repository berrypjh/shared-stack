import type { ConsumerEvalTask, Trace } from '../runner/schema';

export const DEFAULT_K = 5;

export type RetrievalGrade = {
  k: number;
  required: string[];
  retrievedCount: number;
  hitsAtK: number;
  /** required evidence가 없으면 null — 0으로 기록하지 않는다. */
  recallAtK: number | null;
  firstHitRank: number | null;
  reciprocalRank: number | null;
  duplicateRetrievals: number;
};

/** ranked evidence ID 목록에 대한 exact-match recall@K / reciprocal rank. */
export const gradeRetrieval = (
  task: ConsumerEvalTask,
  trace: Trace,
  k: number = DEFAULT_K,
): RetrievalGrade => {
  const required = task.expected.requiredEvidence;
  const retrieved = trace.retrieved;
  const topK = new Set(retrieved.slice(0, k));
  const hitsAtK = required.filter((id) => topK.has(id)).length;

  const rank = retrieved.findIndex((id) => required.includes(id));
  const firstHitRank = required.length === 0 || rank < 0 ? null : rank + 1;

  return {
    k,
    required,
    retrievedCount: retrieved.length,
    hitsAtK,
    recallAtK: required.length === 0 ? null : hitsAtK / required.length,
    firstHitRank,
    reciprocalRank: required.length === 0 ? null : firstHitRank === null ? 0 : 1 / firstHitRank,
    duplicateRetrievals: retrieved.length - new Set(retrieved).size,
  };
};
