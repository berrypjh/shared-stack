import { StyleSheet, Text, View } from 'react-native';

import { getColor, useTheme } from '@berrypjh/react-native-ui';

import { demoStyles } from '../shell/styles';

/** semantic 색. 테마를 바꾸면 여기 값이 따라 바뀝니다. */
export const SemanticColorSection = () => {
  const theme = useTheme();
  const text = theme.tokens.color.text;
  const background = theme.tokens.color.background;

  return (
    <View>
      <Text style={demoStyles.sectionLabel}>text.* (테마별 자동 반전)</Text>
      <View
        style={[
          styles.semanticCard,
          {
            backgroundColor: getColor(theme, 'background.dark' as never),
          },
        ]}
      >
        <Text style={{ color: text.default, fontSize: 16, fontWeight: '600' }}>
          text.default = {text.default}
        </Text>
        <Text style={{ color: text.light, marginTop: 4 }}>text.light = {text.light}</Text>
        <Text style={{ color: text.placeholder, marginTop: 4 }}>
          text.placeholder = {text.placeholder}
        </Text>
        <Text style={{ color: text.primary, marginTop: 4, fontWeight: '600' }}>
          text.primary = {text.primary}
        </Text>
      </View>

      <Text style={demoStyles.sectionLabel}>background.* swatches</Text>
      <View style={styles.bgRow}>
        {(['primary', 'secondary', 'success', 'warning', 'error'] as const).map((k) => (
          <View key={k} style={[styles.bgChip, { backgroundColor: background[k] }]}>
            <Text style={styles.bgChipText}>{k}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  semanticCard: { padding: 16, borderRadius: 8, marginTop: 4 },
  bgRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  bgChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  bgChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
