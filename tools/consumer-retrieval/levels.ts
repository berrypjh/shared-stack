import { countOpenAITokens } from '../lib/token-count';

/**
 * Progressive retrieval levels.
 *
 *   L0  package summary        패키지 지형 (심볼 개수·컴포넌트 이름)
 *   L1  symbol candidates      작은 후보 목록 (discover)
 *   L2  exact symbol api       단일 심볼 계약 (getApi)
 *   L3  related token / type   표적 토큰·타입 조회
 *   L4  source fallback        마지막 수단
 *
 * full source나 full bundled `.d.ts`는 첫 단계에 들어가지 않는다.
 */

export const RETRIEVAL_LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4'] as const;
export type RetrievalLevel = (typeof RETRIEVAL_LEVELS)[number];

export const LEVEL_INTENT: Record<RetrievalLevel, string> = {
  L0: 'package summary',
  L1: 'symbol candidates',
  L2: 'exact symbol api',
  L3: 'related token or type',
  L4: 'source fallback',
};

export type RetrievalEvent = {
  level: RetrievalLevel;
  /** Command 01의 logical capability ID. 구체 tool 이름이 아니다. */
  capability: string;
  target: string;
  bytes: number;
  /** 측정하지 않았으면 null — 0으로 기록하지 않는다. */
  contextTokens: number | null;
  outcome: 'ok' | 'not-found';
  duplicate: boolean;
};

export type RetrievalTelemetry = {
  events: RetrievalEvent[];
  levelsUsed: RetrievalLevel[];
  retrievedFiles: number;
  totalBytes: number;
  /** 토큰을 한 번도 측정하지 않았으면 null. */
  totalTokens: number | null;
  duplicateRetrievals: number;
};

export type Recorder = {
  record: (
    event: Omit<RetrievalEvent, 'duplicate' | 'bytes' | 'contextTokens'> & {
      payload: unknown;
      countTokens?: boolean;
    },
  ) => RetrievalEvent;
  telemetry: () => RetrievalTelemetry;
};

/** retrieval 이벤트를 기록한다. 중복은 (level, target) 재방문으로 판정한다. */
export const createRecorder = (): Recorder => {
  const events: RetrievalEvent[] = [];
  const seen = new Set<string>();

  return {
    record: ({ payload, countTokens = true, ...rest }) => {
      const serialized = JSON.stringify(payload ?? null);
      const key = `${rest.level}::${rest.target}`;
      const event: RetrievalEvent = {
        ...rest,
        bytes: serialized.length,
        contextTokens: countTokens ? countOpenAITokens(serialized) : null,
        duplicate: seen.has(key),
      };
      seen.add(key);
      events.push(event);
      return event;
    },
    telemetry: () => {
      const measured = events.filter((e) => e.contextTokens !== null);
      return {
        events,
        levelsUsed: RETRIEVAL_LEVELS.filter((l) => events.some((e) => e.level === l)),
        retrievedFiles: new Set(events.map((e) => e.target)).size,
        totalBytes: events.reduce((sum, e) => sum + e.bytes, 0),
        totalTokens:
          measured.length === 0
            ? null
            : measured.reduce((sum, e) => sum + (e.contextTokens ?? 0), 0),
        duplicateRetrievals: events.filter((e) => e.duplicate).length,
      };
    },
  };
};

export type SourceFallbackReason = 'implementation-detail' | 'debug';

/**
 * L4는 하위 레벨로 풀 수 없을 때만 허용한다.
 * - L2가 `not-found`로 끝났거나
 * - 질문 자체가 구현/디버깅이어서 public API로 답이 안 되는 경우
 */
export const canUseSourceFallback = (
  events: RetrievalEvent[],
  reason?: SourceFallbackReason,
): { allowed: boolean; because: string } => {
  if (reason) return { allowed: true, because: `explicit ${reason} question` };
  const missed = events.find((e) => e.level === 'L2' && e.outcome === 'not-found');
  if (missed)
    return { allowed: true, because: `L2 lookup for ${missed.target} returned not-found` };
  return {
    allowed: false,
    because: 'resolve the symbol through L1/L2 before reading source',
  };
};
