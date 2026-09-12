'use client';

import { cx } from '../../utils';

import type { VisuallyHiddenProps } from './VisuallyHidden.types';

/** 스타일시트와 공유하는 단 하나의 훅. 공개 API 가 아니라 구현 세부다. */
const rootClass = 'ui-visually-hidden';

/**
 * 시각에서만 숨기고 접근성 트리에는 남기는 래퍼.
 *
 * `display: none` 도 `visibility: hidden` 도 `aria-hidden` 도 쓰지 않는다 — 셋 다 보조
 * 기술에서도 지워서, 숨기는 것이 아니라 **없애는** 것이 된다. 대신 1px 로 잘라내는
 * 클리핑 패턴을 쓴다. 저장소에 이미 같은 패턴이 `form-control` 의 `hiddenLabel` 과
 * `table` 의 `hiddenCaption` 에 있고, 이 컴포넌트는 그것을 소비자가 쓸 수 있게 꺼낸 것이다.
 *
 * 대표 사용처는 **아이콘만 있는 컨트롤에 이름을 주는 것**이다:
 *
 * ```tsx
 * <button>
 *   <TrashIcon aria-hidden />
 *   <VisuallyHidden>삭제</VisuallyHidden>
 * </button>
 * ```
 *
 * `aria-label` 대신 이것을 쓰면 실제 텍스트 노드라서 브라우저 번역·글자 선택·페이지 내
 * 검색에 걸린다.
 *
 * **포커스 가능한 자식을 넣지 않는다.** 넣으면 키보드로는 갈 수 있는데 화면에는 끝까지
 * 보이지 않는 상태가 된다. 포커스에서 드러나야 하는 우회 링크는 `SkipLink` 가 가진다 —
 * 그쪽은 fragment 이동까지 함께 소유한다.
 *
 * `displayName` 을 두지 않는다 — 최상위 속성 할당은 tree-shaking 을 막는다
 * (`.size-limit.cjs` 머리말, Stack·Divider 와 같은 관례).
 */
export const VisuallyHidden = ({ className, children, ref, ...rest }: VisuallyHiddenProps) => (
  <span {...rest} ref={ref} className={cx(rootClass, className)}>
    {children}
  </span>
);
