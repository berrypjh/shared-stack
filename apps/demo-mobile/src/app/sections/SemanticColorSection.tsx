import { StyleSheet, Text, View } from 'react-native';

import { useDemoPalette } from '../shell/palette';
import { Caption, Label } from '../shell/Section';

/** `text.*` 는 카드 배경 위에서 보여줍니다 — 그것이 이 토큰들이 대비를 맞추도록 설계된 면입니다. */
const TextSample = ({ name, value, color }: { name: string; value: string; color: string }) => (
  <View style={styles.textRow}>
    <Text style={[styles.textSample, { color }]}>{name}</Text>
    <Text style={[styles.textValue, { color }]}>{value}</Text>
  </View>
);

/** 색을 보여주는 칩. 글자는 배경 휘도에 맞춰 고릅니다. */
const Chip = ({ name, hex }: { name: string; hex: string }) => {
  const p = useDemoPalette();

  return (
    <View style={[styles.chip, { backgroundColor: hex }]}>
      <Text style={[styles.chipText, { color: p.readableOn(hex) }]}>{name}</Text>
    </View>
  );
};

/** semantic 색. 테마를 바꾸면 여기 값이 따라 바뀝니다. */
export const SemanticColorSection = () => {
  const p = useDemoPalette();
  const { text, background } = p.color;

  return (
    <View>
      <Label>text — 테마별 자동 반전</Label>
      <View style={styles.textCard}>
        <TextSample name="text.default" value={text.default} color={text.default} />
        <TextSample name="text.light" value={text.light} color={text.light} />
        <TextSample name="text.placeholder" value={text.placeholder} color={text.placeholder} />
        <TextSample name="text.primary" value={text.primary} color={text.primary} />
      </View>

      <Label>background — 의미 기반</Label>
      <View style={styles.chipRow}>
        {(['primary', 'secondary', 'success', 'warning', 'error'] as const).map((k) => (
          <Chip key={k} name={k} hex={background[k]} />
        ))}
      </View>
      <Caption>칩 글자색은 배경 휘도로 고릅니다 — 고정 흰색을 쓰면 밝은 배경에서 묻힙니다.</Caption>
    </View>
  );
};

const styles = StyleSheet.create({
  textCard: { gap: 8 },
  textRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  textSample: { fontSize: 14, fontWeight: '600' },
  textValue: { fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '700' },
});
