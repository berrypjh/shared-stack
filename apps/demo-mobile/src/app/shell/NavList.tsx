import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NAV, type SectionKey } from './nav';
import { useDemoPalette } from './palette';

/**
 * 홈 목록. 그룹 제목 + 항목 행으로 섹션 11개를 한눈에 보여줍니다.
 *
 * 그룹 제목에 `header` 역할을 주는 것은 `Section` 과 같은 이유입니다 — VoiceOver 로터와
 * TalkBack 의 제목 이동이 RN 에서 구간을 건너뛰는 유일한 네이티브 수단입니다.
 *
 * 행의 접근 가능한 이름은 항목 이름 하나로 고정합니다. `accessibilityLabel` 을 주지 않으면
 * 설명 문장까지 이름에 합쳐져 스크린리더가 문단을 통째로 읽습니다. 설명은 눈으로 훑는 용도라
 * 두 줄에서 자르고, 전문은 상세 화면 헤더가 보여줍니다.
 */
export const NavList = ({ onSelect }: { onSelect: (key: SectionKey) => void }) => {
  const p = useDemoPalette();

  return (
    <View style={styles.root}>
      {NAV.map((group) => (
        <View key={group.label} style={styles.group}>
          <Text accessibilityRole="header" style={[styles.groupLabel, { color: p.muted }]}>
            {group.label}
          </Text>

          <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
            {group.items.map((item, index) => (
              <Pressable
                key={item.key}
                accessible
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityHint="자세히 보기"
                onPress={() => onSelect(item.key)}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: p.border,
                  },
                  pressed && { backgroundColor: p.page },
                ]}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: p.title }]}>{item.label}</Text>
                  <Text numberOfLines={2} style={[styles.rowDescription, { color: p.body }]}>
                    {item.description}
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: p.muted }]}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { paddingBottom: 8 },
  group: { marginBottom: 18 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  rowText: { flex: 1, gap: 3 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowDescription: { fontSize: 12, lineHeight: 17 },
  chevron: { fontSize: 20, lineHeight: 20 },
});
