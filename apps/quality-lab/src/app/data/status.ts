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
  'not-applicable',
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
  'not-applicable': '해당 없음',
  stale: '기준과 다른 source',
  'no-match': '일치 없음',
};

const NEW_RUN = '<새-run-id>';

export const collectCommand = (profile: string, runId = NEW_RUN) =>
  `pnpm quality:collect --profile=${profile} --run-id=${runId}`;
export const exportCommand = (runId = NEW_RUN) => `pnpm quality:export --run-id=${runId}`;
export const SERVE_COMMAND = 'pnpm nx serve @berrypjh/quality-lab';

export const emptyState = (): ViewState => ({
  kind: 'empty',
  title: '아직 수집한 실행이 없습니다',
  cause:
    'apps/quality-lab/public/observability/index.json 이 없거나 비어 있습니다. 브라우저는 명령을 실행하지 않습니다.',
  commands: [collectCommand('static'), exportCommand()],
});

export const loadingState = (what: string): ViewState => ({
  kind: 'loading',
  title: `${what} 불러오는 중입니다`,
  cause: '공개 JSON 을 받아 계약으로 검증하고 있습니다.',
  commands: [],
});

export type LoadProblem = {
  status: 'missing' | 'invalid' | 'unreachable';
  target?: 'index' | 'run' | 'summary';
  message: string;
};

const PROBLEM_TEXT = {
  invalid: {
    title: '공개 artifact 가 계약과 맞지 않습니다',
    cause: '검증하지 못해 화면에 올리지 않았습니다',
  },
  missing: { title: '공개 파일이 없습니다', cause: 'index 나 index 가 가리키는 파일이 없습니다' },
  unreachable: {
    title: '공개 파일을 불러오지 못했습니다',
    cause: '개발 서버와 파일 경로를 확인하세요',
  },
} as const;

export const loadErrorState = (problem: LoadProblem, runId?: string): ViewState => ({
  kind: 'error',
  title: PROBLEM_TEXT[problem.status].title,
  cause: `${PROBLEM_TEXT[problem.status].cause} — ${problem.message}`,
  commands:
    problem.status === 'unreachable'
      ? [SERVE_COMMAND]
      : runId
        ? [exportCommand(runId)]
        : [collectCommand('static'), exportCommand()],
});

export const queryErrorState = (issues: string[]): ViewState => ({
  kind: 'error',
  title: '주소의 필터를 읽을 수 없습니다',
  cause: issues.join(' · '),
  commands: [],
});

export const runNotFoundState = (runId: string, runIds: string[]): ViewState => ({
  kind: 'error',
  title: `${runId} 실행이 index 에 없습니다`,
  cause: `공개 index 에 있는 실행: ${runIds.join(', ')}`,
  commands: [],
});

export const partialState = (runId: string): ViewState => ({
  kind: 'partial',
  title: '일부만 수집된 실행입니다',
  cause: `${runId} 는 partial 상태입니다. 값이 없는 행은 상태 이름과 이유를 확인하세요.`,
  commands: [],
});

export const staleState = (freshness: Freshness, profile: string): ViewState => ({
  kind: 'stale',
  title:
    freshness.status === 'stale'
      ? '기준 source 와 다른 실행입니다'
      : 'source 를 기준과 비교할 수 없습니다',
  cause: freshness.reason,
  commands: [collectCommand(profile)],
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
  collectProfile: string;
  /** null 이면 요약으로 다른 실행을 알 수 없어 말하지 않는다. */
  alternatives: string[] | null;
}): ViewState => ({
  kind: 'unsupported',
  title: `${runId} 에는 ${section} 이 없습니다`,
  cause:
    `${profile} profile 로 수집한 실행이라 ${section} 을 담지 않았습니다.` +
    (alternatives === null
      ? ''
      : alternatives.length > 0
        ? ` 이 영역이 있는 실행: ${alternatives.join(', ')}`
        : ' 이 영역이 있는 공개 실행이 없습니다.'),
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
  collectProfile: string;
  alternatives: string[] | null;
}): ViewState => ({
  kind: 'unsupported',
  title: `${runId} 는 ${section} 을 실행하지 않았습니다`,
  cause:
    `수집기가 실행하지 않은 영역입니다 (not-run) — ${reason}.` +
    (alternatives === null
      ? ''
      : alternatives.length > 0
        ? ` 이 영역을 측정한 실행: ${alternatives.join(', ')}`
        : ' 이 영역을 측정한 공개 실행이 없습니다.'),
  commands: [collectCommand(collectProfile)],
});

export const notApplicableState = (reason: string): ViewState => ({
  kind: 'not-applicable',
  title: '보여줄 값이 없는 영역입니다',
  cause: reason,
  commands: [],
});

export const noMatchState = (description: string): ViewState => ({
  kind: 'no-match',
  title: '필터와 일치하는 항목이 없습니다',
  cause: `적용한 필터: ${description}. 필터를 풀면 원본 행이 다시 보입니다.`,
  commands: [],
});
