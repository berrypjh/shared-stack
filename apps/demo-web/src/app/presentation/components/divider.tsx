import { Divider, Stack } from '@berrypjh/react-ui';

import type { ComponentProps, ReactNode } from 'react';

import { Mono } from '../../shell/ui';
import {
  type ComponentPresentationData,
  narrowOverrides,
  type PreviewScenario,
  type ScenarioOverrides,
} from '../model';

/**
 * Divider 는 선 하나가 전부다. 그래서 이 정의가 보여 줄 것은 모양이 아니라 **관계**다 —
 * 두께·색이 어디서 오는지, 여백을 누가 가지는지, 시각과 시맨틱이 어떻게 갈리는지.
 *
 * 모든 section 이 `panel` surface 를 쓴다. 가로선은 폭을 다 써야 선으로 보이고, `Preview` 의
 * flex 캔버스 안에서는 내용 폭으로 줄어든다.
 */
const Text = ({ children }: { children: ReactNode }) => (
  <span className="text-text-default text-xsm leading-xsm">{children}</span>
);

type DividerScenarioProps = Pick<ComponentProps<typeof Divider>, 'orientation' | 'decorative'>;

type DividerScenario = PreviewScenario<DividerScenarioProps>;

const SCENARIOS: readonly DividerScenario[] = [
  { id: 'horizontal', sectionId: 'default', label: '가로선', props: {} },

  { id: 'spacing-tight', sectionId: 'spacing', label: 'gap 2xs', props: {} },
  { id: 'spacing-loose', sectionId: 'spacing', label: 'gap 2xl', props: {} },

  { id: 'vertical', sectionId: 'vertical', label: '세로선', props: { orientation: 'vertical' } },

  { id: 'semantics', sectionId: 'semantics', label: '기본 · decorative', props: {} },

  { id: 'tokens', sectionId: 'tokens', label: '토큰', props: {} },
];

const data: ComponentPresentationData<DividerScenarioProps> = {
  id: 'divider',
  label: 'Divider',
  path: '/components/divider',
  group: 'layout',
  lead: '내용을 가르는 선. 두께와 색은 토큰이 정한다',
  defaultScenarioId: 'horizontal',
  sections: [
    {
      id: 'default',
      label: '기본값은 가로선',
      note: 'orientation 을 주지 않으면 horizontal 이다. <hr> 로 렌더되어 native separator 시맨틱을 그대로 가진다',
      surface: 'panel',
      scenarioIds: ['horizontal'],
    },
    {
      id: 'spacing',
      label: '여백은 Divider 가 갖지 않는다',
      note: '선 위아래 간격은 Stack 의 gap 이 만든다. Divider 에 여백을 두면 gap 과 더해져 소비자가 두 곳을 맞춰야 한다',
      surface: 'panel',
      scenarioIds: ['spacing-tight', 'spacing-loose'],
    },
    {
      id: 'vertical',
      label: '세로선',
      note: '가로 Stack 안에서 형제 높이만큼 늘어난다. 높이를 주지 않는다 — align-self: stretch 가 형제를 따라간다',
      surface: 'panel',
      scenarioIds: ['vertical'],
    },
    {
      id: 'semantics',
      label: '시각과 시맨틱은 다른 결정이다',
      note: '두 선은 화면에서 완전히 같다. 다른 것은 보조 기술에 보이는 구조뿐이다 — 아래 둘을 스크린리더로 읽어 보면 갈린다',
      surface: 'panel',
      scenarioIds: ['semantics'],
    },
    {
      id: 'tokens',
      label: '토큰',
      note: '두께는 semanticBorder.divider, 색은 stroke.light 다. 굵기·색 prop 이 없는 것은 의도다 — 토큰 밖으로 나가는 길을 만들지 않는다',
      surface: 'panel',
      scenarioIds: ['tokens'],
    },
  ],
  scenarios: SCENARIOS,
  tokens: {
    /* 근거: `divider.scss` 전체. 선 하나가 쓰는 token 이 정확히 둘이다. */
    bindings: [
      {
        id: 'line',
        label: '선 두께와 색',
        tokenIds: ['borderWidth.semantic.divider', 'color.stroke.light'],
      },
    ],
    notes: [
      'Divider 는 여백 token 을 갖지 않는다 — 선 주변 간격은 소비자가 `Stack` 의 gap 으로 준다.',
    ],
  },
  comparison: {
    catalogSymbol: 'Divider',
    // 비교 축을 만들지 않는다. 이유를 빈 matrix 대신 사실로 적는다.
    properties: [],
    notes: [
      'orientation 은 부모 Stack 의 축과 함께 뜻을 갖는다 — 세로선을 column Stack 에 넣으면 높이를 잃는다. prop grid 로 곱하면 잘못된 조합이 되므로 curated scenario 비교를 쓴다.',
      'decorative 는 접근성 트리만 바꾼다. 두 cell 이 화면에서 완전히 같아 보이므로 시각 State Matrix 로 만들지 않는다.',
    ],
  },
};

const render = ({ id, props }: DividerScenario): ReactNode => {
  switch (id) {
    case 'spacing-tight':
      return (
        <Stack gap="2xs">
          <Text>gap=&quot;2xs&quot; — 촘촘하게</Text>
          <Divider />
          <Text>같은 Divider, 다른 간격</Text>
        </Stack>
      );
    case 'spacing-loose':
      return (
        <Stack gap="2xl">
          <Text>gap=&quot;2xl&quot; — 넉넉하게</Text>
          <Divider />
          <Text>선 자체는 똑같다</Text>
        </Stack>
      );
    case 'vertical':
      return (
        <Stack direction="row" gap="lg" align="center">
          <Text>왼쪽</Text>
          <Divider {...props} />
          <Text>가운데</Text>
          <Divider {...props} />
          <Text>오른쪽</Text>
        </Stack>
      );
    case 'semantics':
      return (
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
      );
    case 'tokens':
      return (
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
      );
    default:
      return (
        <Stack gap="lg">
          <Text>위쪽 문단입니다.</Text>
          <Divider {...props} />
          <Text>아래쪽 문단입니다.</Text>
        </Stack>
      );
  }
};

export const dividerPresentation = {
  data,
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides): ReactNode => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    // 새 객체를 만든다 — 원본 scenario 는 그대로 남는다.
    return render({
      ...scenario,
      props: { ...scenario.props, ...narrowOverrides<DividerScenarioProps>(overrides) },
    });
  },
};
