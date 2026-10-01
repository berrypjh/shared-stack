import { screen, waitFor, within } from '@testing-library/react';

import { evalArtifact, offlineEvalRun, RN_UNSUPPORTED } from '@/test/evaluation/evals';
import { renderEvaluation } from '@/test/evaluation/render';
import { publicFiles, qualityArtifact } from '@/test/evaluation/runs';

const files = () => publicFiles([qualityArtifact('run-quality'), evalArtifact('run-eval')]);

const SCORECARD = '핵심 지표 — smoke-scripted';
const main = () => within(screen.getByRole('main'));
const table = (name: string) => main().getByRole('table', { name });
const bodyRows = (name: string) => within(table(name)).getAllByRole('row').slice(1);
const rowIn = (tableName: string, name: RegExp) =>
  within(table(tableName)).getByRole('row', { name });
const cellsOf = (tableName: string, header: string) =>
  Array.from(
    within(table(tableName))
      .getByRole('rowheader', { name: header })
      .closest('tr')
      ?.querySelectorAll('td') ?? [],
    (cell) => cell.textContent,
  );

describe('소비자 평가 · 컨텍스트', () => {
  it('실행 요약은 누가 무엇을 풀었는지 한 문장과 주의를 고르기와 관계없이 보인다', async () => {
    const { user } = renderEvaluation('/evaluation/eval-scorecard?run=run-eval', files());
    const summary = await main().findByRole('region', { name: '이 실행' });
    expect(summary.textContent).toContain('모델 없이 정해 둔 결과로');
    expect(summary.textContent).toContain('점수는 모델 성능이 아님');
    expect(summary.textContent).toContain('모델을 호출하지 않은 실행');
    expect(summary.textContent).toContain('smoke-scripted');
    await user.click(main().getByRole('button', { name: 'Consumer Docs' }));
    expect(main().getByRole('region', { name: '이 실행' }).textContent).toContain('smoke-scripted');
    expect(table(SCORECARD)).toBeTruthy();
  });

  it('이 화면이 답하는 질문을 데이터보다 먼저 보인다', async () => {
    renderEvaluation('/evaluation/eval-scorecard?run=run-eval', files());
    const guide = await main().findByRole('region', { name: '이 화면이 답하는 질문' });
    expect(guide.textContent).toContain('해냈나');
  });

  it('핵심 지표는 한국어 이름과 원본 분자/분모 · n 그대로다', async () => {
    renderEvaluation('/evaluation/eval-scorecard?run=run-eval', files());
    await main().findByRole('table', { name: SCORECARD });
    expect(
      within(table(SCORECARD))
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual([
      'variant',
      '검증까지 통과한 성공률',
      '플랫폼 · 패키지 선택 정확도',
      '필요한 근거를 찾은 비율',
      '입력 토큰 (중앙값)',
      '거짓 성공 주장 비율',
    ]);
    const executed = rowIn(SCORECARD, /^Progress/);
    expect(within(executed).getByRole('rowheader').textContent).toBe(
      'Progressive + Repairprogressive-with-repair',
    );
    expect(executed.textContent).toContain('50.0% (2/4)');
    expect(executed.textContent).toContain('83.3% (n=3)');
    expect(executed.textContent).toContain('1,000 tokens (n=4)');
    expect(executed.textContent).toContain('33.3% (1/3)');
  });

  it('실패 원인은 한국어 이름과 코드로, 시도가 없는 원인은 숨긴다 · 세부 지표는 접혀 있다', async () => {
    renderEvaluation('/evaluation/eval-scorecard?run=run-eval', files());
    await main().findByRole('table', { name: SCORECARD });
    const failures = table('실패 원인 — smoke-scripted');
    for (const row of within(failures).getAllByRole('row').slice(1)) {
      expect(
        within(row)
          .getAllByRole('cell')
          .some((cell) => cell.textContent !== '0'),
      ).toBe(true);
    }
    expect(main().getByText(/시도가 없는 원인 \d+개는 숨김/)).toBeTruthy();
    const details = main()
      .getByText(/^세부 지표 \d+개/)
      .closest('details');
    expect(details?.open).toBe(false);
    expect(
      within(details as HTMLElement).getByRole('table', { name: '세부 지표 — smoke-scripted' }),
    ).toBeTruthy();
  });

  it('거짓 성공 차트는 주장한 시도 분모를 표와 같은 값으로 그린다', async () => {
    renderEvaluation('/evaluation/eval-scorecard?run=run-eval', files());
    const figure = await main().findByRole('figure', {
      name: '거짓 성공 주장 비율 — smoke-scripted',
    });
    const description = document.getElementById(figure.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent).toContain('해냈는지 아닌지를 분명히 말한 시도만 센다');
    expect(description?.textContent).toContain('낮을수록 좋음');
    const bars = within(figure).getAllByRole('listitem');
    expect(bars.map((bar) => [bar.dataset.key, bar.lastElementChild?.textContent])).toEqual([
      ['consumer-docs', '100.0% (3/3)'],
      ['progressive-with-repair', '33.3% (1/3)'],
    ]);
    const rows = bodyRows(SCORECARD);
    bars.forEach((bar, index) => {
      expect(rows[index].textContent).toContain(bar.lastElementChild?.textContent);
    });
    expect(bars[1].dataset.value).toBe(String(1 / 3));
  });

  it('context 는 initial·routed·scenario·실제 입력을 panel 로 나눈다', async () => {
    const { user, location } = renderEvaluation('/evaluation/context-tokens?run=run-eval', files());
    await main().findByRole('table', { name: 'Context — variant-initial' });
    expect(bodyRows('Context — variant-initial')).toHaveLength(2);

    await user.click(main().getByRole('button', { name: '플랫폼별 컨텍스트' }));
    expect(location()).toBe('/evaluation/context-tokens?run=run-eval&panel=routed');
    for (const platform of ['웹', 'React Native']) {
      expect(
        bodyRows(`Context — ${platform}`).map(
          (row) => within(row).getByRole('rowheader').textContent,
        ),
      ).toEqual(['progressive-with-repair']);
    }

    await user.click(main().getByRole('button', { name: '패키지 시나리오' }));
    const missing = rowIn('Context — design-tokens', /^agents\+catalog/);
    expect(missing.textContent).toContain('값 없음 — 없는 입력: libs/design-tokens/dist/AGENTS.md');
  });

  it('variant 는 측정 당시 정의의 이름 · 설명을, 시나리오는 이어 붙인 파일을 보이고 측정 조건은 한 줄이다', async () => {
    const definition = {
      label: 'Consumer Docs',
      description: 'AGENTS.consumer.md 중심의 compact 컨텍스트.',
    };
    const run = evalArtifact('run-def');
    const withDefinition = {
      ...run,
      contexts: run.contexts.map((item) =>
        item.id === 'context.variant-initial.consumer-docs.openai' ? { ...item, definition } : item,
      ),
    };
    const { user } = renderEvaluation(
      '/evaluation/context-tokens?run=run-def',
      publicFiles([withDefinition]),
    );
    await main().findByRole('table', { name: 'Context — variant-initial' });
    const row = rowIn('Context — variant-initial', /^Consumer Docs/);
    expect(within(row).getByRole('rowheader').textContent).toBe('Consumer Docsconsumer-docs');
    expect(row.textContent).toContain(definition.description);
    expect(main().getByText(/^openai-tiktoken-local · /)).toBeTruthy();

    await user.click(main().getByRole('button', { name: '패키지 시나리오' }));
    expect(rowIn('Context — react-ui', /^baseline/).textContent).toContain('package.json');
  });

  it('실제 입력은 무엇 · 실행 · 결과 안내를 보이고, live 가 아닌 실행에는 없다고 쓰고 live 명령을 준다', async () => {
    const { user } = renderEvaluation('/evaluation/context-tokens?run=run-eval', files());
    await main().findByRole('table', { name: 'Context — variant-initial' });
    await user.click(main().getByRole('button', { name: '실제 입력' }));

    const guide = main().getByRole('region', { name: '실제 입력 안내' });
    expect(
      within(guide)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(['무엇인가', '어떻게 실행하나', '결과는 어떻게 나오나']);
    expect(guide.textContent).toContain('ANTHROPIC_API_KEY');
    expect(
      within(within(guide).getByRole('table', { name: '평가 돌리는 명령' }))
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(['모델 없이 확인', 'Claude', 'OpenAI', '로컬 LLM (Ollama)']);
    expect(
      within(guide).getByText('pnpm quality:eval:live --provider=local --model=<모델>'),
    ).toBeTruthy();

    const notice = main().getByRole('region', {
      name: 'run-eval 에는 실제 입력이 없음 — agent-input context 측정',
    });
    expect(notice.dataset.state).toBe('unsupported');
    expect(
      within(notice).getByText('pnpm quality:eval:live --provider=<제공자> --model=<모델>'),
    ).toBeTruthy();
  });

  it('live 실행의 실제 입력은 variant 로 묶여 과제 · trial 마다 한 행이고, 뺀 variant 는 이유가 남는다', async () => {
    const definition = { label: 'Consumer Docs', description: '작은 컨텍스트.' };
    const usage = {
      scope: 'agent-input',
      provider: 'anthropic-messages-usage',
      tokenModel: 'claude-test',
      tokenizerVersion: null,
      tokenizerVersionReason: 'API 가 보고한 사용량 — tokenizer 버전을 알 수 없음',
      contentConstruction: 'executor-reported',
      files: [],
      missingPaths: [],
    };
    const run = evalArtifact('run-live');
    const live = {
      ...run,
      contexts: [
        ...run.contexts,
        {
          ...usage,
          id: 'context.agent-input.consumer-docs-web-button-loading-1.anthropic',
          subject: 'consumer-docs::web-button-loading::1',
          definition,
          availability: 'available',
          chars: null,
          tokens: 48210,
          reason: null,
          reasonCode: null,
        },
        {
          ...usage,
          id: 'context.agent-input.full-source.anthropic',
          subject: 'full-source',
          definition: { label: 'Full Source', description: '전체 소스.' },
          availability: 'unavailable',
          chars: null,
          tokens: null,
          reason: '컨텍스트 한도 초과 — 첫 메시지 387,000 토큰 > 한도 200,000',
          reasonCode: 'not-collected',
        },
      ],
    };
    renderEvaluation(
      '/evaluation/context-tokens?run=run-live&panel=agent-input',
      publicFiles([live]),
    );
    const measured = await main().findByRole('table', { name: 'Context — Consumer Docs' });
    expect(within(measured).getByRole('rowheader').textContent).toBe(
      'web-button-loading · trial 1',
    );
    expect(measured.textContent).toContain('48,210 tokens');
    const skipped = main().getByRole('table', { name: 'Context — Full Source' });
    expect(within(skipped).getByRole('rowheader').textContent).toBe('실행하지 않음');
    expect(skipped.textContent).toContain('컨텍스트 한도 초과');
  });

  it('context report 를 import 하지 못한 평가 실행은 그 이유를 쓰고 다른 실행을 추측하지 않는다', async () => {
    renderEvaluation(
      '/evaluation/context-tokens?run=run-no-context&panel=routed',
      publicFiles([
        qualityArtifact('run-quality'),
        evalArtifact('run-no-context', { contexts: [] }),
      ]),
    );
    const notice = await main().findByText(
      'run-no-context 는 이 영역을 실행하지 않았음 — variant-routed context 측정',
    );
    const section = notice.closest('section');
    expect(section?.textContent).toContain('context report import missing — context.json 이 없다');
    expect(section?.textContent).not.toContain('run-quality');
  });

  it('주소의 #context 대상 행으로 포커스를 옮긴다', async () => {
    renderEvaluation(
      '/evaluation/context-tokens?run=run-eval#context-context.variant-initial.consumer-docs.openai',
      files(),
    );
    await main().findByRole('table', { name: 'Context — variant-initial' });
    const row = rowIn('Context — variant-initial', /^consumer-docs/);
    await waitFor(() => expect(document.activeElement).toBe(row));
  });

  it('플랫폼 선택은 정답 4행 × 고른 것 5열이고 둘 다 · 보고 안 함을 숨기지 않는다', async () => {
    renderEvaluation('/evaluation/eval-routing?run=run-eval', files());
    const resolver = await main().findByRole('table', {
      name: '플랫폼 선택 — 규칙 기반 판정기',
    });
    expect(
      within(resolver)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['정답 ↓ · 고른 것 →', '웹', 'React Native', 'UI 없음', '둘 다', '보고 안 함']);
    const rows = within(resolver).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
      '웹',
      'React Native',
      '둘 다',
      'UI 없음',
    ]);
    expect(
      within(rows[2])
        .getAllByRole('cell')
        .map((cell) => cell.dataset.count),
    ).toEqual(['0', '0', '0', '1', '1']);
    expect(main().getByText('37번 중 36번 맞음 · 보고 안 함 1번 · 정확도 97.3%')).toBeTruthy();
    expect(table('플랫폼 선택 — Consumer Docs')).toBeTruthy();
    const failure = within(table('플랫폼을 틀렸거나 보고하지 않은 시도'))
      .getAllByRole('row', { name: /web-textfield-helper · 1번째/ })
      .find((row) => row.textContent?.includes('Consumer Docs'));
    expect(failure?.textContent).toContain('고른 플랫폼 · 패키지를 보고하지 않음');
  });

  it('근거 찾기는 variant 마다 찾은 수 / 필요한 수 · 순서 · 다시 가져옴을 보이고 필요한 근거가 없으면 N/A 다', async () => {
    const name = '근거 찾기 — Consumer Docs';
    renderEvaluation('/evaluation/eval-retrieval?run=run-eval&variant=consumer-docs', files());
    await main().findByRole('table', { name });
    expect(rowIn(name, /no-ui-date-format · 1번째/).textContent).toContain(
      'N/A — 필요한 근거 없음',
    );
    expect(cellsOf(name, 'web-textfield-helper · 1번째').slice(0, 3)).toEqual([
      '2 / 4 (50.0%)',
      '2번째',
      '근거 2 · 조회 1',
    ]);
  });

  it('검증은 종류 × 결과로 세고 지원 안 함을 통과로 바꾸지 않는다', async () => {
    renderEvaluation(
      '/evaluation/eval-verification?run=run-eval&variant=progressive-with-repair',
      files(),
    );
    const counts = '검증 결과 수 — Progressive + Repair';
    await main().findByRole('table', { name: counts });
    expect(cellsOf(counts, '테스트')).toEqual(['3', '0', '0', '1', '0']);
    const region = main().getByRole('region', { name: 'variant 별 검증' });
    expect(region.textContent).toContain('평가 도구가 검증을 직접 돌림');
    expect(region.textContent).toContain('수정 단계가 있지만 실행기가 지원하지 않아 시도하지 못함');
    const rn = rowIn('시도 별 검증 — Progressive + Repair', /rn-use-theme-getcolor · 1번째/);
    expect(rn.textContent).toContain('테스트 지원 안 함');
    expect(rn.textContent).toContain(RN_UNSUPPORTED);
  });

  it('검증 단계가 없는 variant 는 결과 수 표 없이 그렇다고 쓴다', async () => {
    renderEvaluation('/evaluation/eval-verification?run=run-eval&variant=consumer-docs', files());
    expect(await main().findByText(/검증 단계가 없음 — 실행기가 보고한 것만 있음/)).toBeTruthy();
    expect(main().queryByRole('table', { name: '검증 결과 수 — Consumer Docs' })).toBeNull();
  });

  it('variant 고르기는 키보드로 바꾸고 원본 값을 다시 계산하지 않는다고 알린다', async () => {
    const { user, location } = renderEvaluation('/evaluation/eval-scorecard?run=run-eval', files());
    await main().findByRole('table', { name: SCORECARD });
    main().getByRole('button', { name: 'Consumer Docs' }).focus();
    await user.keyboard('{Enter}');
    expect(location()).toBe('/evaluation/eval-scorecard?run=run-eval&variant=consumer-docs');
    expect(bodyRows(SCORECARD)).toHaveLength(1);
    expect(
      main().getByText(
        'variant 2개 중 1개를 보는 중 — 값은 variant 별 원본이고 다시 계산하지 않음',
      ),
    ).toBeTruthy();
  });

  it('variant 가 없는 offline 평가도 규칙 기반 판정기 결과를 보이고 고르기 불일치로 오해하지 않는다', async () => {
    const offline = { ...evalArtifact('run-offline'), evals: [offlineEvalRun()] };
    renderEvaluation('/evaluation/eval-routing?run=run-offline', publicFiles([offline]));
    expect(
      await main().findByRole('table', { name: '플랫폼 선택 — 규칙 기반 판정기' }),
    ).toBeTruthy();
    expect(main().queryByText('필터와 일치하는 항목이 없음')).toBeNull();
  });

  it('variant 가 없는 offline 평가의 성적표는 실행하지 않은 이유와 실행 요약을 쓴다', async () => {
    const offline = { ...evalArtifact('run-offline'), evals: [offlineEvalRun()] };
    renderEvaluation('/evaluation/eval-scorecard?run=run-offline', publicFiles([offline]));
    expect(
      await main().findByText('eval:offline 는 이 영역을 실행하지 않았음 — variant 별 지표'),
    ).toBeTruthy();
    expect(main().getByRole('region', { name: '이 실행' }).textContent).toContain(
      '평가 요약을 읽지 못해',
    );
  });

  it('variant 가 없는 검증은 variant 를 준 summary 의 import 상태를 이유로 쓴다', async () => {
    const base = offlineEvalRun();
    const evalRun = {
      ...base,
      import: { ...base.import, traces: { status: 'missing', reason: 'traces.jsonl 이 없음' } },
    };
    const offline = { ...evalArtifact('run-offline'), evals: [evalRun] };
    renderEvaluation('/evaluation/eval-verification?run=run-offline', publicFiles([offline]));
    const region = await main().findByRole('region', { name: 'variant 별 검증' });
    expect(region.textContent).toContain(
      'summary report import not-run — executor 를 돌리지 않은 offline 산출물',
    );
    expect(region.textContent).not.toContain('traces report import');
  });

  it('trace 를 읽지 못한 근거 찾기는 traces 의 import 상태를 이유로 쓴다', async () => {
    const base = offlineEvalRun();
    const evalRun = {
      ...base,
      import: { ...base.import, traces: { status: 'missing', reason: 'traces.jsonl 이 없음' } },
    };
    const offline = { ...evalArtifact('run-offline'), evals: [evalRun] };
    renderEvaluation('/evaluation/eval-retrieval?run=run-offline', publicFiles([offline]));
    const region = await main().findByRole('region', { name: '시도 별 근거 찾기' });
    expect(region.textContent).toContain('traces report import missing — traces.jsonl 이 없음');
  });

  it('평가 결과가 없는 실행은 unsupported 다', async () => {
    renderEvaluation('/evaluation/eval-scorecard?run=run-quality', files());
    expect(await main().findByText('run-quality 에는 이 영역이 없음 — 평가 결과')).toBeTruthy();
  });
});

describe('소비자 평가 — 모델 이름', () => {
  /** 로컬 LLM 으로 돌린 live 평가. 고정 입력 주의는 없고, 한도로 뺀 variant 가 있다. */
  const liveArtifact = () => {
    const base = evalArtifact('run-local');
    const [run] = base.evals;
    return {
      ...base,
      evals: [
        {
          ...run,
          origin: { ...run.origin, executor: 'live-local', model: 'qwen3:14b' },
          executorClass: 'live',
          notices: run.notices.filter((notice) => notice.code === 'no-baseline'),
          skippedVariants: [
            {
              variant: 'full-source',
              label: 'Full Source',
              reason: '컨텍스트 한도 초과 — 첫 메시지 약 387,000 토큰(추정) > 한도 32,768',
            },
          ],
        },
      ],
    };
  };

  it('실행 요약 · 차트 제목 · 상세 칸에 제공자와 모델을 보인다', async () => {
    renderEvaluation('/evaluation/eval-scorecard?run=run-local', publicFiles([liveArtifact()]));
    const summary = await main().findByRole('region', { name: '이 실행' });
    expect(summary.textContent).toContain('로컬 LLM · qwen3:14b 가 dev 과제 4개를');
    expect(summary.textContent).toContain('실행하지 않은 variant 1개');
    expect(summary.textContent).toContain('Full Source — 컨텍스트 한도 초과');
    expect(main().getByRole('figure', { name: '거짓 성공 주장 비율 — qwen3:14b' })).toBeTruthy();
    const inspector = within(screen.getByRole('complementary', { name: '상세 정보' }));
    const run = within(await inspector.findByRole('region', { name: /^고른 실행/ }));
    expect(await run.findByText('로컬 LLM · qwen3:14b')).toBeTruthy();
  });
});

describe('소비자 평가 — 평가 돌리는 법', () => {
  it.each(['eval-scorecard', 'eval-routing', 'eval-retrieval', 'eval-verification'])(
    '%s 에는 데이터가 없어도 제공자마다 돌리는 명령이 보인다',
    async (id) => {
      renderEvaluation(`/evaluation/${id}`, {});
      const howTo = await main().findByRole('region', { name: '평가 돌리는 법' });
      const commands = within(howTo)
        .getAllByRole('button', { name: /^명령 복사: / })
        .map((button) => button.getAttribute('aria-label'));
      expect(commands).toEqual([
        '명령 복사: pnpm quality:eval',
        '명령 복사: pnpm quality:eval:live --provider=claude --model=<모델>',
        '명령 복사: pnpm quality:eval:live --provider=openai --model=<모델>',
        '명령 복사: pnpm quality:eval:live --provider=local --model=<모델>',
      ]);
      expect(howTo.textContent).toContain('OLLAMA_CONTEXT_LENGTH=32768 ollama serve');
    },
  );
});
