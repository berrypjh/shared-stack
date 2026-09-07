import type { ButtonColor, ButtonSize } from './button';

/**
 * IconButton의 시맨틱 계약 — 공유되는 것은 `size`·`color`·`disabled` 셋뿐입니다.
 *
 * 승격하지 않은 것:
 * - `edge`: 자체 padding을 음수 margin으로 상쇄하는 웹 레이아웃 관용구. RN에 대응 개념이 없습니다.
 * - `loading`: 의미가 다릅니다. web은 `boolean | null` 3-상태라 `null`(기능 꺼짐)과
 *   `false`(자리만 확보)가 서로 다른 DOM을 만들고, RN은 2-상태 boolean입니다.
 * - 아이콘 슬롯·`accessibilityLabel`: 렌더러 타입입니다.
 */
export interface IconButtonSemanticProps {
  color?: ButtonColor;
  size?: ButtonSize;

  disabled?: boolean;
}
