import { useState } from 'react';
import { View } from 'react-native';

import {
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  type SelectOption,
} from '@berrypjh/react-native-ui';

import { Caption, Label } from '../shell/Section';
import { demoStyles } from '../shell/styles';

type Country = 'kr' | 'jp' | 'us' | 'de';

const COUNTRIES: readonly SelectOption<Country>[] = [
  { value: 'kr', label: '대한민국' },
  { value: 'jp', label: '일본' },
  { value: 'us', label: '미국' },
  { value: 'de', label: '독일 (준비 중)', disabled: true },
];

/**
 * Select 데모.
 *
 * 옵션은 **데이터**입니다 — web 처럼 `<MenuItem>` children 을 훑지 않습니다. RN 에는
 * children-as-configuration 을 옮길 이유가 없어 `MenuItem` 을 만들지 않았습니다.
 *
 * 값 도메인은 문자열이고 단일 선택입니다(`multiple` 없음). 값 상태와 개폐 상태는 독립이며
 * 각각 `value !== undefined`, `open !== undefined` 로 controlled 를 판정합니다.
 *
 * 해제 경로: 배경 탭 · Android 하드웨어 back · iOS 스크린리더 escape.
 */
export const SelectSection = () => {
  const [country, setCountry] = useState<Country | undefined>(undefined);

  return (
    <View>
      <Label>controlled 선택 + placeholder</Label>
      <View style={demoStyles.stack}>
        <Select
          accessibilityLabel="국가"
          options={COUNTRIES}
          value={country}
          onValueChange={setCountry}
          placeholder="국가를 고르세요"
          dismissAccessibilityLabel="목록 닫기"
        />
      </View>
      <Caption>선택: {country ?? '(없음)'} — 비어 있음은 undefined 입니다</Caption>
      <Caption>
        &quot;독일&quot; 은 비활성이라 눌러도 값이 바뀌지 않고 목록도 닫히지 않습니다. 트리거는
        combobox, 목록은 radiogroup, 선택지는 radio 역할입니다.
      </Caption>

      <Label>uncontrolled defaultValue</Label>
      <View style={demoStyles.stack}>
        <Select
          accessibilityLabel="기본 국가"
          options={COUNTRIES}
          defaultValue="jp"
          dismissAccessibilityLabel="목록 닫기"
          variant="filled"
        />
      </View>
      <Caption>초기값만 주고 상태는 Select 가 가집니다.</Caption>

      <Label>FormControl 안에서 — error 상속</Label>
      <View style={demoStyles.stack}>
        <FormControl error>
          <InputLabel>배송 국가</InputLabel>
          <Select
            accessibilityLabel="배송 국가"
            options={COUNTRIES}
            placeholder="선택 필요"
            dismissAccessibilityLabel="목록 닫기"
          />
          <FormHelperText>배송 국가를 선택해 주세요</FormHelperText>
        </FormControl>
      </View>
      <Caption>
        보이는 라벨은 Select 의 이름이 아닙니다 — accessibilityLabel 을 따로 줍니다.
      </Caption>

      <Label>disabled Select · plain variant</Label>
      <View style={demoStyles.stack}>
        <Select
          accessibilityLabel="비활성 국가"
          options={COUNTRIES}
          defaultValue="us"
          disabled
          dismissAccessibilityLabel="목록 닫기"
        />
        <Select
          accessibilityLabel="밑줄 국가"
          options={COUNTRIES}
          placeholder="plain variant"
          variant="plain"
          size="sm"
          dismissAccessibilityLabel="목록 닫기"
        />
      </View>
      <Caption>테마를 바꾸면 트리거·패널·선택 표면이 모두 토큰을 따라 움직입니다.</Caption>
    </View>
  );
};
