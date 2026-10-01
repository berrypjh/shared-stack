import { ANTHROPIC_BASE_URL } from '../../../../lib/anthropic-messages';
import { OPENAI_BASE_URL } from '../../../../lib/openai-chat';

import type { Protocol } from './conversation';

/**
 * live 평가를 돌릴 모델 제공자. 형식(protocol)이 같으면 같은 대화 코드를 쓰고, 다른 것은 주소 · 키 ·
 * 기본 한도 · 사전 점검 방식뿐이다. 제공자와 모델은 늘 `--provider` · `--model` 로 고른다 — 기본값을
 * 두지 않아 어떤 모델로 돌렸는지가 명령에 드러난다. 주소 · 한도는 `--base-url` · `--context-limit`.
 */
export type Provider = {
  protocol: Protocol;
  baseUrl: string;
  /** 키를 읽는 환경변수. 없으면 키 없이 부른다 (로컬 서버). */
  keyEnv: string | null;
  /** 첫 메시지가 이 토큰 수를 넘으면 그 variant 는 실행하지 않는다. */
  contextLimit: number;
  /**
   * 사전 점검이 토큰을 세는 방법. `anthropic` 은 count_tokens API(무료)로 정확히, `estimate` 는
   * tiktoken 으로 추정한다 — 모델의 tokenizer 와 달라 어림값이다.
   */
  count: 'anthropic' | 'estimate';
  /** 서버가 컨텍스트를 넘는 입력을 오류 없이 잘라 버릴 수 있다. 첫 턴 입력이 추정보다 크게 작으면 멈춘다. */
  silentTruncation: boolean;
};

export const PROVIDERS = {
  claude: {
    protocol: 'anthropic-messages',
    baseUrl: ANTHROPIC_BASE_URL,
    keyEnv: 'ANTHROPIC_API_KEY',
    contextLimit: 200_000,
    count: 'anthropic',
    silentTruncation: false,
  },
  openai: {
    protocol: 'openai-chat',
    baseUrl: OPENAI_BASE_URL,
    keyEnv: 'OPENAI_API_KEY',
    contextLimit: 128_000,
    count: 'estimate',
    silentTruncation: false,
  },
  /** Ollama 는 Anthropic Messages 형식(`/v1/messages`)을 받는다. 서버의 컨텍스트 길이에 한도를 맞춘다. */
  local: {
    protocol: 'anthropic-messages',
    baseUrl: 'http://localhost:11434',
    keyEnv: null,
    contextLimit: 32_768,
    count: 'estimate',
    silentTruncation: true,
  },
} as const satisfies Record<string, Provider>;

export type ProviderId = keyof typeof PROVIDERS;
export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

/** executor 이름. 평가 산출물 · DevHub 가 이 이름으로 live 실행과 제공자를 안다. */
export const liveExecutorName = (provider: ProviderId) => `live-${provider}`;
export const LIVE_EXECUTOR_PATTERN = /^live-(claude|openai|local)$/;
