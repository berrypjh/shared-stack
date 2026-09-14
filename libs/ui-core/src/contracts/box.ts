import type { ColorToken, RadiusToken, SpacingToken } from '../tokens';

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
