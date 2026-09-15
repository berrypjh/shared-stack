import { Native, type ThemeName, Web } from '@berrypjh/design-tokens';

import type { LeafDotPath } from './path';

/**
 * 토큰 트리 leaf의 literal 타입을 base primitive로 widen한다.
 * 토큰 namespace는 `as const`로 좁혀져 테마별 literal이 모두 다르므로 "임의 테마 tokens" 변수에 대입하려면 widen이 필요하다.
 */
type WidenLiterals<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? WidenLiterals<U>[]
        : T extends object
          ? { [K in keyof T]: WidenLiterals<T[K]> }
          : T;

/** 모든 테마(light/dark/sepia 등)의 tokens가 대입 가능한 구조적 RN 토큰 타입 */
export type RNTokens = WidenLiterals<Native.Light.Tokens>;
export type { ThemeName };

export type Theme<TTokens> = {
  mode: ThemeName;
  tokens: TTokens;
};

export type ColorToken = LeafDotPath<Web.Light.ColorTokens>;
export type SpacingToken = LeafDotPath<Web.Light.SpacingTokens>;
export type RadiusToken = LeafDotPath<Web.Light.RadiusTokens>;
