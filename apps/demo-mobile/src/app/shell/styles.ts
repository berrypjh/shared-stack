import { StyleSheet } from 'react-native';

/**
 * 여러 섹션이 함께 쓰는 스타일만 둡니다.
 * 한 섹션에서만 쓰는 스타일은 그 섹션 파일이 가집니다.
 */
export const demoStyles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 6,
    opacity: 0.6,
  },
  tokenLabel: { fontSize: 13 },
});
