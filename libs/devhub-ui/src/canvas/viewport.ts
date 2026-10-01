/**
 * 그림 보기의 이동 · 확대 계산. 순수 함수다: 화면 좌표 = 내용 좌표 × k + (x, y).
 * 보기 상태는 여기와 그림 컴포넌트에만 있고 카탈로그에 닿지 않는다.
 */

export type View = { x: number; y: number; k: number };
export type Size = { width: number; height: number };
export type Rect = Size & { x: number; y: number };

export const MIN_ZOOM = 0.4;
export const MAX_ZOOM = 2;

export const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

export const panBy = (view: View, dx: number, dy: number): View => ({
  ...view,
  x: view.x + dx,
  y: view.y + dy,
});

/** 화면의 점 (px, py) 아래의 내용이 그대로 있도록 `factor` 만큼 확대한다. */
export const zoomAt = (view: View, factor: number, px: number, py: number): View => {
  const k = clampZoom(view.k * factor);
  const ratio = k / view.k;
  return { k, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio };
};

/** 내용을 보기 안에 맞추고 가운데 둔다. 1:1 보다 키우지 않는다. */
export const fitView = (content: Size, viewport: Size, padding = 24): View => {
  const k = clampZoom(
    Math.min(
      (viewport.width - padding * 2) / content.width,
      (viewport.height - padding * 2) / content.height,
      1,
    ),
  );
  return {
    k,
    x: (viewport.width - content.width * k) / 2,
    y: (viewport.height - content.height * k) / 2,
  };
};

/** 내용의 사각형이 보기 안에 다 들어오도록 가장 적게 옮긴다. 이미 보이면 그대로다. */
export const revealRect = (view: View, rect: Rect, viewport: Size, margin = 24): View => {
  const shift = (start: number, size: number, limit: number) => {
    if (start < margin) return margin - start;
    if (start + size > limit - margin)
      return Math.max(limit - margin - (start + size), margin - start);
    return 0;
  };
  const left = view.x + rect.x * view.k;
  const top = view.y + rect.y * view.k;
  return panBy(
    view,
    shift(left, rect.width * view.k, viewport.width),
    shift(top, rect.height * view.k, viewport.height),
  );
};
