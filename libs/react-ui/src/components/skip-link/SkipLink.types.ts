import type { ComponentPropsWithRef, ReactNode } from 'react';

export type SkipLinkOwnProps = {
  /**
   * 건너뛸 대상 element 의 id. `href` 는 `#{targetId}` 로 구성된다.
   *
   * **대상은 소비자가 소유한다** — 이 컴포넌트는 대상을 만들지도 고치지도 않는다.
   * 대상에 `tabIndex={-1}` 을 주어야 포커스가 실제로 그쪽으로 옮겨간다: fragment 이동은
   * 포커스 가능한 element 에만 포커스를 주고, 그렇지 않으면 순차 포커스 시작점만 옮긴다.
   *
   * ```tsx
   * <SkipLink targetId="main-content">본문으로 건너뛰기</SkipLink>
   *
   * <main id="main-content" tabIndex={-1}>…</main>
   * ```
   *
   * 고정/스티키 헤더가 있으면 대상이 그 아래 가려질 수 있다 (WCAG 2.4.11 Focus Not
   * Obscured). 그 오프셋은 앱이 알고 이 컴포넌트는 모르므로, 대상 쪽에
   * `scroll-margin-block-start` 를 두어 해결한다 — 헤더 높이를 여기서 추측하지 않는다.
   */
  targetId: string;
  children: ReactNode;
};

export type SkipLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href' | 'children'> &
  SkipLinkOwnProps;
