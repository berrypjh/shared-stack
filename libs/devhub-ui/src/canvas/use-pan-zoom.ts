'use client';

import {
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { fitView, panBy, type Rect, revealRect, type Size, type View, zoomAt } from './viewport';

const STEP = 48;
const ZOOM_STEP = 1.2;

const sizeOf = (element: HTMLElement): Size => ({
  width: element.clientWidth,
  height: element.clientHeight,
});

/**
 * 그림 하나의 보기 상태. 배경을 끌거나 화살표로 옮기고, Ctrl/⌘ + 휠 또는 +/− 로 확대하며, 0 으로 맞춘다.
 * 전환 효과가 없어 움직임 줄이기 설정을 따로 볼 필요가 없다.
 */
export const usePanZoom = (viewportRef: RefObject<HTMLDivElement | null>, content: Size) => {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const { width, height } = content;

  // 객체가 아니라 숫자에 기대, 부모가 다시 그려져도 사용자가 옮긴 보기를 되돌리지 않는다.
  const fit = useCallback(() => {
    if (viewportRef.current) setView(fitView({ width, height }, sizeOf(viewportRef.current)));
  }, [viewportRef, width, height]);

  const zoomBy = useCallback(
    (factor: number) => {
      const element = viewportRef.current;
      if (!element) return;
      const { width: w, height: h } = sizeOf(element);
      setView((current) => zoomAt(current, factor, w / 2, h / 2));
    },
    [viewportRef],
  );

  /** 내용의 사각형을 보기 안으로 — 포커스가 화면 밖 노드에 닿았을 때. */
  const reveal = useCallback(
    (rect: Rect) => {
      const element = viewportRef.current;
      if (element) setView((current) => revealRect(current, rect, sizeOf(element)));
    },
    [viewportRef],
  );

  useLayoutEffect(fit, [fit]);

  // 휠은 passive 가 아닌 리스너여야 그림 아래 페이지가 같이 스크롤되지 않는다.
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const box = element.getBoundingClientRect();
      setView((current) =>
        event.ctrlKey || event.metaKey
          ? zoomAt(
              current,
              Math.exp(-event.deltaY * 0.01),
              event.clientX - box.left,
              event.clientY - box.top,
            )
          : panBy(current, -event.deltaX, -event.deltaY),
      );
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [viewportRef]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as Element).closest('a, button')) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    drag.current = { ...start, x: event.clientX, y: event.clientY };
    setView((current) => panBy(current, event.clientX - start.x, event.clientY - start.y));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === event.pointerId) drag.current = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [STEP, 0],
      ArrowRight: [-STEP, 0],
      ArrowUp: [0, STEP],
      ArrowDown: [0, -STEP],
    };
    const move = moves[event.key];
    if (move) setView((current) => panBy(current, move[0], move[1]));
    else if (event.key === '+' || event.key === '=') zoomBy(ZOOM_STEP);
    else if (event.key === '-') zoomBy(1 / ZOOM_STEP);
    else if (event.key === '0') fit();
    else return;
    event.preventDefault();
  };

  return {
    view,
    fit,
    zoomIn: () => zoomBy(ZOOM_STEP),
    zoomOut: () => zoomBy(1 / ZOOM_STEP),
    reveal,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onKeyDown,
    },
  };
};
