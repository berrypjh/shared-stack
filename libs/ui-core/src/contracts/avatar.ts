/**
 * Avatar 의 시맨틱 계약 — 공유되는 것은 `size`·`shape` 둘뿐입니다.
 *
 * 두 렌더러가 같은 불변식을 실제로 구현해서 공유합니다:
 * - `size` — 같은 세 단계를 같은 spacing 토큰으로 풉니다 (`xl`=24 / `2xl`=32 / `4xl`=48).
 * - `shape` — 같은 두 값을 같은 radius 토큰으로 풉니다 (`rounded`=999 / `md`=8).
 *
 * Avatar 는 **정적 identity visual** 입니다. hover·pressed·focus·selected·disabled 가 없고,
 * 그래서 계약에도 없습니다 — 누를 수 있는 identity 컨트롤은 소비자가 `ButtonBase`(web)나
 * `Pressable`(RN)로 감쌉니다.
 *
 * 승격하지 않은 것:
 * - **이미지 출처**: web `src: string`(URL) vs RN `source: ImageSourcePropType`(번들 리소스·
 *   `{ uri }`·배열). 도메인이 다릅니다.
 * - **접근 가능한 이름**: web DOM `alt` 는 `undefined`/`''`/값의 3-상태이고 `''` 가 "장식" 을
 *   뜻합니다. RN 이미지는 이름 없는 것이 기본이라 그 3-상태가 없고 `accessibilityLabel` 유무만
 *   있습니다. 이름이 비슷해도 불변식이 다릅니다.
 * - **fallback 슬롯**: `ReactNode` 는 렌더러 타입입니다.
 * - **이미지 실패 이벤트**: web DOM 이벤트 vs RN `NativeSyntheticEvent`.
 */
export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarShape = 'circle' | 'rounded';

export interface AvatarSemanticProps {
  size?: AvatarSize;
  shape?: AvatarShape;
}
