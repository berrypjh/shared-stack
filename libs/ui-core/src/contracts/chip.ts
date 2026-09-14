export type ChipSize = 'sm' | 'md';

export type ChipVariant = 'outlined' | 'filled';

export interface ChipSemanticProps {
  size?: ChipSize;
  variant?: ChipVariant;

  selected?: boolean;
  disabled?: boolean;
}
