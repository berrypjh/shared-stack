// `ThemeName`은 design-tokens에서 직접 가져온다. `./types`의 재alias를 쓰면
// 번들된 선언에서 `ThemeName$1`로 나와 공개 시그니처와 소비자 카탈로그가 지저분해진다.
import type { ThemeName } from '@berrypjh/design-tokens';

import type { Theme } from './types';

/**
 * `{ mode, tokens }` 봉투 그 이상을 하지 않는다.
 *
 * 토큰 트리는 design-tokens 가 이미 완성해서 넘기므로 여기서 병합·해석·캐싱할 것이 없다.
 * `tokens` 는 제네릭이라 플랫폼 트리를 가리지 않고, React context 는 각 렌더러가 쥔다 —
 * ui-core 는 렌더러를 몰라야 한다.
 */
export const createTheme = <T>(options: { mode: ThemeName; tokens: T }): Theme<T> => {
  return {
    mode: options.mode,
    tokens: options.tokens,
  };
};
