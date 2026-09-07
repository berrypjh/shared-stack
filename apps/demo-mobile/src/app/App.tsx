import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import {
  Box,
  Button,
  Fab,
  getColor,
  IconButton,
  ThemeName,
  ThemeProvider,
  themes,
  useTheme,
} from '@berrypjh/react-native-ui';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * 테마 토큰이 실제로 해석됐는지 보여주는 구역.
 * 테마가 덮어쓴 semantic color는 테마에 따라 바뀌고, 덮어쓰지 않은 값은 그대로다.
 */
const ThemeTokensDemo = ({ mode }: { mode: ThemeName }) => {
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
      <Text style={styles.sectionLabel}>resolved via useTheme() — theme: {mode}</Text>

      {rows.map(([label, value]) => (
        <View key={label} style={styles.tokenRow}>
          <View style={[styles.tokenChip, { backgroundColor: value }]} />
          <Text style={[styles.tokenLabel, { color: color.text.default }]}>
            {label} = {value}
          </Text>
        </View>
      ))}

      <Text style={styles.sectionLabel}>overridden semantic background</Text>
      <Box bg="background.primary" radius="md" p="lg" m="sm">
        <Text style={{ color: color.text.contrastText }}>
          Box bg=&quot;background.primary&quot; p=&quot;lg&quot; radius=&quot;md&quot;
        </Text>
      </Box>

      <Text style={styles.sectionLabel}>
        non-overridden scale — spacing.md={spacing.md} radius.lg={radius.lg}
      </Text>
      <Box bg="background.secondary" radius="lg" p="md" m="sm">
        <Text style={{ color: color.text.contrastText }}>spacing/radius must match Default</Text>
      </Box>
    </View>
  );
};

