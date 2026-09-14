import { StyleSheet, Text, View } from 'react-native';

import { ThemeName } from '@berrypjh/react-native-ui';

import { useDemoPalette } from '../shell/palette';
import { Caption, Label } from '../shell/Section';

/**
 * 테마 토큰이 실제로 해석됐는지 보여주는 구역.
 * 테마가 덮어쓴 semantic color는 테마에 따라 바뀌고, 덮어쓰지 않은 값은 그대로입니다.
 */
export const ThemeTokensSection = ({ mode }: { mode: ThemeName }) => {
  const p = useDemoPalette();
  const { color, spacing, radius } = p;

  const rows: [string, string][] = [
    ['background.default', color.background.default],
    ['background.surface', color.background.surface],
    ['background.primary', color.background.primary],
    ['text.default', color.text.default],
    ['primaryBtn.default', color.primaryBtn.default],
    ['field.border', color.field.border],
  ];

  return (
    <View>
      <Label>현재 테마 — {mode}</Label>
      <View style={styles.rows}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <View style={[styles.chip, { backgroundColor: value, borderColor: p.border }]} />
            <Text style={[styles.name, { color: p.title }]}>{label}</Text>
            <Text style={[styles.value, { color: p.muted }]}>{value}</Text>
          </View>
        ))}
      </View>

      <Label>테마가 바꾸지 않는 스케일</Label>
      <Caption>
        spacing.md = {spacing.md} · spacing.lg = {spacing.lg} · radius.md = {radius.md} · radius.lg
        = {radius.lg}
      </Caption>
      <Caption>색만 테마별로 갈립니다. 간격·모서리 값은 어느 테마에서나 같아야 합니다.</Caption>
    </View>
  );
};

const styles = StyleSheet.create({
  rows: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chip: { width: 26, height: 26, borderRadius: 7, borderWidth: StyleSheet.hairlineWidth },
  name: { fontSize: 13, fontWeight: '600', flex: 1 },
  value: { fontSize: 12 },
});
