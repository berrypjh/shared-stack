'use client';

import { useState } from 'react';

import { cx } from '../../utils';

import { avatarClasses } from './Avatar.constants';
import type { AvatarProps } from './Avatar.types';

const SIZE_CLASS = {
  sm: avatarClasses.sizeSm,
  md: avatarClasses.sizeMd,
  lg: avatarClasses.sizeLg,
} as const;

const SHAPE_CLASS = {
  circle: avatarClasses.shapeCircle,
  rounded: avatarClasses.shapeRounded,
} as const;

/**
 * 정적 identity visual. 이미지가 있으면 `<img>` 로, 없거나 실패하면 fallback 으로 그린다.
 *
 * 접근성의 핵심은 **같은 정보를 두 번 읽히지 않는 것**이다:
 *
 * - 이미지와 fallback 은 **동시에 렌더되지 않는다**. 둘 중 하나만 DOM 에 있으므로 구조적으로
 *   중복이 불가능하다 (`aria-hidden` 으로 가리는 것보다 확실하다).
 * - `alt` 를 준 fallback 은 루트가 `role="img"` + `aria-label` 로 이름을 갖고, 시각 글자는
 *   `aria-hidden` 으로 감춘다. 이니셜("길동")이 이름("홍길동")과 함께 읽히면 같은 사람을 두 번
 *   말하게 된다.
 *
 * 이름을 지어내지 않는다 — `alt` 가 없으면 이미지는 장식이 되고 fallback 글자가 그대로 읽힌다.
 *
 * 상호작용이 없어 `tabIndex`·`role="button"`·hover/pressed/focus 상태를 만들지 않는다.
 * `displayName` 도 두지 않는다 — 최상위 속성 할당은 번들러가 순수하다고 증명하지 못해
 * tree-shaking 을 막는다 (`.size-limit.cjs` 머리말, Checkbox·Radio·Switch 와 같은 관례).
 */
export const Avatar = ({
  src,
  alt,
  size = 'md',
  shape = 'circle',
  children,
  className,
  onError,
  ...rest
}: AvatarProps) => {
  // 실패를 URL 에 매어 둔다 — `src` 가 바뀌면 effect 없이도 깨끗하게 다시 시도된다.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const showImage = src != null && src !== '' && failedSrc !== src;
  const named = alt != null && alt !== '';

  const rootClassName = cx(avatarClasses.root, SIZE_CLASS[size], SHAPE_CLASS[shape], className);

  if (showImage) {
    return (
      <span {...rest} className={rootClassName}>
        <img
          className={avatarClasses.image}
          src={src}
          // `undefined` 로 두면 스크린리더가 파일명을 읽는다. 이름이 없으면 장식이 맞다.
          alt={alt ?? ''}
          onError={(event) => {
            setFailedSrc(src);
            onError?.(event);
          }}
        />
      </span>
    );
  }

  return (
    <span
      {...rest}
      className={rootClassName}
      // fallback 이 이름을 대신 진다. 이미지가 없으므로 루트가 그 그래픽이다.
      role={named ? 'img' : undefined}
      aria-label={named ? alt : undefined}
    >
      {children == null ? null : (
        <span
          className={avatarClasses.fallback}
          // 루트가 이름을 가지면 시각 글자는 중복이다. `alt=""` 는 명시적 장식이다.
          aria-hidden={named || alt === '' ? 'true' : undefined}
        >
          {children}
        </span>
      )}
    </span>
  );
};
