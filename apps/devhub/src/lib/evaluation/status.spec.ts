import {
  collectCommand,
  emptyState,
  loadErrorState,
  noMatchState,
  notRunState,
  partialState,
  queryErrorState,
  runNotFoundState,
  staleState,
  unsupportedState,
  VIEW_STATE_KINDS,
  VIEW_STATE_LABEL,
} from './status';

describe('수집 명령', () => {
  it('profile 마다 수집 · 내보내기를 한 번에 하는 한 줄 명령이다', () => {
    expect(collectCommand('core')).toBe('pnpm quality:core');
    expect(collectCommand('eval')).toBe('pnpm quality:eval');
  });
});

describe('공통 상태 모델', () => {
  it('일곱 가지 상태가 각자 색이 아닌 이름을 갖는다', () => {
    expect([...VIEW_STATE_KINDS]).toEqual([
      'empty',
      'loading',
      'error',
      'partial',
      'unsupported',
      'stale',
      'no-match',
    ]);
    for (const kind of VIEW_STATE_KINDS) expect(VIEW_STATE_LABEL[kind]).toBeTruthy();
  });

  it('미수집은 오류가 아니고 보고 있는 영역의 수집 명령을 준다', () => {
    expect(emptyState('core')).toEqual({
      kind: 'empty',
      title: '아직 수집한 실행이 없음',
      cause:
        '공개 index.json 이 없거나 비어 있음. 브라우저는 명령을 실행하지 않음 — 아래 명령을 로컬에서 실행 필요.',
      commands: ['pnpm quality:core'],
    });
  });

  it('index 부터 읽지 못하면 영역의 profile 로 새로 수집하는 명령을 준다', () => {
    expect(
      loadErrorState(
        { status: 'invalid', target: 'index', message: 'runs: required' },
        undefined,
        'eval',
      ).commands,
    ).toEqual(['pnpm quality:eval']);
  });

  it('불러오기 실패는 원인 메시지와 다시 export 하는 명령을 준다', () => {
    const state = loadErrorState(
      { status: 'invalid', target: 'run', message: 'observations: expected array' },
      'run-a',
    );
    expect(state).toMatchObject({
      kind: 'error',
      commands: ['pnpm quality:export --run-id=run-a'],
    });
    expect(state.cause).toContain('observations: expected array');
    expect(loadErrorState({ status: 'unreachable', message: 'Failed to fetch' }).commands).toEqual([
      'pnpm dev:devhub',
    ]);
  });

  it('주소의 run 이 index 에 없으면 명시 오류이고 있는 run 을 알려준다', () => {
    const state = runNotFoundState('run-z', ['run-a', 'run-b']);
    expect(state).toMatchObject({ kind: 'error', title: 'run-z 실행이 index 에 없음' });
    expect(state.cause).toContain('run-a, run-b');
  });

  it('잘못된 query 는 오류이고 이유를 모두 적는다', () => {
    const state = queryErrorState(['알 수 없는 query: foo', 'run 이 두 번 있음']);
    expect(state.kind).toBe('error');
    expect(state.cause).toContain('알 수 없는 query: foo');
    expect(state.cause).toContain('run 이 두 번 있음');
  });

  it('partial·stale 은 성공으로 뭉개지 않고 새로 수집하는 명령을 준다', () => {
    expect(partialState('run-a')).toMatchObject({ kind: 'partial' });
    const stale = staleState({
      freshness: { status: 'stale', reason: 'run source aaaaaaa 이 기준 bbbbbbb 과 다름' },
      runSha: 'a'.repeat(40),
      baseSha: 'b'.repeat(40),
      collectProfile: 'core',
    });
    expect(stale).toMatchObject({
      kind: 'stale',
      title: '지금 코드와 다른 커밋에서 잰 실행',
      commands: ['pnpm quality:core'],
    });
    expect(stale.cause).toBe(
      '이 실행은 aaaaaaa 에서 수집했고, 지금 화면은 bbbbbbb 기준입니다. 두 커밋 사이에 바뀐 코드는 값에 반영되지 않았습니다.',
    );
    const unknown = staleState({
      freshness: { status: 'unknown', reason: '비교할 기준 SHA 를 모름' },
      runSha: 'a'.repeat(40),
      baseSha: 'unknown',
      collectProfile: null,
    });
    expect(unknown).toMatchObject({
      title: 'source 를 기준과 비교할 수 없음',
      cause: '비교할 기준 SHA 를 모름',
      commands: [],
    });
  });

  it('이 run 에 없는 영역은 unsupported 이고 그 영역을 가진 다른 run 을 알려준다', () => {
    const state = unsupportedState({
      section: '패키지 표면',
      runId: 'local-quality-01',
      profile: 'core',
      collectProfile: 'core',
      alternatives: ['local-design-02'],
    });
    expect(state).toMatchObject({
      kind: 'unsupported',
      title: 'local-quality-01 에는 이 영역이 없음 — 패키지 표면',
      commands: ['pnpm quality:core'],
    });
    expect(state.cause).toContain('local-design-02');
  });

  it('요약으로 다른 실행을 알 수 없으면 대안 문장을 쓰지 않는다', () => {
    const state = unsupportedState({
      section: 'agent-input context 측정',
      runId: 'local-eval-02',
      profile: 'eval',
      collectProfile: 'eval',
      alternatives: null,
    });
    expect(state.cause).toBe('eval profile 로 수집한 실행이라 이 영역을 담지 않았음.');
  });

  it('수집기가 실행하지 않은 영역은 profile 탓이 아니라 not-run 이유를 준다', () => {
    const state = notRunState({
      section: 'tree-shaking 측정',
      runId: 'local-quality-01',
      reason: '--only-imports: import 한 report 가 없어 실행하지 않았다',
      collectProfile: 'core',
      alternatives: [],
    });
    expect(state).toEqual({
      kind: 'unsupported',
      title: 'local-quality-01 는 이 영역을 실행하지 않았음 — tree-shaking 측정',
      cause:
        '수집기가 실행하지 않은 영역 (not-run) — --only-imports: import 한 report 가 없어 실행하지 않았다. 이 영역을 측정한 공개 실행이 없음.',
      commands: ['pnpm quality:core'],
    });
  });

  it('일치 없음도 이유를 가진다', () => {
    expect(noMatchState('실패 · @berrypjh/react-ui')).toMatchObject({
      kind: 'no-match',
      title: '필터와 일치하는 항목이 없음',
    });
  });
});
