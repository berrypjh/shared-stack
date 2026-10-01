import type { Freshness } from '@berrypjh/observability-contracts';

/**
 * 화면의 비정상 상태 한 벌. 어느 상태도 숫자나 성공으로 바꾸지 않고, 원인과 로컬에서 실행할
 * 명령을 준다. 명령은 복사할 글일 뿐 — 브라우저가 실행하는 endpoint 가 없다.
 */

export const VIEW_STATE_KINDS = [
  'empty',
  'loading',
  'error',
  'partial',
  'unsupported',
  'stale',
  'no-match',
] as const;

export type ViewStateKind = (typeof VIEW_STATE_KINDS)[number];
export type ViewState = { kind: ViewStateKind; title: string; cause: string; commands: string[] };

/** 색 밖에서 읽히는 상태 이름. */
export const VIEW_STATE_LABEL: Record<ViewStateKind, string> = {
  empty: '미수집',
  loading: '불러오는 중',
  error: '오류',
  partial: '일부만 수집',
  unsupported: '이 실행에 없음',
  stale: '기준과 다른 source',
  'no-match': '일치 없음',
};

/** 평가 묶음을 채우는 수집 profile. 평가 항목(`data/evaluations.ts`)의 `collectProfile` 이다. */
export type CollectProfile = 'core' | 'eval';

/**
 * 수집 명령. profile 마다 한 줄로 수집 · DevHub 로 내보내기까지 하고 run id 는 시각으로 만든다
 * (`tools/scripts/observability/cli.ts` 의 `run`).
 */
export const collectCommand = (profile: CollectProfile) => `pnpm quality:${profile}`;
/** 이미 수집한 실행을 DevHub 로 다시 내보낸다. */
export const exportCommand = (runId: string) => `pnpm quality:export --run-id=${runId}`;
export const SERVE_COMMAND = 'pnpm dev:devhub';

/** 수집한 실행이 없음. 명령은 보고 있는 항목의 영역을 담는 `collectProfile` 로 준다. */
export const emptyState = (collectProfile: CollectProfile): ViewState => ({
  kind: 'empty',
  title: '아직 수집한 실행이 없음',
  cause:
    '공개 index.json 이 없거나 비어 있음. 브라우저는 명령을 실행하지 않음 — 아래 명령을 로컬에서 실행 필요.',
  commands: [collectCommand(collectProfile)],
});

export const loadingState = (what: string): ViewState => ({
  kind: 'loading',
  title: `${what} 불러오는 중`,
  cause: '공개 JSON 을 받아 계약으로 검증하고 있음.',
  commands: [],
});

export type LoadProblem = {
  status: 'missing' | 'invalid' | 'unreachable';
  target?: 'index' | 'run' | 'summary' | 'baseline';
  message: string;
};

const PROBLEM_TEXT = {
  invalid: {
    title: '공개 artifact 가 계약과 맞지 않음',
    cause: '검증하지 못해 화면에 올리지 않았음',
  },
  missing: { title: '공개 파일이 없음', cause: 'index 나 index 가 가리키는 파일이 없음' },
  unreachable: {
    title: '공개 파일을 불러오지 못했음',
    cause: '개발 서버와 파일 경로 확인 필요',
  },
} as const;

/**
 * 공개 파일을 읽지 못함. 실행이 정해졌으면 그 실행을 다시 export 하고, index 부터 못 읽었으면
 * `collectProfile` 로 새로 수집하는 명령을 준다.
 */
export const loadErrorState = (
  problem: LoadProblem,
  runId?: string,
  collectProfile?: CollectProfile,
): ViewState => ({
  kind: 'error',
  title: PROBLEM_TEXT[problem.status].title,
  cause: `${PROBLEM_TEXT[problem.status].cause} — ${problem.message}`,
  commands:
    problem.status === 'unreachable'
      ? [SERVE_COMMAND]
      : runId
        ? [exportCommand(runId)]
        : collectProfile
          ? [collectCommand(collectProfile)]
          : [],
});

