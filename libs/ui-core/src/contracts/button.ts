export type ButtonVariant = 'contained' | 'outlined' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonColor = 'primary' | 'secondary';
export type ButtonLoadingPosition = 'start' | 'center' | 'end';

export interface ButtonSemanticProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;

  disabled?: boolean;
  fullWidth?: boolean;

  loading?: boolean;
  loadingPosition?: ButtonLoadingPosition;
}
