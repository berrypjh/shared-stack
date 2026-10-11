import { createContext, useContext } from 'react';

/**
 * 예시가 그려지는 면.
 *
 * 비교 표(`matrix`)의 칸은 `TableScroll` 안에 있다. `overflow-x: auto` 가 있으면 CSS 는
 * `overflow-y` 를 `visible` 로 둘 수 없어서, 칸 밖으로 떠 있는 overlay 는 세로 스크롤 안에
 * 잘린다. overlay fixture 는 이 값을 보고 표 안에서는 패널을 흐름 안에 그린다.
 */
export type PreviewSurface = 'canvas' | 'matrix';

export const PreviewSurfaceContext = createContext<PreviewSurface>('canvas');

export const usePreviewSurface = () => useContext(PreviewSurfaceContext);
