import { StyleSheet, Text, View } from 'react-native';

import { Box } from '@berrypjh/react-native-ui';

import { useDemoPalette } from '../shell/palette';
import { Caption } from '../shell/Section';

const SAMPLES = [
  { bg: 'primary.pr500', radius: 'md', p: 'md' },
  { bg: 'secondary.se500', radius: 'lg', p: 'lg' },
  { bg: 'success.su500', radius: 'rounded', p: 'md' },
  { bg: 'neutral.ne200', radius: 'sm', p: 'md' },
] as const;

/**
 * 토큰 prop 만으로 배경·radius·여백을 주는 레이아웃 컴포넌트.
 *
 * 글자색은 배경 휘도로 고릅니다 — 예전에는 네 개 모두 흰색 고정이라 `neutral.ne200`
 * 위에서 대비가 1.18:1 까지 떨어졌습니다.
 */
export const BoxSection = () => {
  const p = useDemoPalette();

  return (
    <View style={styles.stack}>
      {SAMPLES.map((sample) => (
        <Box key={sample.bg} bg={sample.bg} radius={sample.radius} p={sample.p}>
          <Text style={[styles.label, { color: p.readableOn(p.hexAt(sample.bg)) }]}>
            bg=&quot;{sample.bg}&quot; radius=&quot;{sample.radius}&quot; p=&quot;{sample.p}&quot;
          </Text>
        </Box>
      ))}
      <Caption>
        배경은 토큰 경로로 지정하고, 글자색은 그 배경 휘도에 맞춰 자동으로 정합니다.
      </Caption>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: 10 },
  label: { fontSize: 13, fontWeight: '600' },
});
