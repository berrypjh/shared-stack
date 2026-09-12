import { useEffect, useState } from 'react';
import {
  BackHandler,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ThemeName, ThemeProvider } from '@berrypjh/react-native-ui';

import type { ReactNode } from 'react';

import { AvatarSection } from './sections/AvatarSection';
import { BadgeSection } from './sections/BadgeSection';
import { BoxSection } from './sections/BoxSection';
import { ButtonFamilySection } from './sections/ButtonFamilySection';
import { ChipSection } from './sections/ChipSection';
import { ColorScaleSection } from './sections/ColorScaleSection';
import { DividerSection } from './sections/DividerSection';
import { FormArchitectureSection } from './sections/FormArchitectureSection';
import { InputFamilySection } from './sections/InputFamilySection';
import { SearchFieldSection } from './sections/SearchFieldSection';
import { SegmentControlSection } from './sections/SegmentControlSection';
import { SelectionControlSection } from './sections/SelectionControlSection';
import { SelectSection } from './sections/SelectSection';
import { SemanticColorSection } from './sections/SemanticColorSection';
import { StackSection } from './sections/StackSection';
import { TextFieldSection } from './sections/TextFieldSection';
import { ThemeTokensSection } from './sections/ThemeTokensSection';
import { DetailBar } from './shell/DetailBar';
import { itemFor, type SectionKey } from './shell/nav';
import { NavList } from './shell/NavList';
import { useDemoPalette } from './shell/palette';
import { Section } from './shell/Section';
import { ThemeToggle } from './shell/ThemeToggle';

/** 어두운 테마인지 — StatusBar 글자색을 고르는 데만 씁니다. */
const DARK_MODES: ReadonlySet<string> = new Set(['dark', 'midnight', 'ember', 'amber']);

/**
 * 키 → 섹션 본문.
 *
 * `Record<SectionKey, ...>` 라서 `SectionKey` 에 키를 추가하면 여기가 컴파일 에러를 냅니다 —
 * 목록에는 보이는데 열면 빈 화면인 상태를 타입이 막습니다. `ThemeTokensSection` 만 mode 가
 * 필요해서 전부 함수로 통일했습니다.
 */
const SECTIONS: Record<SectionKey, (mode: ThemeName) => ReactNode> = {
  'input-family': () => <InputFamilySection />,
  'form-architecture': () => <FormArchitectureSection />,
  'text-field': () => <TextFieldSection />,
  'search-field': () => <SearchFieldSection />,
  select: () => <SelectSection />,
  'segment-control': () => <SegmentControlSection />,
  'selection-control': () => <SelectionControlSection />,
  'button-family': () => <ButtonFamilySection />,
  box: () => <BoxSection />,
  stack: () => <StackSection />,
  divider: () => <DividerSection />,
  avatar: () => <AvatarSection />,
  badge: () => <BadgeSection />,
  chip: () => <ChipSection />,
  'semantic-color': () => <SemanticColorSection />,
  'color-scale': () => <ColorScaleSection />,
  'theme-tokens': (mode) => <ThemeTokensSection mode={mode} />,
};

/** 홈 — 소개 카드 + 섹션 목록. */
const Home = ({ onSelect }: { onSelect: (key: SectionKey) => void }) => {
  const p = useDemoPalette();

  return (
    <>
      <View style={[styles.header, { backgroundColor: p.card, borderBottomColor: p.border }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: p.title }]}>
          React Native UI
        </Text>
        <Text style={[styles.subtitle, { color: p.body }]}>
          @berrypjh/react-native-ui · 토큰과 컴포넌트 데모
        </Text>
      </View>

      <NavList onSelect={onSelect} />
    </>
  );
};

/** 상세 — 고른 섹션 하나만. 제목·설명은 목록과 같은 출처(`nav.ts`)에서 옵니다. */
const Detail = ({ activeKey, mode }: { activeKey: SectionKey; mode: ThemeName }) => {
  const item = itemFor(activeKey);

  return (
    <Section title={item.label} description={item.description}>
      {SECTIONS[activeKey](mode)}
    </Section>
  );
};

/** 테마 전환 바 + 본문. 팔레트를 쓰려면 `ThemeProvider` 안이어야 합니다. */
const Screen = ({ mode, onChange }: { mode: ThemeName; onChange: (m: ThemeName) => void }) => {
  const p = useDemoPalette();
  const [activeKey, setActiveKey] = useState<SectionKey | null>(null);

  /**
   * Android 하드웨어 back 은 기본적으로 앱을 종료합니다. 상세를 열었을 때만 가로채서
   * 목록으로 돌립니다 — 홈에서는 구독하지 않아 종료 동작이 그대로 남습니다.
   */
  useEffect(() => {
    if (activeKey == null) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveKey(null);
      return true;
    });

    return () => subscription.remove();
  }, [activeKey]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: p.page }]}>
      <StatusBar barStyle={DARK_MODES.has(mode) ? 'light-content' : 'dark-content'} />

      <View style={[styles.toggleBar, { backgroundColor: p.page, borderBottomColor: p.border }]}>
        <ThemeToggle mode={mode} onChange={onChange} />
      </View>

      {activeKey != null && (
        <DetailBar title={itemFor(activeKey).label} onBack={() => setActiveKey(null)} />
      )}

      {/*
        `key` 로 화면이 바뀔 때마다 ScrollView 를 새로 만듭니다. 재사용하면 목록에서
        내려둔 스크롤 위치가 상세에 그대로 남아 중간부터 보입니다.
      */}
      <ScrollView
        key={activeKey ?? 'home'}
        style={{ backgroundColor: p.page }}
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
      >
        {activeKey == null ? (
          <Home onSelect={setActiveKey} />
        ) : (
          <Detail activeKey={activeKey} mode={mode} />
        )}
        <View style={styles.footerSpace} />
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
    marginBottom: 18,
    borderRadius: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  footerSpace: { height: 40 },
});

export default App;
