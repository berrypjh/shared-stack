import type { ButtonColor, ButtonSize } from './button';

/**
 * IconButton 의 시맨틱 계약.
 *
 * `edge` 는 컨테이너 가장자리에 아이콘 광학 정렬을 맞추려고 자체 패딩을 상쇄하는
 * 웹 레이아웃 관용구다 — RN 에는 대응 개념이 없다.
 */
export type IconButtonEdge = 'start' | 'end' | false;

export interface IconButtonProps {
  color?: ButtonColor;
  size?: ButtonSize;
  edge?: IconButtonEdge;

  disabled?: boolean;
}
