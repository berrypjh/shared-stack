/**
 * 두 렌더러가 실제로 같은 불변식을 구현하는 계약만 둡니다.
 *
 * 한쪽 플랫폼에만 구현이 있으면 그 렌더러 패키지가 가집니다 — 이름이 같다거나, 순수
 * TypeScript라거나, 언젠가 재사용할 수 있다는 것은 근거가 아닙니다.
 * `IconButtonSemanticProps`에 `edge`·`loading`이 없는 이유입니다.
 */
export type { AvatarSemanticProps, AvatarShape, AvatarSize } from './avatar';
export type {
  BadgeIntent,
  BadgePlacement,
  BadgeSemanticProps,
  BadgeSize,
  BadgeVariant,
} from './badge';
export type { BoxProps, BoxRadiusValue, BoxSpacingValue } from './box';
export type {
  ButtonColor,
  ButtonLoadingPosition,
  ButtonSemanticProps,
  ButtonSize,
  ButtonVariant,
} from './button';
export type { ChipSemanticProps, ChipSize, ChipVariant } from './chip';
export type { FabSemanticProps, FabShape } from './fab';
export type {
  FieldColor,
  FieldSemanticProps,
  FieldSize,
  FieldVariant,
  InputFieldSemanticProps,
} from './field';
export type { IconButtonSemanticProps } from './icon-button';
export type { StackAlign, StackDirection, StackJustify, StackSemanticProps } from './stack';
