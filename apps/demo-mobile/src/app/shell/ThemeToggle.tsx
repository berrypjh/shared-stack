import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { ThemeName, themes } from '@berrypjh/react-native-ui';

import { useDemoPalette } from './palette';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * 등록된 테마를 모두 나열하는 칩 목록. 값은 `themes` 레지스트리에서 옵니다.
 *
 * 테마가 7개라 좁은 화면에서 줄바꿈되거나 잘리므로 가로 스크롤로 둡니다.
 * 색은 팔레트에서 옵니다 — 예전에는 `#1e293b`·`#f8fafc` 가 하드코딩돼 있어서
 * 어떤 테마를 골라도 토글만 어두운 색으로 남았습니다.
 */
export const ThemeToggle = ({
  mode,
  onChange,
}: {
  mode: ThemeName;
  onChange: (m: ThemeName) => void;
}) => {
  const p = useDemoPalette();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {themes.map((t) => {
        const active = mode === t.name;

        return (
          <Pressable
            key={t.name}
            onPress={() => onChange(t.name)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${capitalize(t.name)} 테마`}
            style={[
              styles.chip,
              {
                backgroundColor: active ? p.accent : p.card,
                borderColor: active ? p.accent : p.border,
              },
            ]}
          >
            <Text style={[styles.text, { color: active ? p.readableOn(p.accent) : p.title }]}>
              {capitalize(t.name)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { fontSize: 13, fontWeight: '600' },
});
