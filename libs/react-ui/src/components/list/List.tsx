'use client';

import { createElement } from 'react';

import { cx } from '../../utils';

import { listClasses } from './List.constants';
import type { ListProps } from './List.types';

/**
 * semantic HTML helper — `<ul>`/`<ol>` 에 토큰 여백과 마커 정책을 붙인다.
 *
 * **menu·listbox·navigation 프레임워크가 아니다.** 그 셋은 각각 다른 ARIA 계약과 키보드 모델을
 * 요구하고, 이미 `Select`(listbox)·`SearchField`(combobox 제안 목록)가 각자 소유한다. `<nav>` 는
 * 소비자가 감싼다. `MenuItem` 도 여기 쓰이지 않는다 — 그것은 `Select` 의 선언적 슬롯
 * 마커(`return null`)이지 목록 항목이 아니다.
 *
 * **상호작용은 자식이 가진다.** `ListItem` 에 `onClick` 을 두지 않는다 — 소비자가 `<a>`/
 * `<button>` 을 자식으로 넣으면 키보드·포커스·disabled 를 브라우저가 이미 옳게 한다. roving
 * tabindex·선택 모델·키보드 내비게이션 프레임워크를 만들지 않는다.
 *
 * `role` 하나만 조건부로 붙인다. `list-style: none` 은 **WebKit 에서 목록 시맨틱을 지우고**
 * (Safari·VoiceOver 가 "항목 3개 중 1번째" 를 잃는다) 이 시스템의 기본값이 마커 없음이라,
 * 그대로 두면 컴포넌트의 존재 이유가 기본 경로에서 사라진다. 그래서 **마커를 지운 경우에만**
 * `role="list"` 로 복구한다 — 원인이 있는 곳에만 대응하고, `marker` 를 켜면 role 이 사라진다.
 * 소비자가 `role` 을 주면 그것이 이긴다.
 *
 * `displayName` 을 두지 않는다 — 최상위 속성 할당은 tree-shaking 을 막는다
 * (`.size-limit.cjs` 머리말, Avatar·Badge·Chip 과 같은 관례).
 */
export const List = ({
  ordered = false,
  marker = false,
  className,
  children,
  role,
  ...rest
}: ListProps) => {
  const className_ = cx(listClasses.root, marker && listClasses.marker, className);

  return createElement(
    ordered ? 'ol' : 'ul',
    {
      ...rest,
      className: className_,
      // 마커를 지운 목록만 복구한다. 소비자 role 이 있으면 그것을 쓴다.
      role: role ?? (marker ? undefined : 'list'),
    },
    children,
  );
};
