/**
 * 다음 major 에서 제거할 re-export.
 *
 * ui-core 패스스루를 플랫폼 구분 없이 통째로 내보내던 시절의 잔재다. 여기 있는 것들은
 * **RN 전용**이라 web 소비자가 쓸 수 없다 — `getColor` 는 `Theme<RNTokens>` 를 요구하고,
 * `Native` 는 RN transform 을 거친 숫자 토큰 트리다. web 은 CSS 변수와 `Web` 네임스페이스를 쓴다.
 *
 * 공개 API 였으므로 지우지 않고 한 번의 deprecation 을 거친다. `@deprecated` 는 생성 카탈로그에도
 * 실려서 AI 소비자가 web 작업에 이 심볼을 추천하지 않는다.
 */
import type { RNTokens as NativeTokenTree, Theme as NativeTheme } from '@berrypjh/ui-core';
import {
  createTheme as createNativeTheme,
  getColor as getNativeColor,
  Native as NativeTokens,
} from '@berrypjh/ui-core';

/** @deprecated RN 전용 토큰 트리. web 은 `Web` 네임스페이스를 쓴다. 다음 major 에서 제거. */
export const Native = NativeTokens;

/** @deprecated `Theme<RNTokens>` 를 받는 RN 전용 헬퍼. web 은 CSS 변수로 색을 읽는다. 다음 major 에서 제거. */
export const getColor = getNativeColor;

/** @deprecated RN `ThemeProvider` 용. web 은 `<ThemeProvider mode>` 만 쓰면 된다. 다음 major 에서 제거. */
export const createTheme = createNativeTheme;

/** @deprecated RN 토큰 트리 타입. 다음 major 에서 제거. */
export type RNTokens = NativeTokenTree;

/** @deprecated RN 테마 봉투 타입. web 에는 대응하는 런타임이 없다. 다음 major 에서 제거. */
export type Theme<TTokens> = NativeTheme<TTokens>;
