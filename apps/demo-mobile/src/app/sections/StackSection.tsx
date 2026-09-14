import { StyleSheet, Text } from 'react-native';

import { Box, Stack } from '@berrypjh/react-native-ui';

import type { ReactNode } from 'react';

import { Column } from '../shell/layout';
import { useDemoPalette } from '../shell/palette';
import { Caption, Label } from '../shell/Section';

/**
 * Stack 데모 — 1차원 배치.
 *
 * Stack 자체에는 색·여백·모서리 API 가 없습니다. 그래서 눈에 보이는 면은 전부 자식(`Item` 의
 * `Box`)이 가집니다 — 이 관계가 "Box 는 면, Stack 은 배치" 를 그대로 보여 줍니다.
 *
 * `direction` 을 주지 않은 Stack 이 세로로 쌓이는 것이 계약의 핵심입니다. RN 기본값과 같아서
 * 여기서는 당연해 보이지만, web 은 CSS 기본값이 `row` 라서 렌더러가 `column` 을 명시합니다.
 */
const Item = ({ children }: { children: ReactNode }) => {
  const p = useDemoPalette();

  return (
    <Box bg="neutral.ne200" radius="sm" px="md" py="sm">
      <Text style={[styles.item, { color: p.readableOn(p.hexAt('neutral.ne200')) }]}>
        {children}
      </Text>
    </Box>
  );
};

/** 넘침과 줄바꿈을 눈으로 확인할 수 있게 폭을 묶는 틀. */
const Frame = ({ children }: { children: ReactNode }) => {
  const p = useDemoPalette();

  return (
    <Box
      bg="background.default"
      radius="md"
      p="sm"
      style={[styles.frame, { borderColor: p.border }]}
    >
      {children}
    </Box>
  );
};

export const StackSection = () => (
  <Column>
    <Label>기본값은 세로 쌓기</Label>
    <Stack gap="md">
      <Item>첫째</Item>
      <Item>둘째</Item>
      <Item>셋째</Item>
    </Stack>
    <Caption>
      direction 을 주지 않으면 column 입니다. gap 은 spacing 토큰 이름이거나 원시 숫자입니다 — Box
      의 여백과 같은 값 도메인입니다.
    </Caption>

    <Label>direction=&quot;row&quot; · align</Label>
    <Stack direction="row" gap="sm" align="center">
      <Item>center</Item>
      <Item>정렬</Item>
      <Item>기준</Item>
    </Stack>
    <Caption>align 은 교차 축입니다. 주지 않으면 stretch — 자식이 축을 꽉 채웁니다.</Caption>

    <Label>justify=&quot;between&quot;</Label>
    <Frame>
      <Stack direction="row" justify="between">
        <Item>왼쪽</Item>
        <Item>오른쪽</Item>
      </Stack>
    </Frame>
    <Caption>주축 분배입니다. between 은 남은 공간을 자식 사이로 보냅니다.</Caption>

    <Label>wrap — 폭이 모자랄 때</Label>
    <Frame>
      <Stack direction="row" gap="sm" wrap>
        <Item>하나</Item>
        <Item>둘</Item>
        <Item>셋</Item>
        <Item>넷</Item>
        <Item>다섯</Item>
      </Stack>
    </Frame>
    <Caption>
      wrap 을 주지 않으면 한 줄에 밀어 넣습니다. gap 은 줄 사이에도 같은 값으로 적용됩니다.
    </Caption>

    <Label>Box 와 겹쳐 쓴다</Label>
    <Box bg="background.surface" radius="md" p="lg">
      <Stack gap="sm">
        <Item>면과 여백은 Box</Item>
        <Item>배치는 Stack</Item>
      </Stack>
    </Box>
    <Caption>
      Stack 은 Box 를 상속하지 않습니다 — 면이 필요하면 겹쳐 씁니다. 둘의 책임이 갈려 있어야 배치만
      바꾸는 변경이 면을 건드리지 않습니다.
    </Caption>
  </Column>
);

const styles = StyleSheet.create({
  item: { fontSize: 13, fontWeight: '600' },
  frame: { borderWidth: StyleSheet.hairlineWidth },
});
