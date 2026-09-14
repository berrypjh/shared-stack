/**
 * MenuItem의 시맨틱 계약.
 * `<Select>`가 children을 읽어 옵션으로 쓰는 선언적 슬롯 마커다 — children-as-configuration은 React 관용구라 RN으로 옮겨갈 수 있는 계약이 아니다.
 */
export interface MenuItemProps {
  value?: unknown;
  disabled?: boolean;
  selected?: boolean;
}
