import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@berrypjh/react-native-ui';

import { useDemoPalette } from './palette';

/**
 * 상세 화면의 뒤로가기 바.
 *
 * 뒤로가기는 데모 자신의 `Button` 을 씁니다 — 최소 터치 타깃(48)과 접근성 상태를 라이브러리가
 * 이미 보장하므로 여기서 다시 구현할 이유가 없고, 실제 통합 예시도 됩니다. 보이는 글자에
 * `‹` 가 섞이므로 이름은 `accessibilityLabel` 로 고정합니다.
 *
 * 바의 제목은 **눈으로 위치를 확인하는 용도**입니다. 진짜 제목은 아래 `Section` 카드가
 * `header` 역할로 갖고 있어서, 여기까지 읽히면 같은 이름이 두 번 announce 됩니다.
 * 그래서 접근성 트리에서 감춥니다.
 */
export const DetailBar = ({ title, onBack }: { title: string; onBack: () => void }) => {
  const p = useDemoPalette();

  return (
    <View style={[styles.bar, { backgroundColor: p.page, borderBottomColor: p.border }]}>
      <Button variant="text" size="sm" accessibilityLabel="뒤로" onPress={onBack}>
        {Platform.OS === 'ios' ? '‹ 뒤로' : '← 뒤로'}
      </Button>

      <Text
        numberOfLines={1}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[styles.title, { color: p.body }]}
      >
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1, fontSize: 13, textAlign: 'right', paddingRight: 8 },
});
