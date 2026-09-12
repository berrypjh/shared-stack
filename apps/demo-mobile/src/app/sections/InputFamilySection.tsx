import { useState } from 'react';
import { Text, View } from 'react-native';

import { BoxedInput, FilledInput, IconButton, PlainInput } from '@berrypjh/react-native-ui';

import { Column } from '../shell/layout';
import { useDemoPalette } from '../shell/palette';
import { Caption, Label } from '../shell/Section';

/**
 * Input 계열 데모.
 *
 * 값 상태는 데모가 들고 있습니다 — controlled는 `value` + `onChangeText`, uncontrolled는
 * `defaultValue`. 레이블은 `accessibilityLabel`로 줍니다 (placeholder는 이름이 되지 못합니다).
 */
export const InputFamilySection = () => {
  const p = useDemoPalette();
  const [email, setEmail] = useState('');
  const [memo, setMemo] = useState('');
  const [search, setSearch] = useState('');

  return (
    <View>
      <Label>PlainInput — 밑줄만</Label>
      <Column>
        <PlainInput accessibilityLabel="이름 (small)" placeholder="이름 · size sm" size="sm" />
        <PlainInput accessibilityLabel="이름 (medium)" placeholder="이름 · size md" size="md" />
      </Column>

      <Label>FilledInput — 채워진 표면</Label>
      <Column>
        <FilledInput
          accessibilityLabel="이메일"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FilledInput
          accessibilityLabel="보조 색 필드"
          placeholder="focus 하면 secondary 색"
          color="secondary"
        />
        <FilledInput accessibilityLabel="비활성 필드" placeholder="disabled" disabled />
      </Column>
      <Caption>controlled 값: {email || '(비어 있음)'}</Caption>

      <Label>BoxedInput — 윤곽선만</Label>
      <Column>
        <BoxedInput accessibilityLabel="닉네임" defaultValue="berry" />
        <BoxedInput accessibilityLabel="읽기 전용 사용자명" defaultValue="berrypjh" readOnly />
        <BoxedInput accessibilityLabel="쿠폰 코드" placeholder="코드를 확인해 주세요" error />
      </Column>
      <Caption>
        위에서부터 uncontrolled(defaultValue) · readOnly · error 입니다. readOnly 는 편집만 막고
        비활성으로 알리지 않습니다.
      </Caption>

      <Label>multiline · 장식</Label>
      <Column>
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
          value={search}
          onChangeText={setSearch}
          startAdornment={
            // 장식이라 접근성 트리에서 감춥니다 — 이름은 accessibilityLabel 이 줍니다.
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{ color: p.muted }}
            >
              ⌕
            </Text>
          }
          endAdornment={
            search ? (
              <IconButton
                accessibilityLabel="검색어 지우기"
                size="sm"
                icon={({ color }) => <Text style={{ color }}>✕</Text>}
                onPress={() => setSearch('')}
              />
            ) : undefined
          }
        />
      </Column>
      <Caption>
        장식은 받은 노드를 그대로 렌더합니다. 상호작용 가능한 장식은 입력과 별개로 눌리고 읽힙니다.
      </Caption>
    </View>
  );
};
