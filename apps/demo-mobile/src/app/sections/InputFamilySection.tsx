import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  BoxedInput,
  FilledInput,
  IconButton,
  PlainInput,
  useTheme,
} from '@berrypjh/react-native-ui';

import { demoStyles } from '../shell/styles';

/**
 * Input 계열 데모.
 *
 * 값 상태는 데모가 들고 있습니다 — controlled는 `value` + `onChangeText`, uncontrolled는
 * `defaultValue`. 레이블은 `accessibilityLabel`로 줍니다 (placeholder는 이름이 되지 못합니다).
 */
export const InputFamilySection = () => {
  const theme = useTheme();
  const fg = theme.tokens.color.text.default;
  const [email, setEmail] = useState('');
  const [memo, setMemo] = useState('');

  return (
    <View>
      <Text style={demoStyles.sectionLabel}>PlainInput — 밑줄만. size sm / md</Text>
      <View style={styles.demoStack}>
        <PlainInput accessibilityLabel="이름 (small)" placeholder="이름" size="sm" />
        <PlainInput accessibilityLabel="이름 (medium)" placeholder="이름" size="md" />
      </View>

      <Text style={demoStyles.sectionLabel}>FilledInput — controlled value, color, disabled</Text>
      <View style={styles.demoStack}>
        <FilledInput
          accessibilityLabel="이메일"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FilledInput accessibilityLabel="보조 색 필드" placeholder="secondary" color="secondary" />
        <FilledInput accessibilityLabel="비활성 필드" placeholder="disabled" disabled />
      </View>
      <Text style={[demoStyles.tokenLabel, { color: fg }]}>
        controlled 값: {email || '(비어 있음)'}
      </Text>

      <Text style={demoStyles.sectionLabel}>BoxedInput — defaultValue, readOnly, error</Text>
      <View style={styles.demoStack}>
        <BoxedInput accessibilityLabel="닉네임 (uncontrolled)" defaultValue="berry" />
        <BoxedInput accessibilityLabel="읽기 전용 사용자명" defaultValue="berrypjh" readOnly />
        <BoxedInput accessibilityLabel="쿠폰 코드" placeholder="코드를 확인해 주세요" error />
      </View>

      <Text style={demoStyles.sectionLabel}>multiline · 장식(adornment)</Text>
      <View style={styles.demoStack}>
        <BoxedInput
          accessibilityLabel="메모"
          placeholder="여러 줄 입력"
          multiline
          value={memo}
          onChangeText={setMemo}
        />
        <FilledInput
          accessibilityLabel="검색어"
          placeholder="검색"
          startAdornment={
            // 장식이라 접근성 트리에서 감춥니다.
            <Text accessibilityElementsHidden importantForAccessibility="no" style={{ color: fg }}>
              ⌕
            </Text>
          }
          endAdornment={
            <IconButton
              accessibilityLabel="검색어 지우기"
              size="sm"
              icon={<Text style={{ color: fg }}>×</Text>}
              onPress={() => undefined}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  demoStack: { gap: 12, marginBottom: 8 },
});
