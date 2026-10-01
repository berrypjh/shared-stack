/**
 * live 평가의 제공자 · 명령. 평가 화면의 "평가 돌리는 법" 과 실제 입력 안내가 함께 쓴다.
 */

/**
 * live 실행의 제공자와 기본값. 원본은 평가 harness 의 live executor(`providers.ts` 의 `PROVIDERS`,
 * `executor.ts` 의 `DEFAULT_MAX_TURNS`)이고, 브라우저가 도구 코드를 import 할 수 없어 옮겨 적는다 —
 * 어긋나면 `live.spec.ts` 가 실패한다.
 */
export const LIVE_PROVIDERS = [
  {
    id: 'claude',
    label: 'Claude',
    keyEnv: 'ANTHROPIC_API_KEY',
    contextLimit: 200_000,
    check: '정확히 셈 (count_tokens, 무료)',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    keyEnv: 'OPENAI_API_KEY',
    contextLimit: 128_000,
    check: 'tiktoken 으로 어림',
  },
  {
    id: 'local',
    label: '로컬 LLM (Ollama)',
    keyEnv: null,
    contextLimit: 32_768,
    check: 'tiktoken 으로 어림 · 잘림 감지',
  },
] as const;
export const LIVE_MAX_TURNS = 12;

/** 모델을 실제로 호출하는 평가. 실제 입력(agent-input)은 이 명령으로만 생긴다. */
const LIVE_EVAL_COMMAND = 'pnpm quality:eval:live';

/** 제공자마다 돌리는 명령. 셋 다 같은 모양이고 모델은 기본값 없이 `<모델>` 자리에 고른다. */
export const liveCommand = (provider: string) =>
  `${LIVE_EVAL_COMMAND} --provider=${provider} --model=<모델>`;
