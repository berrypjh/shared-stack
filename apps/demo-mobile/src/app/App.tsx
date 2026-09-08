import { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { ThemeName, ThemeProvider } from '@berrypjh/react-native-ui';

import { BoxSection } from './sections/BoxSection';
import { ButtonFamilySection } from './sections/ButtonFamilySection';
import { ColorScaleSection } from './sections/ColorScaleSection';
import { InputFamilySection } from './sections/InputFamilySection';
import { SemanticColorSection } from './sections/SemanticColorSection';
import { ThemeTokensSection } from './sections/ThemeTokensSection';
import { useDemoPalette } from './shell/palette';
import { Section } from './shell/Section';
import { ThemeToggle } from './shell/ThemeToggle';

/** 어두운 테마인지 — StatusBar 글자색을 고르는 데만 씁니다. */
const DARK_MODES: ReadonlySet<string> = new Set(['dark', 'midnight', 'ember', 'amber']);

/** 섹션을 순서대로 쌓는 스크롤 본문. `ThemeProvider` 안에서만 렌더됩니다. */
const Body = ({ mode }: { mode: ThemeName; onChange: (m: ThemeName) => void }) => {
  const p = useDemoPalette();

  return (
    <>
      <View style={[styles.header, { backgroundColor: p.card, borderBottomColor: p.border }]}>
        <Text style={[styles.title, { color: p.title }]}>React Native UI</Text>
        <Text style={[styles.subtitle, { color: p.body }]}>
          @berrypjh/react-native-ui · 토큰과 컴포넌트 데모
        </Text>
      </View>

      <Section
        title="Input 계열"
        description="PlainInput · FilledInput · BoxedInput. TextInput 하나를 감싸며 값은 문자열, 콜백은 onChangeText 입니다."
      >
        <InputFamilySection />
      </Section>

      <Section
        title="Button 계열"
        description="Button · Fab · IconButton. Pressable 기반이고 disabled·loading 은 접근성 상태로도 알립니다."
      >
        <ButtonFamilySection />
      </Section>

      <Section
        title="Box"
        description="토큰 prop 만으로 배경·모서리·여백을 주는 레이아웃 컴포넌트입니다."
      >
        <BoxSection />
      </Section>

      <Section title="Semantic color" description="테마를 바꾸면 따라 바뀌는 의미 기반 색입니다.">
        <SemanticColorSection />
      </Section>

      <Section title="Color scale" description="테마와 무관하게 고정인 primitive 팔레트입니다.">
        <ColorScaleSection />
      </Section>

      <Section title="테마 토큰" description="useTheme() 으로 런타임에 조회한 값입니다.">
        <ThemeTokensSection mode={mode} />
      </Section>

      <View style={styles.footerSpace} />
    </>
  );
};

/** 테마 전환 바 + 본문. 팔레트를 쓰려면 `ThemeProvider` 안이어야 합니다. */
const Screen = ({ mode, onChange }: { mode: ThemeName; onChange: (m: ThemeName) => void }) => {
  const p = useDemoPalette();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: p.page }]}>
      <StatusBar barStyle={DARK_MODES.has(mode) ? 'light-content' : 'dark-content'} />
      <View style={[styles.toggleBar, { backgroundColor: p.page, borderBottomColor: p.border }]}>
        <ThemeToggle mode={mode} onChange={onChange} />
      </View>
      <ScrollView
        style={{ backgroundColor: p.page }}
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
      >
        <Body mode={mode} onChange={onChange} />
      </ScrollView>
    </SafeAreaView>
  );
};

export const App = () => {
  const [mode, setMode] = useState<ThemeName>('light');

  return (
    <ThemeProvider mode={mode}>
      <Screen mode={mode} onChange={setMode} />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  toggleBar: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  scrollBody: { paddingTop: 14 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  footerSpace: { height: 40 },
});

export default App;
