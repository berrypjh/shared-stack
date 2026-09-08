import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { ThemeName, ThemeProvider, useTheme } from '@berrypjh/react-native-ui';

import { BoxSection } from './sections/BoxSection';
import { ButtonFamilySection } from './sections/ButtonFamilySection';
import { ColorScaleSection } from './sections/ColorScaleSection';
import { InputFamilySection } from './sections/InputFamilySection';
import { SemanticColorSection } from './sections/SemanticColorSection';
import { ThemeTokensSection } from './sections/ThemeTokensSection';
import { Section } from './shell/Section';
import { ThemeToggle } from './shell/ThemeToggle';

/** 섹션을 순서대로 쌓는 스크롤 본문. `ThemeProvider` 안에서만 렌더됩니다. */
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
        <ColorScaleSection />
      </Section>
      <Section title="Color (semantic, 테마 전환 시 변화)">
        <SemanticColorSection />
      </Section>
      <Section title="Button 계열 (Button · Fab · IconButton)">
        <ButtonFamilySection />
      </Section>
      <Section title="Input 계열 (PlainInput · FilledInput · BoxedInput)">
        <InputFamilySection />
      </Section>
      <Section title="Box 컴포넌트">
        <BoxSection />
      </Section>
      <Section title="테마 토큰">
        <ThemeTokensSection mode={mode} />
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
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  footerSpace: { height: 32 },
});

export default App;
