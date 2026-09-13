import { useCallback } from 'react';

import { useSearchParams } from 'react-router-dom';

/**
 * View mode URL policy.
 *
 * URL query 하나가 canonical source 다 — localStorage · Context · 전역 store 를 두지 않는다.
 * 그래야 Back/Forward · refresh · deep link · 링크 공유가 전부 같은 규칙 하나로 설명된다.
 *
 * canonical URL:
 *   Developer  /components/button
 *   Designer   /components/button?view=designer
 *
 * Developer 가 default 이므로 `view=developer` 는 canonical URL 에 남기지 않는다.
 * pathname 은 component context 의 source 라 mode 전환이 건드리지 않는다.
 *
 * `theme`(`ThemeName`) 과는 별개의 축이다. 둘을 `mode` 라는 이름 하나로 섞지 않는다.
 */

const VIEW_MODES = ['developer', 'designer'] as const;

export type ViewMode = (typeof VIEW_MODES)[number];

export const VIEW_PARAM = 'view';

export const DEFAULT_VIEW_MODE: ViewMode = 'developer';

/** cast 로 통과시키지 않는다 — 아는 값만 ViewMode 로 좁힌다. */
const isViewMode = (raw: string): raw is ViewMode =>
  (VIEW_MODES as readonly string[]).includes(raw);

/** parameter 없음 · 알 수 없는 값 · `developer` 는 모두 default 로 읽는다. */
export const parseViewMode = (raw: string | null): ViewMode =>
  raw !== null && isViewMode(raw) ? raw : DEFAULT_VIEW_MODE;

export const readViewMode = (search: string | URLSearchParams): ViewMode =>
  parseViewMode(new URLSearchParams(search).get(VIEW_PARAM));

/**
 * 다음 query. 원본을 복사해 `view` 만 손대고 나머지 parameter 는 그대로 남긴다.
 * pathname 은 여기서 다루지 않는다 — 호출자가 현재 pathname 을 유지한다.
 */
export const writeViewMode = (
  search: string | URLSearchParams,
  next: ViewMode,
): URLSearchParams => {
  const params = new URLSearchParams(search);
  if (next === 'designer') params.set(VIEW_PARAM, next);
  else params.delete(VIEW_PARAM);
  return params;
};

export const useViewMode = (): [ViewMode, (next: ViewMode) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = parseViewMode(searchParams.get(VIEW_PARAM));

  const setViewMode = useCallback(
    (next: ViewMode) => {
      /*
        mode 가 실제로 바뀔 때만 history 에 남긴다 — Back 으로 되돌릴 수 있어야 한다.
        `?view=developer` 처럼 읽기 결과가 같은 URL 을 canonical 로 정리하는 것은 되돌릴
        일이 아니므로 replace 다. 그래야 normalization 이 history 를 더럽히지 않는다.
      */
      setSearchParams(writeViewMode(searchParams, next), { replace: next === viewMode });
    },
    [searchParams, setSearchParams, viewMode],
  );

  return [viewMode, setViewMode];
};
