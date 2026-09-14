export type BadgeVariant = 'count' | 'dot';
export type BadgeSize = 'sm' | 'md';

export type BadgeIntent = 'primary' | 'secondary' | 'error' | 'neutral';

export type BadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

export interface BadgeSemanticProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  intent?: BadgeIntent;
  placement?: BadgePlacement;

  count?: number;
  max?: number;
  invisible?: boolean;
}
