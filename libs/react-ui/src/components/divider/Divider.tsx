'use client';

import { cx } from '../../utils';

import { dividerClasses } from './Divider.constants';
import type { DividerOrientation, DividerProps } from './Divider.types';

/**
 * 시각 구분과 시맨틱 구분은 **다른 결정**이라 따로 푼다.
 *
 * `<hr>` 은 HTML-AAM 이 `separator` 역할로 매핑하는 native 요소다. 그래서 시맨틱 모드에서는
 * `role` 을 적지 않는다 — native 시맨틱을 ARIA 로 복제하지 않는다.
 *
 * `aria-orientation` 도 세로일 때만 적는다. `separator` 역할의 기본 방향이 이미 `horizontal`
 * 이라 가로에 적는 것은 같은 말을 두 번 쓰는 셈이다.
 *
 * `decorative` 는 `role="presentation"` 으로 native 시맨틱만 끈다. `aria-hidden` 을 쓰지
 * 않는 이유는 그쪽이 하위 트리까지 숨기기 때문이다 — 여기서는 요소 자신의 역할만 지우면 된다.
 * 역할이 사라지면 방향을 적을 대상도 없으므로 `aria-orientation` 도 함께 뺀다.
 */
type DividerSemantics = {
  role?: 'presentation';
  'aria-orientation'?: 'vertical';
};

const resolveSemantics = (
  decorative: boolean,
  orientation: DividerOrientation,
): DividerSemantics => {
  if (decorative) return { role: 'presentation' };

  return orientation === 'vertical' ? { 'aria-orientation': 'vertical' } : {};
};

/**
 * 선 하나를 그리는 구분선.
 *
 * 두께와 색은 토큰이 정한다 (`semanticBorder.divider`, `stroke.light`). 굵기·색 prop 이 없는
 * 이유는 저장소에 그것을 바꾸는 사용처가 없고, 열면 토큰 밖으로 나가는 길이 생기기 때문이다.
 *
 * **주변 여백을 갖지 않는다.** 구분선 위아래 간격은 `Stack` 의 `gap` 이나 `Box` 의 여백이
 * 가진다 — `<Stack gap="lg"><p/><Divider/><p/></Stack>` 처럼 합성해서 쓴다. 여백을 여기에
 * 두면 Stack 의 gap 과 더해져 소비자가 두 곳을 맞춰야 한다.
 *
 * 비상호작용이다. 포커스를 받지 않고 hover·pressed 시각도 없다.
 *
 * 파생 접근성 속성이 소비자 prop **앞에** 온다. 그래야 escape hatch 가 성립한다 — 특수한
 * 경우에 소비자가 `role` 을 직접 지정할 수 있다 (`style` 을 뒤에 두는 Stack 과 같은 규칙).
 *
 * `displayName` 을 두지 않는다 — 최상위 속성 할당은 tree-shaking 을 막는다
 * (`.size-limit.cjs` 머리말, Stack·Avatar·Badge·Chip·List·Table 과 같은 관례).
 */
export const Divider = ({
  orientation = 'horizontal',
  decorative = false,
  className,
  ref,
  ...rest
}: DividerProps) => (
  <hr
    {...resolveSemantics(decorative, orientation)}
    {...rest}
    ref={ref}
    className={cx(dividerClasses.root, dividerClasses[orientation], className)}
  />
);
