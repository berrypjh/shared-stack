import { StyleSheet, Text, View } from 'react-native';

import { Box, ThemeName, useTheme } from '@berrypjh/react-native-ui';

import { demoStyles } from '../shell/styles';

/**
 * 테마 토큰이 실제로 해석됐는지 보여주는 구역.
 * 테마가 덮어쓴 semantic color는 테마에 따라 바뀌고, 덮어쓰지 않은 값은 그대로다.
 */
export const ThemeTokensSection = ({ mode }: { mode: ThemeName }) => {
  const theme = useTheme();
  const { color, spacing, radius } = theme.tokens;

  const rows: [string, string][] = [
    ['color.background.primary', color.background.primary],
    ['color.background.surface', color.background.surface],
    ['color.text.default', color.text.default],
    ['color.primaryBtn.default', color.primaryBtn.default],
    ['color.background.error (테마 공통)', color.background.error],
  ];

  return (
    <View>
      <Text style={demoStyles.sectionLabel}>resolved via useTheme() — theme: {mode}</Text>

      {rows.map(([label, value]) => (
        <View key={label} style={styles.tokenRow}>
          <View style={[styles.tokenChip, { backgroundColor: value }]} />
          <Text style={[demoStyles.tokenLabel, { color: color.text.default }]}>
            {label} = {value}
          </Text>
        </View>
      ))}

      <Text style={demoStyles.sectionLabel}>overridden semantic background</Text>
      <Box bg="background.primary" radius="md" p="lg" m="sm">
        <Text style={{ color: color.text.contrastText }}>
          Box bg=&quot;background.primary&quot; p=&quot;lg&quot; radius=&quot;md&quot;
        </Text>
      </Box>

      <Text style={demoStyles.sectionLabel}>
        non-overridden scale — spacing.md={spacing.md} radius.lg={radius.lg}
      </Text>
      <Box bg="background.secondary" radius="lg" p="md" m="sm">
        <Text style={{ color: color.text.contrastText }}>spacing/radius must match Default</Text>
      </Box>
    </View>
  );
};

const styles = StyleSheet.create({
  tokenRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tokenChip: { width: 28, height: 28, borderRadius: 6, marginRight: 10 },
});
