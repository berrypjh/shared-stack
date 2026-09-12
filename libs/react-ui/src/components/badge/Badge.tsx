'use client';

import { cx } from '../../utils';

import { badgeClasses } from './Badge.constants';
import type { BadgeProps } from './Badge.types';

const VARIANT_CLASS = {
  count: badgeClasses.variantCount,
  dot: badgeClasses.variantDot,
} as const;

const SIZE_CLASS = {
  sm: badgeClasses.sizeSm,
  md: badgeClasses.sizeMd,
} as const;

const INTENT_CLASS = {
  primary: badgeClasses.intentPrimary,
  secondary: badgeClasses.intentSecondary,
  error: badgeClasses.intentError,
  neutral: badgeClasses.intentNeutral,
} as const;

const PLACEMENT_CLASS = {
  'top-end': badgeClasses.placementTopEnd,
  'top-start': badgeClasses.placementTopStart,
  'bottom-end': badgeClasses.placementBottomEnd,
  'bottom-start': badgeClasses.placementBottomStart,
} as const;

/**
 * overlay indicator — 앵커 위에 얹는 알림/개수/점.
 *
 * standalone status pill 이 아니다. 자기 혼자 서는 태그는 Chip 의 역할이고, 두 의미를 한 API 로
 * 섞으면 어느 쪽도 제대로 못 한다.
 *
 * **앵커를 건드리지 않는 것이 이 컴포넌트의 계약이다.** 루트는 위치 기준만 만드는 `<span>` 이고
 * 표시자는 앵커의 **형제**다 — 앵커 안으로 들어가지 않으므로 role·접근 가능한 이름·키보드
 * 동작이 그대로 남는다. 표시자는 CSS 로 `pointer-events: none` 을 가져 클릭도 가로채지 않는다.
 *
 * 접근성은 장식과 정보를 나눈다:
 *
 * - `label` 이 있으면 표시자가 `role="img"` + `aria-label` 로 이름을 갖고 시각 글자는 감춘다.
 *   화면은 `99+`, 낭독은 실제 수 — 축약이 정보를 흐리지 않게 하는 유일한 통로다.
 * - `label` 이 없는 `count` 는 보이는 글자가 그대로 읽힌다. 이름을 지어내지 않는다.
 * - `label` 이 없는 `dot` 은 읽을 것이 없어 트리에서 감춘다 (순수 장식).
 *
 * `role="status"` 를 **기본으로 붙이지 않는다** — live region 은 값이 바뀔 때마다 낭독에
 * 끼어드는 동작이라 소비자가 고를 일이다.
 *
 * `invisible` 은 표시자를 **내지 않는다**(감추지 않는다). DOM 에 없으면 AT 로도 스타일로도 새지 않는다.
 *
 * `displayName` 을 두지 않는다 — 최상위 속성 할당은 tree-shaking 을 막는다
 * (`.size-limit.cjs` 머리말, Avatar·Checkbox·Radio·Switch 와 같은 관례).
 */
export const Badge = ({
  children,
  content,
  count,
  max = 99,
  variant = 'count',
  size = 'md',
  intent = 'error',
  placement = 'top-end',
  invisible = false,
  label,
  className,
  ...rest
}: BadgeProps) => {
  const isDot = variant === 'dot';
  // dot 은 내용을 갖지 않으므로 존재 자체가 표시다. count 는 0 도 유효한 값이다.
  const hasValue = content != null || count != null;
  const showIndicator = !invisible && (isDot || hasValue);

  const named = label != null && label !== '';

  // 축약은 숫자에만 적용한다 — `content` 는 소비자가 이미 원하는 모양으로 준 것이다.
  const displayValue = content ?? (count != null && count > max ? `${max}+` : count);

  return (
    <span {...rest} className={cx(badgeClasses.root, className)}>
      {children}
      {showIndicator ? (
        <span
          className={cx(
            badgeClasses.indicator,
            VARIANT_CLASS[variant],
            SIZE_CLASS[size],
            INTENT_CLASS[intent],
            PLACEMENT_CLASS[placement],
          )}
          role={named ? 'img' : undefined}
          aria-label={named ? label : undefined}
          // 이름 없는 dot 은 읽을 것이 없다. 빈 요소를 트리에 남기면 잡음이 된다.
          aria-hidden={!named && isDot ? 'true' : undefined}
        >
          {isDot ? null : (
            <span
              className={badgeClasses.value}
              // 루트가 이름을 가지면 축약된 글자는 중복이고 모호하다 ("구십구 플러스").
              aria-hidden={named ? 'true' : undefined}
            >
              {displayValue}
            </span>
          )}
        </span>
      ) : null}
    </span>
  );
};
