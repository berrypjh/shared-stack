import { useState } from 'react';
import { View } from 'react-native';

import { TextField } from '@berrypjh/react-native-ui';

import { Caption, Label } from '../shell/Section';
import { demoStyles } from '../shell/styles';

/**
 * TextField 데모 — 합성 계층.
 *
 * FormControl · InputLabel · Input · FormHelperText 를 한 번에 세웁니다. 값도 포커스도
 * chrome 도 TextField 가 소유하지 않습니다.
 *
 * **문자열 `label` 은 입력의 접근 가능한 이름이 됩니다.** 독립 `InputLabel` 과 다른 점입니다 —
 * 합성 계층이라 라벨 문자열을 입력의 `accessibilityLabel` 로 넘겨줄 수 있습니다. 라벨이 노드거나
 * 없으면 타입이 `accessibilityLabel` 을 요구합니다.
 *
 * 헬퍼는 **보이는 텍스트까지만** 보장합니다. 입력의 설명으로 자동 연결되지 않습니다.
 */
export const TextFieldSection = () => {
  const [nickname, setNickname] = useState('');

  return (
    <View>
      <Label>문자열 label — 이름이 자동으로 붙는다</Label>
      <View style={demoStyles.stack}>
        <TextField label="이름" placeholder="홍길동" helperText="실명을 입력하세요" />
      </View>
      <Caption>
        라벨 문자열이 입력의 accessibilityLabel 이 됩니다. 헬퍼는 눈에 보이지만 입력의 설명으로
        연결되지는 않습니다.
      </Caption>

      <Label>보이는 라벨과 말하는 이름이 다를 때</Label>
      <View style={demoStyles.stack}>
        <TextField
          label="ID"
          accessibilityLabel="사용자 아이디"
          placeholder="berrypjh"
          helperText="영문 소문자와 숫자만"
        />
      </View>
      <Caption>화면에는 &quot;ID&quot;, 스크린 리더에는 &quot;사용자 아이디&quot;.</Caption>

      <Label>controlled 값</Label>
      <View style={demoStyles.stack}>
        <TextField
          label="닉네임"
          value={nickname}
          onChangeText={setNickname}
          placeholder="두 글자 이상"
          variant="filled"
        />
      </View>
      <Caption>값: {nickname || '(비어 있음)'} — 상태는 데모가 가집니다</Caption>

      <Label>required — 시각 표시일 뿐</Label>
      <View style={demoStyles.stack}>
        <TextField label="이메일" required placeholder="you@example.com" />
      </View>
      <Caption>
        별표는 라벨 텍스트의 일부로 읽힙니다. RN AccessibilityState 에 required 필드가 없고 폼
        검증도 없습니다.
      </Caption>

      <Label>error — chrome·라벨·헬퍼가 함께</Label>
      <View style={demoStyles.stack}>
        <TextField
          label="쿠폰 코드"
          error
          defaultValue="EXPIRED-2024"
          helperText="만료된 코드입니다"
        />
      </View>
      <Caption>오류 문구는 자동으로 읽히지 않습니다 — live region 이 아닙니다.</Caption>

      <Label>readOnly 와 disabled 는 다르다</Label>
      <View style={demoStyles.stack}>
        <TextField label="주문 번호" readOnly defaultValue="ORD-20260908" />
        <TextField label="가입 경로" disabled defaultValue="초대 링크" helperText="변경 불가" />
      </View>
      <Caption>
        둘 다 편집을 막지만 disabled 만 비활성으로 알리고 disabled 토큰 색을 씁니다.
      </Caption>

      <Label>multiline — TextInput 하나 그대로</Label>
      <View style={demoStyles.stack}>
        <TextField
          label="메모"
          multiline
          numberOfLines={3}
          placeholder="여러 줄 입력"
          size="sm"
          fullWidth
        />
      </View>
      <Caption>테마를 바꾸면 라벨·헬퍼·테두리가 모두 토큰을 따라 움직입니다.</Caption>
    </View>
  );
};
