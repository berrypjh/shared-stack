import { StyleSheet } from 'react-native';

/**
 * 여러 섹션이 함께 쓰는 **레이아웃**만 둡니다.
 * 색은 `palette.ts` 가 단독으로 가집니다 — 여기에 color 를 넣지 마세요.
 */
export const demoStyles = StyleSheet.create({
  /** 예시를 세로로 쌓을 때. */
  stack: { gap: 12 },
  /** 예시를 가로로 흘릴 때. */
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
});
