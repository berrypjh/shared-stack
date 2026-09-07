/**
 * 두 렌더러가 **실제로** 같은 불변식을 구현하는 계약만 둔다.
 *
 * 한쪽 플랫폼에만 구현이 있는 계약은 그 렌더러 패키지가 소유한다 —
 * 이름이 같다거나, 순수 TypeScript라거나, 언젠가 재사용할 수 있다는 것은 근거가 아니다.
 * button/field/fab/icon-button/menu-item 계약이 `react-ui/src/types`로 간 이유가 그것이다.
 */
export type { BoxProps, BoxRadiusValue, BoxSpacingValue } from './box';
