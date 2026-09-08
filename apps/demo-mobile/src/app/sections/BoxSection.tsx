import { StyleSheet, Text, View } from 'react-native';

import { Box } from '@berrypjh/react-native-ui';

import { useDemoPalette } from '../shell/palette';
import { Caption, Label } from '../shell/Section';

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

      <Label>숫자는 원시 길이 — px 문자열이 아닙니다</Label>
      <Box bg="neutral.ne200" radius={6} p={24}>
        <Text style={[styles.label, { color: p.readableOn(p.hexAt('neutral.ne200')) }]}>
          p={'{24}'} radius={'{6}'}
        </Text>
      </Box>
      <Caption>
        web 은 같은 숫자를 `24px` 로 읽고 RN 은 밀도 독립 원시 값으로 읽습니다 — 뜻은 같고 단위
        표현만 렌더러를 따릅니다.
      </Caption>

      <Label>우선순위: 방향 &gt; 축 &gt; 공통</Label>
      <Box bg="primary.pr500" radius="md" p={8} px={24} pt={40}>
        <Text style={[styles.label, { color: p.readableOn(p.hexAt('primary.pr500')) }]}>
          p={'{8}'} px={'{24}'} pt={'{40}'}
        </Text>
      </Box>
      <Caption>
        위 40(pt) · 좌우 24(px) · 아래 8(p). 지정하지 않은 축은 건드리지 않습니다 — 0 이 주입되는
        것이 아닙니다.
      </Caption>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: 10 },
  label: { fontSize: 13, fontWeight: '600' },
});
