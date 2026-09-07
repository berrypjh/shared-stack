import type { ColorToken, RadiusToken, SpacingToken } from '../tokens';

/**
 * 레이아웃 상자의 시맨틱 계약.
 *
 * 여기 있는 이유는 **두 렌더러가 같은 불변식을 실제로 구현하고 있기 때문**이다.
 * `react-ui/src/components/box`와 `react-native-ui/src/components/box`가 아래 규칙을
 * 각자의 스타일 시스템으로 옮긴다. 렌더러별 prop(`className`·`style`·`HTMLAttributes`·
 * `ViewProps`)은 각 패키지가 덧붙인다.
 *
 * 공유 불변식:
 *
 * - **spacing/radius 값**: 토큰 이름이면 해석된 토큰 값, `number`면 렌더러의 기본 길이 단위
 *   (web = px, RN = density-independent pixel). 두 렌더러 모두 "숫자는 원시 길이"로 읽는다.
 * - **축약 우선순위**: 방향값 > 축 값 > 공통값 (`pt ?? py ?? p`). 두 구현이 같은 순서를 쓴다.
 * - **미지정은 미적용**: `undefined`는 "그 축을 건드리지 않는다"는 뜻이지 `0`이 아니다.
 * - **`bg`**: 시맨틱 color 토큰 경로만 받는다. 원시 색 문자열은 받지 않는다 —
 *   web은 CSS 변수로, RN은 토큰 트리 조회로 해석한다.
 */
export type BoxSpacingValue = SpacingToken | number;
export type BoxRadiusValue = RadiusToken | number;

export interface BoxProps {
  // padding
  p?: BoxSpacingValue;
  px?: BoxSpacingValue;
  py?: BoxSpacingValue;
  pt?: BoxSpacingValue;
  pr?: BoxSpacingValue;
  pb?: BoxSpacingValue;
  pl?: BoxSpacingValue;

  // margin
  m?: BoxSpacingValue;
  mx?: BoxSpacingValue;
  my?: BoxSpacingValue;
  mt?: BoxSpacingValue;
  mr?: BoxSpacingValue;
  mb?: BoxSpacingValue;
  ml?: BoxSpacingValue;

  // visuals
  bg?: ColorToken;
  radius?: BoxRadiusValue;
}
