import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Fab, IconButton, useTheme } from '@berrypjh/react-native-ui';

import { demoStyles } from '../shell/styles';

/**
 * Button 계열 데모.
 *
 * 공개 패키지 import만 씁니다 — 소비자가 실제로 쓰는 경로를 확인하는 층입니다.
 * 아이콘 규약이 없어 글리프 `<Text>`로 둡니다.
 */
export const ButtonFamilySection = () => {
  const theme = useTheme();
  const [pressCount, setPressCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fg = theme.tokens.color.text.default;

  const onSubmit = () => {
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 1200);
  };

  return (
    <View>
      <Text style={demoStyles.sectionLabel}>variant — contained / outlined / text</Text>
      <View style={styles.demoRow}>
        <Button variant="contained" onPress={() => setPressCount((n) => n + 1)}>
          Contained
        </Button>
        <Button variant="outlined" onPress={() => setPressCount((n) => n + 1)}>
          Outlined
        </Button>
        <Button variant="text" onPress={() => setPressCount((n) => n + 1)}>
          Text
        </Button>
      </View>
      <Text style={[demoStyles.tokenLabel, { color: fg }]}>onPress 횟수: {pressCount}</Text>

      <Text style={demoStyles.sectionLabel}>size — sm / md / lg</Text>
      <View style={styles.demoRow}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </View>

      <Text style={demoStyles.sectionLabel}>color — primary / secondary</Text>
      <View style={styles.demoRow}>
        <Button color="primary">Primary</Button>
        <Button color="secondary">Secondary</Button>
        <Button variant="outlined" color="secondary">
          Secondary outlined
        </Button>
      </View>

      <Text style={demoStyles.sectionLabel}>icon slots · disabled</Text>
      <View style={styles.demoRow}>
        <Button startIcon={<Text>←</Text>}>Back</Button>
        <Button endIcon={<Text>→</Text>}>Next</Button>
        <Button disabled>Disabled</Button>
      </View>

      <Text style={demoStyles.sectionLabel}>loading — start / center / end</Text>
      <View style={styles.demoRow}>
        <Button loading loadingPosition="start">
          Start
        </Button>
        <Button loading loadingPosition="center">
          Center
        </Button>
        <Button loading loadingPosition="end">
          End
        </Button>
      </View>

      <Text style={demoStyles.sectionLabel}>실제 상호작용 — 누르면 1.2초 동안 loading</Text>
      <View style={styles.demoRow}>
        <Button loading={submitting} onPress={onSubmit} fullWidth>
          {submitting ? '제출 중…' : '제출하기'}
        </Button>
      </View>

      <Text style={demoStyles.sectionLabel}>Fab — circular / extended</Text>
      <View style={styles.demoRow}>
        <Fab icon={<Text>+</Text>} accessibilityLabel="추가" onPress={() => setPressCount(0)} />
        <Fab icon={<Text>+</Text>} accessibilityLabel="추가 (secondary)" color="secondary" />
        <Fab icon={<Text>+</Text>} accessibilityLabel="추가 (비활성)" disabled />
      </View>
      <View style={styles.demoRow}>
        <Fab shape="extended" icon={<Text>+</Text>}>
          만들기
        </Fab>
        <Fab shape="extended" color="secondary">
          카운터 초기화
        </Fab>
      </View>

      <Text style={demoStyles.sectionLabel}>IconButton — accessibilityLabel 은 필수다</Text>
      <View style={styles.demoRow}>
        <IconButton
          icon={({ color }) => <Text style={{ color }}>★</Text>}
          accessibilityLabel="즐겨찾기"
          onPress={() => setPressCount((n) => n + 1)}
        />
        <IconButton
          icon={({ color }) => <Text style={{ color }}>★</Text>}
          accessibilityLabel="즐겨찾기 (secondary)"
          color="secondary"
        />
        <IconButton
          icon={({ color }) => <Text style={{ color }}>★</Text>}
          accessibilityLabel="즐겨찾기 (비활성)"
          disabled
        />
        <IconButton icon={<Text>★</Text>} accessibilityLabel="저장 중" loading />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
});
