import { StyleSheet, Text } from 'react-native';

import { Box, Divider, Stack } from '@berrypjh/react-native-ui';

import type { ReactNode } from 'react';

import { Column } from '../shell/layout';
import { useDemoPalette } from '../shell/palette';
import { Caption, Label } from '../shell/Section';

/**
 * Divider 데모 — 내용을 가르는 선.
 *
 * 두께와 색은 토큰이 정합니다 (`borderWidth.semantic.divider` · `color.stroke.light`). 굵기·색
 * prop 이 없는 것은 의도입니다 — 토큰 밖으로 나가는 길을 만들지 않습니다. 테마 칩을 바꾸면
 * 선 색이 함께 움직이는 것으로 그 사실이 드러납니다.
 *
 * **web 과 갈리는 지점이 하나 있습니다.** react-ui 의 Divider 에는 `decorative` 가 있지만
 * 여기에는 없습니다. web 은 `<hr>` 의 native separator 시맨틱을 끌 수 있는데, RN 에는 끌
 * 대상 자체가 없기 때문입니다 — `accessibilityRole` 유니온에 `separator` 가 없습니다.
 * 이름을 맞추려고 아무 일도 하지 않는 prop 을 만들지 않습니다.
 *
 * 섹션 배치는 `Column` 이 세우지만, 예시 안에서는 `Stack` 을 직접 씁니다 — `StackSection`
 * 과 같은 예외입니다. Divider 의 계약이 "여백은 Stack 의 gap 이 가진다" 라서, 그 관계 자체가
 * 여기서 보여 줄 대상이기 때문입니다. 공용 `Column`·`Row` 로 감싸면 gap 이 고정되어 그
 * 관계가 보이지 않습니다.
 */
const Item = ({ children }: { children: ReactNode }) => {
  const p = useDemoPalette();

  return <Text style={[styles.item, { color: p.title }]}>{children}</Text>;
};

export const DividerSection = () => (
  <Column>
    <Label>기본값은 가로선</Label>
    <Stack gap="lg">
      <Item>위쪽 문단입니다.</Item>
      <Divider />
      <Item>아래쪽 문단입니다.</Item>
    </Stack>
    <Caption>orientation 을 주지 않으면 horizontal 입니다. web 렌더러와 같은 기본값입니다.</Caption>

    <Label>여백은 Divider 가 갖지 않는다</Label>
    <Stack gap="2xs">
      <Item>gap=&quot;2xs&quot; — 촘촘하게</Item>
      <Divider />
      <Item>같은 Divider, 다른 간격</Item>
    </Stack>
    <Caption>
      선 위아래 간격은 Stack 의 gap 이 만듭니다. Divider 에 여백을 두면 gap 과 더해져 두 곳을 맞춰야
      합니다.
    </Caption>

    <Label>세로선</Label>
    <Stack direction="row" gap="lg" align="center">
      <Item>왼쪽</Item>
      <Divider orientation="vertical" />
      <Item>가운데</Item>
      <Divider orientation="vertical" />
      <Item>오른쪽</Item>
    </Stack>
    <Caption>alignSelf: stretch 로 형제 높이만큼 늘어납니다 — 높이를 추측하지 않습니다.</Caption>

    <Label>Box 와 겹쳐 쓴다</Label>
    <Box bg="background.default" radius="md" p="lg">
      <Stack gap="md">
        <Item>면과 여백은 Box</Item>
        <Divider />
        <Item>가르는 것은 Divider</Item>
      </Stack>
    </Box>
    <Caption>
      두께는 borderWidth.semantic.divider, 색은 stroke.light 입니다. 등록된 테마 전부에 두 토큰이
      있어서 테마를 바꾸면 선이 따라 움직입니다.
    </Caption>
  </Column>
);

const styles = StyleSheet.create({
  item: { fontSize: 13, fontWeight: '600' },
});
