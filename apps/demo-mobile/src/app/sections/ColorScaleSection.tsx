import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@berrypjh/react-native-ui';

import { demoStyles } from '../shell/styles';

const Swatch = ({ name, hex }: { name: string; hex: string }) => (
  <View style={styles.swatchCol}>
    <View style={[styles.swatchBlock, { backgroundColor: hex }]} />
    <Text style={styles.swatchName}>{name}</Text>
    <Text style={styles.swatchHex}>{hex}</Text>
  </View>
);

/** primitive 색 스케일. 테마와 무관하게 같은 값이어야 합니다. */
export const ColorScaleSection = () => {
  const theme = useTheme();
  const primary = theme.tokens.color.primary;
  const neutral = theme.tokens.color.neutral;

  return (
    <View>
      <Text style={demoStyles.sectionLabel}>primary scale</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.swatchRow}>
        {Object.entries(primary).map(([key, hex]) => (
          <Swatch key={key} name={key} hex={hex} />
        ))}
      </ScrollView>

      <Text style={demoStyles.sectionLabel}>neutral scale</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.swatchRow}>
        {Object.entries(neutral).map(([key, hex]) => (
          <Swatch key={key} name={key} hex={hex} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  swatchRow: { paddingVertical: 4 },
  swatchCol: { width: 64, marginRight: 8 },
  swatchBlock: {
    height: 40,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  swatchName: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  swatchHex: { fontSize: 9, opacity: 0.5 },
});
