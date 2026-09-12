'use client';

import type { CSSProperties } from 'react';

import { cx } from '../../utils';
import { spacingToCss } from '../box/Box.utils';

import { stackClasses } from './Stack.constants';
import type { StackProps } from './Stack.types';

/** 계약 어휘를 CSS 어휘로 푼다. 이 매핑이 계약이 "정규화된 이름" 을 갖는 이유다. */
const ALIGN_ITEMS = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
} as const;

const JUSTIFY_CONTENT = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
} as const;

/**
 * 1차원 레이아웃 primitive — 자식을 한 축으로 흘리는 것이 전부다.
 *
 * **Box 와 합성 관계다.** 면·여백·모서리는 Box 가 가지므로 여기서 복제하지 않는다. 둘 다
 * 필요하면 `<Box p="lg"><Stack gap="md">…</Stack></Box>` 로 겹쳐 쓴다.
 *
 * 스타일시트가 없다. 레이아웃이 전부 계산된 inline style 이라 SCSS 파일도 `styles.ts` 등록도
 * 필요 없다 — 모듈 부작용을 늘리지 않는 쪽이 tree-shaking 에 낫다. `.ui-stack` 은 소비자가
 * 붙잡을 수 있는 이름일 뿐 규칙을 갖지 않는다.
 *
 * `flex-direction` 은 **항상 내보낸다**. CSS 기본값은 `row` 인데 계약 기본값은 `column` 이라
 * (RN Yoga 기본값과 맞춘다) 브라우저 기본값에 기대면 두 렌더러가 갈린다. 나머지 축은 주지
 * 않으면 선언을 만들지 않는다 — Box 의 "미지정은 미적용" 과 같은 규칙이고, `gap={0}` ·
 * `wrap={false}` 는 미지정이 아니라 명시한 값이다.
 *
 * 소비자 `style` 이 계산된 레이아웃보다 **뒤에 온다**. 그래야 escape hatch 가 성립한다.
 *
 * 비상호작용이다. `role`·`tabIndex`·`aria-*` 를 지어내지 않고 포커스·hover 시각도 만들지
 * 않는다 — 소비자가 준 DOM prop 은 그대로 전달한다.
 *
 * `displayName` 을 두지 않는다 — 최상위 속성 할당은 tree-shaking 을 막는다
 * (`.size-limit.cjs` 머리말, Avatar·Badge·Chip·List·Table 과 같은 관례).
 */
export const Stack = ({
  direction = 'column',
  gap,
  align,
  justify,
  wrap,
  className,
  style,
  children,
  ref,
  ...rest
}: StackProps) => {
  const computed: CSSProperties = {
    display: 'flex',
    flexDirection: direction,
  };

  // Box 와 같은 변환을 쓴다 — 토큰이면 `--ds-spacing-*`, 숫자면 px, `0` 은 `0px`.
  const gapValue = spacingToCss(gap);

  if (gapValue !== undefined) {
    computed.gap = gapValue;
  }

  if (align !== undefined) {
    computed.alignItems = ALIGN_ITEMS[align];
  }

  if (justify !== undefined) {
    computed.justifyContent = JUSTIFY_CONTENT[justify];
  }

  if (wrap !== undefined) {
    computed.flexWrap = wrap ? 'wrap' : 'nowrap';
  }

  return (
    <div
      {...rest}
      ref={ref}
      className={cx(stackClasses.root, className)}
      style={{ ...computed, ...(style ?? {}) }}
    >
      {children}
    </div>
  );
};
