import { Divider, Stack } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import { Mono, Page, Panel, Section } from '../shell/ui';

/**
 * Divider 는 선 하나가 전부다. 그래서 이 페이지가 보여 줄 것은 모양이 아니라 **관계**다 —
 * 두께·색이 어디서 오는지, 여백을 누가 가지는지, 시각과 시맨틱이 어떻게 갈리는지.
 *
 * 테마 셀렉터를 바꾸면 선 색이 함께 움직인다. 그것이 이 화면이 Storybook 과 별개로 있는
 * 이유다 — 선이 `stroke.light` 를 실제로 타고 있는지는 앱 전체가 테마를 바꿀 때 드러난다.
 */
const Text = ({ children }: { children: ReactNode }) => (
  <span className="text-text-default text-xsm leading-xsm">{children}</span>
);

export const DividerPage = () => (
  <Page title="Divider" lead="내용을 가르는 선. 두께와 색은 토큰이 정한다">
    <Section
      title="기본값은 가로선"
      note="orientation 을 주지 않으면 horizontal 이다. <hr> 로 렌더되어 native separator 시맨틱을 그대로 가진다"
    >
      <Panel>
        <Stack gap="lg">
          <Text>위쪽 문단입니다.</Text>
          <Divider />
          <Text>아래쪽 문단입니다.</Text>
        </Stack>
      </Panel>
    </Section>

    <Section
      title="여백은 Divider 가 갖지 않는다"
      note="선 위아래 간격은 Stack 의 gap 이 만든다. Divider 에 여백을 두면 gap 과 더해져 소비자가 두 곳을 맞춰야 한다"
    >
      <Panel>
        <Stack gap="2xs">
          <Text>gap=&quot;2xs&quot; — 촘촘하게</Text>
          <Divider />
          <Text>같은 Divider, 다른 간격</Text>
        </Stack>
      </Panel>
      <Panel className="mt-lg">
        <Stack gap="2xl">
          <Text>gap=&quot;2xl&quot; — 넉넉하게</Text>
          <Divider />
          <Text>선 자체는 똑같다</Text>
        </Stack>
      </Panel>
    </Section>

    <Section
      title="세로선"
      note="가로 Stack 안에서 형제 높이만큼 늘어난다. 높이를 주지 않는다 — align-self: stretch 가 형제를 따라간다"
    >
      <Panel>
        <Stack direction="row" gap="lg" align="center">
          <Text>왼쪽</Text>
          <Divider orientation="vertical" />
          <Text>가운데</Text>
          <Divider orientation="vertical" />
          <Text>오른쪽</Text>
        </Stack>
      </Panel>
    </Section>

    <Section
      title="시각과 시맨틱은 다른 결정이다"
      note="두 선은 화면에서 완전히 같다. 다른 것은 보조 기술에 보이는 구조뿐이다 — 아래 둘을 스크린리더로 읽어 보면 갈린다"
    >
      <Panel>
        <Stack gap="lg">
          <Text>
            기본 — 구분자로 읽힌다 <Mono>&lt;hr&gt;</Mono>
          </Text>
          <Divider />
          <Text>
            decorative — 시맨틱을 끈다 <Mono>role=&quot;presentation&quot;</Mono>
          </Text>
          <Divider decorative />
          <Text>
            카드 테두리·행 경계처럼 순수 장식이면 접근성 트리에 구분자를 하나 더 만들 이유가 없다.
          </Text>
        </Stack>
      </Panel>
    </Section>

    <Section
      title="토큰"
      note="두께는 semanticBorder.divider, 색은 stroke.light 다. 굵기·색 prop 이 없는 것은 의도다 — 토큰 밖으로 나가는 길을 만들지 않는다"
    >
      <Panel>
        <Stack gap="md">
          <Text>
            <Mono>--ds-semantic-border-divider</Mono> · <Mono>--ds-stroke-light</Mono>
          </Text>
          <Divider />
          <Text>
            위 테마 셀렉터를 바꾸면 이 선의 색이 따라 움직인다. 등록된 7개 테마 전부에 두 토큰이
            있다.
          </Text>
        </Stack>
      </Panel>
    </Section>
  </Page>
);
