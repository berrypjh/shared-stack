import type { IconButtonSemanticProps } from '@berrypjh/ui-core';

/**
 * IconButton의 시맨틱 계약 = 공유 계약 + web 전용 확장.
 *
 * `size`·`color`·`disabled`만 ui-core로 올라갔습니다. `edge`는 RN에 대응 개념이 없어
 * 여기 남습니다 — 공유 계약을 느슨하게 만드는 대신 렌더러가 확장합니다.
 */
export type IconButtonEdge = 'start' | 'end' | false;

export interface IconButtonProps extends IconButtonSemanticProps {
  edge?: IconButtonEdge;
}
