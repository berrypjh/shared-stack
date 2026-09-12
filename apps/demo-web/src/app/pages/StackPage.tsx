import { Box, Stack } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import { Page, Panel, Preview, Section } from '../shell/ui';

/**
 * Stack 자체에는 색·여백·모서리 API 가 없다. 그래서 눈에 보이는 면은 전부 자식이 가진다 —
 * 여기서는 `Box` 다. "Box 는 면, Stack 은 배치" 라는 두 컴포넌트의 관계가 그대로 드러난다.
 */
const Item = ({ children }: { children: ReactNode }) => (
  <Box
    bg="background.default"
    radius="sm"
    px="md"
    py="sm"
    className="text-text-default text-xsm leading-xsm"
  >
    {children}
  </Box>
);

/** 줄바꿈·분배를 눈으로 확인할 수 있게 폭을 묶는 틀. */
const Frame = ({ children }: { children: ReactNode }) => (
  <Panel className="w-full max-w-[320px]">{children}</Panel>
);

export const StackPage = () => (
  <Page title="Stack" lead="자식을 한 축으로 흘리는 1차원 레이아웃 컴포넌트">
    <Section
      title="기본값은 세로 쌓기"
      note="direction 을 주지 않으면 column 이다. CSS flex 기본값은 row 라서, 렌더러가 세로 축을 명시한다"
    >
      <Preview>
        <Stack gap="md">
          <Item>첫째</Item>
          <Item>둘째</Item>
          <Item>셋째</Item>
        </Stack>
      </Preview>
    </Section>

    <Section
      title="gap"
      note="spacing 토큰 이름이거나 원시 숫자(px). Box 의 여백과 같은 값 도메인이다"
    >
      <Preview>
        <Stack direction="row" gap="xs">
          <Item>xs</Item>
          <Item>xs</Item>
        </Stack>
        <Stack direction="row" gap="xl">
          <Item>xl</Item>
          <Item>xl</Item>
        </Stack>
        <Stack direction="row" gap={2}>
          <Item>2px</Item>
          <Item>2px</Item>
        </Stack>
      </Preview>
    </Section>

    <Section title="align" note="교차 축 정렬. 주지 않으면 stretch — 자식이 축을 꽉 채운다">
      <Preview>
        <Stack direction="row" gap="sm" align="center">
          <Item>center</Item>
          <Item>
            두 줄이 되는
            <br />
            자식
          </Item>
        </Stack>
        <Stack direction="row" gap="sm" align="stretch">
          <Item>stretch</Item>
          <Item>
            두 줄이 되는
            <br />
            자식
          </Item>
        </Stack>
      </Preview>
    </Section>

    <Section title="justify" note="주축 분배. between 은 남은 공간을 자식 사이로 보낸다">
      <Frame>
        <Stack direction="row" justify="between">
          <Item>왼쪽</Item>
          <Item>오른쪽</Item>
        </Stack>
      </Frame>
    </Section>

    <Section
      title="wrap"
      note="주지 않으면 한 줄에 밀어 넣는다. gap 은 줄 사이에도 같은 값으로 적용된다"
    >
      <Frame>
        <Stack direction="row" gap="sm" wrap>
          <Item>하나</Item>
          <Item>둘</Item>
          <Item>셋</Item>
          <Item>넷</Item>
          <Item>다섯</Item>
        </Stack>
      </Frame>
    </Section>

    <Section
      title="Box 와 겹쳐 쓴다"
      note="Stack 은 Box 를 상속하지 않는다 — 면이 필요하면 두 컴포넌트를 겹친다"
    >
      <Preview>
        <Box bg="background.default" radius="md" p="lg">
          <Stack gap="sm">
            <Item>면과 여백은 Box</Item>
            <Item>배치는 Stack</Item>
          </Stack>
        </Box>
      </Preview>
    </Section>
  </Page>
);