const ThemeToggle = ({ mode, onChange }: { mode: ThemeName; onChange: (m: ThemeName) => void }) => (
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

const Swatch = ({ name, hex }: { name: string; hex: string }) => (
  <View style={styles.swatchCol}>
    <View style={[styles.swatchBlock, { backgroundColor: hex }]} />
    <Text style={styles.swatchName}>{name}</Text>
    <Text style={styles.swatchHex}>{hex}</Text>
  </View>
);

const ColorScale = () => {
  const theme = useTheme();
  const primary = theme.tokens.color.primary;
  const neutral = theme.tokens.color.neutral;

  return (
    <View>
      <Text style={styles.sectionLabel}>primary scale</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.swatchRow}>
        {Object.entries(primary).map(([key, hex]) => (
          <Swatch key={key} name={key} hex={hex} />
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>neutral scale</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.swatchRow}>
        {Object.entries(neutral).map(([key, hex]) => (
          <Swatch key={key} name={key} hex={hex} />
        ))}
      </ScrollView>
    </View>
  );
};

const SemanticColors = () => {
  const theme = useTheme();
  const text = theme.tokens.color.text;
  const background = theme.tokens.color.background;

  return (
    <View>
      <Text style={styles.sectionLabel}>text.* (테마별 자동 반전)</Text>
      <View
        style={[
          styles.semanticCard,
          {
            backgroundColor: getColor(theme, 'background.dark' as never),
          },
        ]}
      >
        <Text style={{ color: text.default, fontSize: 16, fontWeight: '600' }}>
          text.default = {text.default}
        </Text>
        <Text style={{ color: text.light, marginTop: 4 }}>text.light = {text.light}</Text>
        <Text style={{ color: text.placeholder, marginTop: 4 }}>
          text.placeholder = {text.placeholder}
        </Text>
        <Text style={{ color: text.primary, marginTop: 4, fontWeight: '600' }}>
          text.primary = {text.primary}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>background.* swatches</Text>
      <View style={styles.bgRow}>
        {(['primary', 'secondary', 'success', 'warning', 'error'] as const).map((k) => (
          <View key={k} style={[styles.bgChip, { backgroundColor: background[k] }]}>
            <Text style={styles.bgChipText}>{k}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const BoxDemo = () => (
  <View>
    <Text style={styles.sectionLabel}>{`<Box> with token props`}</Text>
    <Box bg="primary.pr500" radius="md" p="md" m="sm">
      <Text style={{ color: '#fff' }}>
        bg=&quot;primary.pr500&quot; radius=&quot;md&quot; p=&quot;md&quot;
      </Text>
    </Box>
    <Box bg="secondary.se500" radius="lg" p="lg" m="sm">
      <Text style={{ color: '#fff' }}>
        bg=&quot;secondary.se500&quot; radius=&quot;lg&quot; p=&quot;lg&quot;
      </Text>
    </Box>
    <Box bg="success.su500" radius="rounded" p="md" m="sm">
      <Text style={{ color: '#fff' }}>bg=&quot;success.su500&quot; radius=&quot;rounded&quot;</Text>
    </Box>
    <Box bg="neutral.ne200" radius="sm" p="md" m="sm">
      <Text>raw token: bg=&quot;neutral.ne200&quot;</Text>
    </Box>
  </View>
);

/**
 * Button 계열 데모.
 *
 * 공개 패키지 import만 씁니다 — 소비자가 실제로 쓰는 경로를 확인하는 층입니다.
 * 아이콘 규약이 없어 글리프 `<Text>`로 둡니다.
 */
const ButtonFamilyDemo = () => {
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
      <Text style={styles.sectionLabel}>variant — contained / outlined / text</Text>
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
      <Text style={[styles.tokenLabel, { color: fg }]}>onPress 횟수: {pressCount}</Text>

      <Text style={styles.sectionLabel}>size — sm / md / lg</Text>
      <View style={styles.demoRow}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </View>

      <Text style={styles.sectionLabel}>color — primary / secondary</Text>
      <View style={styles.demoRow}>
        <Button color="primary">Primary</Button>
        <Button color="secondary">Secondary</Button>
        <Button variant="outlined" color="secondary">
          Secondary outlined
        </Button>
      </View>

      <Text style={styles.sectionLabel}>icon slots · disabled</Text>
      <View style={styles.demoRow}>
        <Button startIcon={<Text>←</Text>}>Back</Button>
        <Button endIcon={<Text>→</Text>}>Next</Button>
        <Button disabled>Disabled</Button>
      </View>

      <Text style={styles.sectionLabel}>loading — start / center / end</Text>
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

      <Text style={styles.sectionLabel}>실제 상호작용 — 누르면 1.2초 동안 loading</Text>
      <View style={styles.demoRow}>
        <Button loading={submitting} onPress={onSubmit} fullWidth>
          {submitting ? '제출 중…' : '제출하기'}
        </Button>
      </View>

      <Text style={styles.sectionLabel}>Fab — circular / extended</Text>
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

      <Text style={styles.sectionLabel}>IconButton — accessibilityLabel 은 필수다</Text>
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

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Body = ({ mode }: { mode: ThemeName }) => {
  const theme = useTheme();
  const bg = theme.tokens.color.background.dark;
  const fg = theme.tokens.color.text.default;

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.tokens.color.stroke.default }]}>
        <Text style={[styles.title, { color: fg }]}>@berrypjh/react-native-ui</Text>
        <Text style={[styles.subtitle, { color: theme.tokens.color.text.light }]}>
          mode: {mode} • RN JS 객체로 토큰을 runtime lookup
        </Text>
      </View>

      <Section title="Color (primitive scales)">
        <ColorScale />
      </Section>
      <Section title="Color (semantic, 테마 전환 시 변화)">
        <SemanticColors />
      </Section>
      <Section title="Button 계열 (Button · Fab · IconButton)">
        <ButtonFamilyDemo />
      </Section>
      <Section title="Box 컴포넌트">
        <BoxDemo />
      </Section>
      <Section title="테마 토큰">
        <ThemeTokensDemo mode={mode} />
      </Section>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
};

export const App = () => {
  const [mode, setMode] = useState<ThemeName>('light');

  return (
    <ThemeProvider mode={mode}>
      <View style={styles.appRoot}>
        <StatusBar barStyle={mode === 'light' ? 'dark-content' : 'light-content'} />
        <View style={styles.toggleBar}>
          <ThemeToggle mode={mode} onChange={setMode} />
        </View>
        <Body mode={mode} />
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  appRoot: { flex: 1 },
  toggleBar: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#1e293b',
    padding: 4,
    alignSelf: 'flex-start',
  },
  toggleButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  toggleButtonActive: { backgroundColor: '#f8fafc' },
  tokenRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tokenChip: { width: 28, height: 28, borderRadius: 6, marginRight: 10 },
  tokenLabel: { fontSize: 13 },
  toggleText: { color: '#cbd5e1', fontSize: 13, fontWeight: '500' },
  toggleTextActive: { color: '#0f172a' },

  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },

  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 6,
    opacity: 0.6,
  },

  swatchRow: { paddingVertical: 4 },
  swatchCol: { width: 64, marginRight: 8 },
  swatchBlock: {
    height: 40,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  swatchName: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  swatchHex: { fontSize: 9, opacity: 0.5 },

  semanticCard: {
    padding: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  bgRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  bgChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  bgChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  demoRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  footerSpace: { height: 32 },
});

export default App;
