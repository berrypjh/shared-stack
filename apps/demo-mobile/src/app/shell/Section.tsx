import { StyleSheet, Text, View } from 'react-native';

import type { ReactNode } from 'react';

import { useDemoPalette } from './palette';

/**
 * 제목과 설명이 붙은 카드형 데모 구역.
 *
 * 색은 전부 팔레트에서 옵니다 — 예전에는 `sectionTitle` 에 color 가 없어서 RN 기본값
 * (검정)이 되었고, 어두운 테마에서 제목이 보이지 않았습니다.
 */
export const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => {
  const p = useDemoPalette();

  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
      <Text style={[styles.title, { color: p.title }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: p.body }]}>{description}</Text>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
};

/** 카드 안에서 예시 묶음을 구분하는 소제목. */
export const Label = ({ children }: { children: ReactNode }) => {
  const p = useDemoPalette();

  return <Text style={[styles.label, { color: p.body }]}>{children}</Text>;
};

/** 값·설명을 한 줄로 보여주는 캡션. */
export const Caption = ({ children }: { children: ReactNode }) => {
  const p = useDemoPalette();

  return <Text style={[styles.caption, { color: p.muted }]}>{children}</Text>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '700' },
  description: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  body: { marginTop: 14 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 16,
    marginBottom: 8,
  },
  caption: { fontSize: 12, marginTop: 6, lineHeight: 16 },
});
