/**
 * 공유 토큰 경로의 Web/RN 동등성과 테마 레지스트리 ↔ 생성 namespace 동등성.
 * `ColorToken`·`SpacingToken`·`RadiusToken`은 Web 트리에서 유도되는데 `getColor`는 그 키로
 * RN 트리를 조회한다.
 * 두 어휘가 갈라지면 정적 타입은 통과하고 런타임만 깨지므로, 어휘가 같다는 사실 자체를 검사한다.
 * 값은 검사하지 않는다.
 * 플랫폼 transform이 표현을 바꾸는 것이 의도다 (`spacing.md` → Web `'0.75rem'`, RN `12`).
 */
import { Native, themes, Web } from '@berrypjh/design-tokens';

import type { LeafDotPath } from './path';
import type { ColorToken, RadiusToken, SpacingToken, ThemeName } from './types';

/** 두 타입이 정확히 같은지 검사, 분포적 조건부를 피한다 */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type Expect<T extends true> = T;

type NotNever<T> = [T] extends [never] ? false : true;

/**
 * 타입 수준 단언 모음.
 * `noUnusedLocals`에 걸리지 않도록 하나의 export로 묶어 참조를 유지한다.
 * 어느 항목이든 깨지면 `tsc -p tsconfig.spec.json`이 실패한다.
 */
export type SharedTokenAssertions = [
  // 공유 별칭의 어휘가 두 플랫폼에서 같다.
  Expect<Equal<LeafDotPath<Web.Light.ColorTokens>, LeafDotPath<Native.Light.ColorTokens>>>,
  Expect<Equal<LeafDotPath<Web.Light.SpacingTokens>, LeafDotPath<Native.Light.SpacingTokens>>>,
  Expect<Equal<LeafDotPath<Web.Light.RadiusTokens>, LeafDotPath<Native.Light.RadiusTokens>>>,

  // 공개 별칭이 실제로 그 어휘다.
  Expect<Equal<ColorToken, LeafDotPath<Native.Light.ColorTokens>>>,
  Expect<Equal<SpacingToken, LeafDotPath<Native.Light.SpacingTokens>>>,
  Expect<Equal<RadiusToken, LeafDotPath<Native.Light.RadiusTokens>>>,

  // 위 단언이 `never`나 `string`으로 뭉개져 아무것도 검사하지 않은 채 통과하지 않는다.
  Expect<NotNever<ColorToken>>,
  Expect<NotNever<SpacingToken>>,
  Expect<NotNever<RadiusToken>>,
  Expect<Equal<Equal<ColorToken, string>, false>>,
  Expect<Equal<Equal<SpacingToken, string>, false>>,
  Expect<Equal<Equal<RadiusToken, string>, false>>,

  // 레지스트리에 테마를 더하면 두 플랫폼 namespace가 함께 생겨야 한다.
  Expect<Equal<keyof typeof Native, Capitalize<ThemeName>>>,
  Expect<Equal<keyof typeof Web, Capitalize<ThemeName>>>,
];

type TokenTree = { [key: string]: unknown };

/** 토큰 트리 → leaf 점 표기 경로 목록 (`{ height: { sm: 40 } }` → `['height.sm']`) */
const leafPaths = (tree: TokenTree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const here = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object'
      ? leafPaths(value as TokenTree, here)
      : [here];
  });

/**
 * Web/RN이 같은 경로로 읽는 카테고리.
 * `component`는 `ColorToken` 같은 공개 별칭이 없어 타입 단언에서 빠지지만,
 * RN 스타일이 `component.field.*`·`component.pressedOffset`을 직접 읽는다.
 * 어휘가 갈라지면 Web만 멀쩡한 채 RN 런타임이 `undefined`를 집는다.
 */
const SHARED_CATEGORIES = ['color', 'spacing', 'radius', 'component'] as const;

/** 첫 글자만 대문자로 (`light` → `Light`), `genTsTokens`가 namespace를 만드는 규칙과 같다 */
const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

describe('공유 토큰 경로는 두 플랫폼에서 같다', () => {
  it.each(SHARED_CATEGORIES)('%s 경로 어휘가 일치한다', (category) => {
    const web = leafPaths(Web.Light.tokens[category]).sort();
    const native = leafPaths(Native.Light.tokens[category]).sort();

    // 비어 있으면 아래 비교가 아무것도 검사하지 않고 통과한다.
    expect(web.length).toBeGreaterThan(0);
    expect(native).toEqual(web);
  });

  it('값은 플랫폼 변환을 거친다 — 어휘만 같고 표현은 다르다', () => {
    expect(typeof Web.Light.tokens.spacing.md).toBe('string');
    expect(typeof Native.Light.tokens.spacing.md).toBe('number');
  });
});

describe('테마 레지스트리와 생성 namespace', () => {
  it('등록된 모든 테마가 두 플랫폼 namespace 를 갖는다', () => {
    const expected = themes.map((theme) => capitalize(theme.name)).sort();

    expect(Object.keys(Native).sort()).toEqual(expected);
    expect(Object.keys(Web).sort()).toEqual(expected);
  });

  it('모든 RN 테마가 공유 카테고리를 같은 경로로 갖는다', () => {
    // 테마가 덮어쓰는 카테고리는 color뿐이다. 나머지는 base에서 그대로 오므로 color만 본다.
    const base = leafPaths(Native.Light.tokens.color).sort();

    for (const name of Object.keys(Native) as (keyof typeof Native)[]) {
      expect(leafPaths(Native[name].tokens.color).sort()).toEqual(base);
    }
  });
});
