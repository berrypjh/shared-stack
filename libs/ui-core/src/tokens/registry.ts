import { type ThemeDef as BuildThemeDef, themes as generated } from '@berrypjh/design-tokens';

import type { ThemeName } from './types';

/**
 * 소비자가 보는 테마 정보.
 *
 * design-tokens 의 `ThemeDef` 에는 `sourceDirs` 가 있다 — 어느 토큰 디렉터리를 어떤 순서로
 * deep-merge 할지를 적은 **빌드 합성 메타데이터**다. 파이프라인이 바뀌면 같이 바뀌는 값이라
 * 소비자 계약이 될 수 없어서 여기서 잘라낸다.
 *
 * 남기는 두 필드는 실제로 쓸 데가 있다 — `name` 은 `ThemeProvider mode`, `selector` 는
 * 그 테마를 켜는 CSS 선택자다.
 */
export type ThemeInfo = {
  readonly name: ThemeName;
  readonly selector: string;
};

/**
 * 등록된 테마 목록. 값은 design-tokens 의 레지스트리 그대로이고 타입만 좁힌다.
 */
export const themes: readonly ThemeInfo[] = generated;

/**
 * @deprecated 빌드 합성 메타데이터(`sourceDirs`)까지 드러내는 타입이다. `ThemeInfo` 를 쓸 것.
 * 렌더러 패키지가 아직 re-export 하고 있어 남겨 둔다.
 */
export type ThemeDef = BuildThemeDef;
