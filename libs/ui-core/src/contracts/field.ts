export type FieldVariant = 'plain' | 'filled' | 'boxed';
export type FieldSize = 'sm' | 'md';
export type FieldColor = 'primary' | 'secondary';

export interface FieldSemanticProps {
  variant?: FieldVariant;
  size?: FieldSize;
  color?: FieldColor;

  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
}

/** 입력 요소만 가지는 시맨틱. 레이블·헬퍼 텍스트에는 해당하지 않는다. */
export interface InputFieldSemanticProps extends FieldSemanticProps {
  autoFocus?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
}
