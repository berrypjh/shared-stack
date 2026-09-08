import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemeName, themes } from '@berrypjh/react-native-ui';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** 등록된 테마를 모두 나열하는 토글. 값은 `themes` 레지스트리에서 옵니다. */
export const ThemeToggle = ({
  mode,
  onChange,
}: {
  mode: ThemeName;
  onChange: (m: ThemeName) => void;
}) => (
  <View style={styles.toggleRow}>
    {themes.map((t) => {
      const active = mode === t.name;
      return (
        <Pressable
          key={t.name}
          onPress={() => onChange(t.name)}
          style={[styles.toggleButton, active && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
            {capitalize(t.name)}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#1e293b',
    padding: 4,
    alignSelf: 'flex-start',
  },
  toggleButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  toggleButtonActive: { backgroundColor: '#f8fafc' },
  toggleText: { color: '#cbd5e1', fontSize: 13, fontWeight: '500' },
  toggleTextActive: { color: '#0f172a' },
});