export const queryErrorState = (issues: string[]): ViewState => ({
  kind: 'error',
  title: '주소의 필터를 읽을 수 없음',
  cause: issues.join(' · '),
  commands: [],
});

export const runNotFoundState = (runId: string, runIds: string[]): ViewState => ({
  kind: 'error',
  title: `${runId} 실행이 index 에 없음`,
  cause: `공개 index 에 있는 실행: ${runIds.join(', ')}`,
  commands: [],
});

/**
 * 공개 실행 중 이 영역을 담은 것이 없음. 요약을 읽지 못한 실행은 영역을 모르므로 따로 말한다.
 */
export const noAreaRunState = ({
  section,
  collectProfile,
  unreadable,
}: {
  section: string;
  collectProfile: CollectProfile;
  unreadable: string[];
}): ViewState => ({
  kind: 'unsupported',
  title: `이 영역이 있는 공개 실행이 없음 — ${section}`,
  cause:
    `${collectProfile} profile 로 수집한 실행이 있어야 함.` +
    (unreadable.length > 0 ? ` 요약을 읽지 못한 실행: ${unreadable.join(', ')}` : ''),
  commands: [collectCommand(collectProfile)],
});

export const partialState = (runId: string): ViewState => ({
  kind: 'partial',
  title: '일부만 수집된 실행',
  cause: `${runId} 는 partial 상태. 값이 없는 행은 상태 이름과 이유 확인 필요.`,
  commands: [],
});

export const staleState = (freshness: Freshness, collectProfile: CollectProfile): ViewState => ({
  kind: 'stale',
  title:
    freshness.status === 'stale' ? '기준 source 와 다른 실행' : 'source 를 기준과 비교할 수 없음',
  cause: freshness.reason,
  commands: [collectCommand(collectProfile)],
});

export const unsupportedState = ({
  section,
  runId,
  profile,
  collectProfile,
  alternatives,
}: {
  section: string;
  runId: string;
  profile: string;
  collectProfile: CollectProfile;
  /** null 이면 요약으로 다른 실행을 알 수 없어 말하지 않는다. */
  alternatives: string[] | null;
}): ViewState => ({
  kind: 'unsupported',
  title: `${runId} 에는 이 영역이 없음 — ${section}`,
  cause:
    `${profile} profile 로 수집한 실행이라 이 영역을 담지 않았음.` +
    (alternatives === null
      ? ''
      : alternatives.length > 0
        ? ` 이 영역이 있는 실행: ${alternatives.join(', ')}`
        : ' 이 영역이 있는 공개 실행이 없음.'),
  commands: [collectCommand(collectProfile)],
});

/**
 * 실행에 영역은 있지만 수집기가 not-run 으로 남긴 경우. `alternatives` 가 null 이면
 * 다른 실행에 그 측정이 있는지 요약으로는 알 수 없어서 말하지 않는다.
 */
export const notRunState = ({
  section,
  runId,
  reason,
  collectProfile,
  alternatives,
}: {
  section: string;
  runId: string;
  reason: string;
  collectProfile: CollectProfile;
  alternatives: string[] | null;
}): ViewState => ({
  kind: 'unsupported',
  title: `${runId} 는 이 영역을 실행하지 않았음 — ${section}`,
  cause:
    `수집기가 실행하지 않은 영역 (not-run) — ${reason}.` +
    (alternatives === null
      ? ''
      : alternatives.length > 0
        ? ` 이 영역을 측정한 실행: ${alternatives.join(', ')}`
        : ' 이 영역을 측정한 공개 실행이 없음.'),
  commands: [collectCommand(collectProfile)],
});

export const noMatchState = (description: string): ViewState => ({
  kind: 'no-match',
  title: '필터와 일치하는 항목이 없음',
  cause: `적용한 필터: ${description}. 필터를 풀면 원본 행이 다시 보임.`,
  commands: [],
});
