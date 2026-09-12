import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, Chip } from '@berrypjh/react-native-ui';

import { Caption, Label } from '../shell/Section';
import { demoStyles } from '../shell/styles';

const FILTERS = ['디자인', '개발', '기획'] as const;

/**
 * Chip 데모 — 소비자 사용 모양과 테마 전환을 기기에서 눈으로 확인하는 자리다.
 *
 * passive 라벨과 selectable filter set 두 가지만 담는다. 필터 적용 로직이나 목록 필터링을
 * 만들지 않는다 — 여기는 테스트 프레임워크도, 제품도 아니다.
 */
export const ChipSection = () => {
  const [picked, setPicked] = useState<string[]>(['디자인']);

  const toggle = (name: string) =>
    setPicked((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]));

  return (
    <View>
      <Label>passive (태그)</Label>
      <View style={demoStyles.row}>
        <Chip>디자인 시스템</Chip>
        <Chip variant="filled">filled</Chip>
        <Chip size="sm">sm</Chip>
        <Chip leading={<Avatar size="sm">길동</Avatar>}>홍길동</Chip>
      </View>
      <Caption>
        누를 수 없습니다 — View 라서 button 역할도, 최소 터치 타깃도 없습니다. 눌러도 아무 반응이
        없는 것이 정상입니다.
      </Caption>

      <Label>interactive (filter set)</Label>
      <View style={demoStyles.row}>
        {FILTERS.map((name) => (
          <Chip key={name} onPress={() => toggle(name)} selected={picked.includes(name)}>
            {name}
          </Chip>
        ))}
      </View>
      <Caption>
        선택: {picked.length === 0 ? '없음' : picked.join(' · ')} — button 역할 +
        accessibilityState.selected 입니다. 누르면 면과 테두리가 함께 바뀌고, 눌리는 동안
        component.pressedOffset 만큼 내려갑니다 (색이 아니라 위치입니다).
      </Caption>

      <Label>action chip · disabled</Label>
      <View style={demoStyles.row}>
        <Chip onPress={() => undefined}>선택 상태 없음</Chip>
        <Chip onPress={() => undefined} disabled>
          비활성
        </Chip>
        <Chip onPress={() => undefined} selected disabled>
          비활성 · 선택됨
        </Chip>
      </View>
      <Caption>
        selected 를 주지 않으면 toggle 이 아니라 단순 action chip 이라 selected 상태를 알리지
        않습니다. 비활성은 누름을 실제로 차단하면서 선택 사실은 계속 알립니다.
      </Caption>
    </View>
  );
};
