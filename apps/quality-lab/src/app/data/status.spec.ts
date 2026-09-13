import { describe, expect, it } from 'vitest';

import {
  emptyState,
  loadErrorState,
  noMatchState,
  notApplicableState,
  notRunState,
  partialState,
  queryErrorState,
  runNotFoundState,
  staleState,
  unsupportedState,
  VIEW_STATE_KINDS,
  VIEW_STATE_LABEL,
} from './status';

describe('공통 상태 모델', () => {
  it('여덟 가지 상태가 각자 색이 아닌 이름을 갖는다', () => {
    expect([...VIEW_STATE_KINDS]).toEqual([
      'empty',
      'loading',
      'error',
      'partial',
      'unsupported',
      'not-applicable',
      'stale',
      'no-match',
    ]);
    for (const kind of VIEW_STATE_KINDS) expect(VIEW_STATE_LABEL[kind]).toBeTruthy();
  });

  it('미수집은 오류가 아니고 수집·export 명령을 준다', () => {
    expect(emptyState()).toEqual({
      kind: 'empty',
      title: '아직 수집한 실행이 없습니다',
      cause:
        'apps/quality-lab/public/observability/index.json 이 없거나 비어 있습니다. 브라우저는 명령을 실행하지 않습니다.',
      commands: [
        'pnpm quality:collect --profile=static --run-id=<새-run-id>',
        'pnpm quality:export --run-id=<새-run-id>',
      ],
    });
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
      'pnpm nx serve @berrypjh/quality-lab',
    ]);
  });

  it('주소의 run 이 index 에 없으면 명시 오류이고 있는 run 을 알려준다', () => {
    const state = runNotFoundState('run-z', ['run-a', 'run-b']);
    expect(state).toMatchObject({ kind: 'error', title: 'run-z 실행이 index 에 없습니다' });
    expect(state.cause).toContain('run-a, run-b');
  });

  it('잘못된 query 는 오류이고 이유를 모두 적는다', () => {
    const state = queryErrorState(['알 수 없는 query: foo', 'run 이 두 번 있습니다']);
    expect(state.kind).toBe('error');
    expect(state.cause).toContain('알 수 없는 query: foo');
    expect(state.cause).toContain('run 이 두 번 있습니다');
  });

  it('partial·stale 은 성공으로 뭉개지 않고 새로 수집하는 명령을 준다', () => {
    expect(partialState('run-a')).toMatchObject({ kind: 'partial' });
    const stale = staleState(
      { status: 'stale', reason: 'run source aaaaaaa 이 기준 bbbbbbb 과 다릅니다' },
      'core',
    );
    expect(stale).toMatchObject({
      kind: 'stale',
      commands: ['pnpm quality:collect --profile=core --run-id=<새-run-id>'],
    });
    expect(stale.cause).toContain('aaaaaaa');
    expect(
      staleState({ status: 'unknown', reason: '비교할 기준 SHA 를 모릅니다' }, 'static').title,
    ).toBe('source 를 기준과 비교할 수 없습니다');
  });

  it('이 run 에 없는 영역은 unsupported 이고 그 영역을 가진 다른 run 을 알려준다', () => {
    const state = unsupportedState({
      section: '패키지 표면',
      runId: 'local-quality-01',
      profile: 'core',
      collectProfile: 'static',
      alternatives: ['local-design-02'],
    });
    expect(state).toMatchObject({
      kind: 'unsupported',
      title: 'local-quality-01 에는 패키지 표면 이 없습니다',
      commands: ['pnpm quality:collect --profile=static --run-id=<새-run-id>'],
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
    expect(state.cause).toBe(
      'eval profile 로 수집한 실행이라 agent-input context 측정 을 담지 않았습니다.',
    );
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
      title: 'local-quality-01 는 tree-shaking 측정 을 실행하지 않았습니다',
      cause:
        '수집기가 실행하지 않은 영역입니다 (not-run) — --only-imports: import 한 report 가 없어 실행하지 않았다. 이 영역을 측정한 공개 실행이 없습니다.',
      commands: ['pnpm quality:collect --profile=core --run-id=<새-run-id>'],
    });
  });

  it('해당 없음·일치 없음도 이유를 가진다', () => {
    expect(notApplicableState('baseline 이 아직 없습니다')).toMatchObject({
      kind: 'not-applicable',
      cause: 'baseline 이 아직 없습니다',
      commands: [],
    });
    expect(noMatchState('실패 · @berrypjh/react-ui')).toMatchObject({
      kind: 'no-match',
      title: '필터와 일치하는 항목이 없습니다',
    });
  });
});
