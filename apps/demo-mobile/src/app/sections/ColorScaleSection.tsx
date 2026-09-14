import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useDemoPalette } from '../shell/palette';
import { Label } from '../shell/Section';

/**
 * primitive 색 스케일. 테마와 무관하게 같은 값이어야 합니다.
 *
 * 이름과 hex 는 색 블록 **위가 아니라 아래**, 카드 배경에 놓습니다. 임의의 스케일 색
 * (`ne100` 처럼 아주 밝은 값 포함) 위에 글자를 얹으면 대비를 보장할 수 없습니다.
 */
const Swatch = ({ name, hex }: { name: string; hex: string }) => {
  const p = useDemoPalette();

  return (
    <View style={styles.col}>
      <View style={[styles.block, { backgroundColor: hex, borderColor: p.border }]} />
      <Text style={[styles.name, { color: p.title }]}>{name}</Text>
      <Text style={[styles.hex, { color: p.muted }]}>{hex}</Text>
    </View>
  );
};

const Scale = ({ label, scale }: { label: string; scale: Record<string, string> }) => (
  <>
    <Label>{label}</Label>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row}>
        {Object.entries(scale).map(([key, hex]) => (
          <Swatch key={key} name={key} hex={hex} />
        ))}
      </View>
    </ScrollView>
  </>
);

export const ColorScaleSection = () => {
  const p = useDemoPalette();

  return (
    <View>
      <Scale label="primary" scale={p.color.primary} />
      <Scale label="neutral" scale={p.color.neutral} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  col: { width: 62 },
  block: { height: 44, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  name: { fontSize: 11, marginTop: 6, fontWeight: '600' },
  hex: { fontSize: 10, marginTop: 1 },
});
