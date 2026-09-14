import { useState } from 'react';
import { View } from 'react-native';

import {
  BoxedInput,
  FilledInput,
  FormControl,
  FormHelperText,
  InputLabel,
  PlainInput,
} from '@berrypjh/react-native-ui';

import { Column } from '../shell/layout';
import { Caption, Label } from '../shell/Section';

/**
 * FormControl · InputLabel · FormHelperText 데모.
 *
 * FormControl 은 `color`·`size`·`disabled`·`error`·`fullWidth` 를 자손에게 내려보내고,
 * Input 의 focus/blur 를 받아 라벨·테두리를 함께 움직입니다.
 *
 * **보이는 라벨이 입력의 접근 가능한 이름을 만들지 않습니다.** RN 에는 교차 플랫폼 라벨 연결
 * 수단이 없어서(`accessibilityLabelledBy` 는 Android 전용), 모든 입력에 `accessibilityLabel`
 * 을 따로 줍니다. 헬퍼 텍스트도 입력의 설명으로 자동 연결되지 않습니다.
 */
export const FormArchitectureSection = () => {
  const [email, setEmail] = useState('');
  const [memo, setMemo] = useState('');

  return (
    <View>
      <Label>FormControl + InputLabel + PlainInput</Label>
      <Column>
        <FormControl>
          <InputLabel>이름</InputLabel>
          <PlainInput accessibilityLabel="이름" placeholder="홍길동" />
        </FormControl>
      </Column>
      <Caption>입력을 누르면 라벨과 밑줄이 함께 focus 색으로 바뀝니다.</Caption>

      <Label>required 라벨 — 시각 표시일 뿐</Label>
      <Column>
        <FormControl required>
          <InputLabel>이메일</InputLabel>
          <BoxedInput accessibilityLabel="이메일" placeholder="you@example.com" />
        </FormControl>
      </Column>
      <Caption>
        별표는 라벨 텍스트의 일부로 읽힙니다. RN 에는 `aria-required` 에 해당하는 수단이 없어 완전한
        필수 의미가 아닙니다.
      </Caption>

      <Label>FormControl + FilledInput + FormHelperText (controlled)</Label>
      <Column>
        <FormControl>
          <InputLabel>회사 이메일</InputLabel>
          <FilledInput
            accessibilityLabel="회사 이메일"
            placeholder="you@company.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormHelperText>회사 도메인 주소만 사용할 수 있습니다</FormHelperText>
        </FormControl>
      </Column>
      <Caption>값: {email || '(비어 있음)'} — 상태는 데모가 가집니다</Caption>

      <Label>error FormControl — chrome·라벨·헬퍼가 함께 error</Label>
      <Column>
        <FormControl error>
          <InputLabel>쿠폰 코드</InputLabel>
          <BoxedInput accessibilityLabel="쿠폰 코드" defaultValue="EXPIRED-2024" />
          <FormHelperText>만료된 코드입니다</FormHelperText>
        </FormControl>
      </Column>
      <Caption>
        오류는 시각 상태입니다. 헬퍼가 입력의 설명으로 자동 연결되지도, 자동으로 읽히지도 않습니다.
      </Caption>

      <Label>disabled — 상속</Label>
      <Column>
        <FormControl disabled>
          <InputLabel>사용자 ID</InputLabel>
          <BoxedInput accessibilityLabel="사용자 ID" defaultValue="berrypjh" />
          <FormHelperText>변경할 수 없습니다</FormHelperText>
        </FormControl>
      </Column>

      <Label>secondary · sm · fullWidth · multiline (uncontrolled)</Label>
      <Column>
        <FormControl color="secondary" size="sm" fullWidth>
          <InputLabel>메모</InputLabel>
          <BoxedInput
            accessibilityLabel="메모"
            placeholder="여러 줄 입력"
            multiline
            value={memo}
            onChangeText={setMemo}
          />
          <FormHelperText>secondary 색과 sm 크기를 함께 상속합니다</FormHelperText>
        </FormControl>
      </Column>
      <Caption>테마를 바꾸면 라벨·헬퍼·테두리 색이 모두 토큰을 따라 움직입니다.</Caption>
    </View>
  );
};
