import { Box, Stack } from '@berrypjh/react-ui';

import type { ComponentProps, ReactNode } from 'react';

import {
  type ComparisonOption,
  type ComponentPresentationData,
  narrowOverrides,
  type PreviewScenario,
  type ScenarioOverrides,
} from '../model';

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

/** 줄바꿈·분배는 폭이 묶여야 보인다. 이 제약은 example 의 뜻이므로 scenario 와 함께 움직인다. */
const Narrow = ({ children }: { children: ReactNode }) => (
  <div className="w-full max-w-[320px]">{children}</div>
);

type StackScenarioProps = Pick<
  ComponentProps<typeof Stack>,
  'direction' | 'gap' | 'align' | 'justify' | 'wrap'
>;

/** scenario 마다 자식이 다르다. 자식은 `ReactNode` 이므로 중립 data 가 아니라 adapter 가 고른다. */
type StackScenario = PreviewScenario<StackScenarioProps>;

const SCENARIOS: readonly StackScenario[] = [
  { id: 'default-column', sectionId: 'default', label: '세로 쌓기', props: { gap: 'md' } },

  { id: 'gap-xs', sectionId: 'gap', label: 'gap xs', props: { direction: 'row', gap: 'xs' } },
  { id: 'gap-xl', sectionId: 'gap', label: 'gap xl', props: { direction: 'row', gap: 'xl' } },
  { id: 'gap-px', sectionId: 'gap', label: 'gap 2px', props: { direction: 'row', gap: 2 } },

  {
    id: 'align-center',
    sectionId: 'align',
    label: 'align center',
    props: { direction: 'row', gap: 'sm', align: 'center' },
  },
  {
    id: 'align-stretch',
    sectionId: 'align',
    label: 'align stretch',
    props: { direction: 'row', gap: 'sm', align: 'stretch' },
  },

  {
    id: 'justify-between',
    sectionId: 'justify',
    label: 'justify between',
    props: { direction: 'row', justify: 'between' },
  },

  {
    id: 'wrap',
    sectionId: 'wrap',
    label: 'wrap',
    props: { direction: 'row', gap: 'sm', wrap: true },
  },

  { id: 'with-box', sectionId: 'with-box', label: 'Box 와 겹쳐 쓰기', props: { gap: 'sm' } },
];

const DIRECTION_OPTIONS: readonly ComparisonOption[] = [
  { id: 'column', label: 'Column', value: 'column' },
  { id: 'row', label: 'Row', value: 'row' },
];

const ALIGN_OPTIONS: readonly ComparisonOption[] = [
  { id: 'start', label: 'Start', value: 'start' },
  { id: 'center', label: 'Center', value: 'center' },
  { id: 'end', label: 'End', value: 'end' },
  { id: 'stretch', label: 'Stretch', value: 'stretch' },
];

const JUSTIFY_OPTIONS: readonly ComparisonOption[] = [
  { id: 'start', label: 'Start', value: 'start' },
  { id: 'center', label: 'Center', value: 'center' },
  { id: 'end', label: 'End', value: 'end' },
  { id: 'between', label: 'Between', value: 'between' },
];

const data: ComponentPresentationData<StackScenarioProps> = {
  id: 'stack',
  label: 'Stack',
  path: '/components/stack',
  group: 'layout',
  lead: '자식을 한 축으로 흘리는 1차원 레이아웃 컴포넌트',
  defaultScenarioId: 'default-column',
  sections: [
    {
      id: 'default',
      label: '기본값은 세로 쌓기',
      note: 'direction 을 주지 않으면 column 이다. CSS flex 기본값은 row 라서, 렌더러가 세로 축을 명시한다',
      scenarioIds: ['default-column'],
    },
    {
      id: 'gap',
      label: 'gap',
      note: 'spacing 토큰 이름이거나 원시 숫자(px). Box 의 여백과 같은 값 도메인이다',
      scenarioIds: ['gap-xs', 'gap-xl', 'gap-px'],
    },
    {
      id: 'align',
      label: 'align',
      note: '교차 축 정렬. 주지 않으면 stretch — 자식이 축을 꽉 채운다',
      scenarioIds: ['align-center', 'align-stretch'],
    },
    {
      id: 'justify',
      label: 'justify',
      note: '주축 분배. between 은 남은 공간을 자식 사이로 보낸다',
      surface: 'panel',
      scenarioIds: ['justify-between'],
    },
    {
      id: 'wrap',
      label: 'wrap',
      note: '주지 않으면 한 줄에 밀어 넣는다. gap 은 줄 사이에도 같은 값으로 적용된다',
      surface: 'panel',
      scenarioIds: ['wrap'],
    },
    {
      id: 'with-box',
      label: 'Box 와 겹쳐 쓴다',
      note: 'Stack 은 Box 를 상속하지 않는다 — 면이 필요하면 두 컴포넌트를 겹친다',
      scenarioIds: ['with-box'],
    },
  ],
  scenarios: SCENARIOS,
  tokens: {
    /*
      Stack 은 stylesheet 가 없다. `gap` 을 `spacingToCss` 로 변환해 inline style 에 넣으므로
      어떤 spacing token 을 쓰는지가 prop 값에 따라 런타임에 결정된다 — 고정된 선언 집합이 없다.
      추측해서 채우지 않고 introspection 불가를 밝힌다.
    */
    bindings: [],
    notes: [
      'Stack 에는 컴포넌트 stylesheet 가 없다 — `gap` prop 값을 런타임에 spacing token 으로 변환해 inline style 로 넣으므로, 선언된 고정 token 집합이 없다.',
    ],
  },
  comparison: {
    catalogSymbol: 'Stack',
    properties: [
      {
        id: 'direction',
        prop: 'direction',
        label: 'Direction',
        control: { kind: 'enum', options: DIRECTION_OPTIONS },
      },
      {
        id: 'align',
        prop: 'align',
        label: 'Cross axis',
        control: { kind: 'enum', options: ALIGN_OPTIONS },
      },
      {
        id: 'justify',
        prop: 'justify',
        label: 'Main axis',
        control: { kind: 'enum', options: JUSTIFY_OPTIONS },
      },
      { id: 'wrap', prop: 'wrap', label: 'Wrap', control: { kind: 'boolean' } },
    ],
    variantMatrix: {
      // 두 줄이 되는 자식이 있어야 교차 축 정렬이 눈에 보인다.
      baseScenarioId: 'align-center',
      columns: {
        id: 'direction',
        label: 'Direction',
        prop: 'direction',
        options: DIRECTION_OPTIONS,
      },
      rows: { id: 'align', label: 'Cross axis', prop: 'align', options: ALIGN_OPTIONS },
    },
    notes: [
      'Stack 에는 state prop 이 없다 — 배치만 하는 컴포넌트라 State Matrix 를 만들지 않는다.',
    ],
  },
};

const TWO_LINE = (
  <>
    두 줄이 되는
    <br />
    자식
  </>
);

/** scenario 별 자식. 배치를 눈으로 확인할 수 있는 최소 구성만 담는다. */
const childrenOf = (id: string): ReactNode => {
  switch (id) {
    case 'default-column':
      return (
        <>
          <Item>첫째</Item>
          <Item>둘째</Item>
          <Item>셋째</Item>
        </>
      );
    case 'gap-xs':
      return (
        <>
          <Item>xs</Item>
          <Item>xs</Item>
        </>
      );
    case 'gap-xl':
      return (
        <>
          <Item>xl</Item>
          <Item>xl</Item>
        </>
      );
    case 'gap-px':
      return (
        <>
          <Item>2px</Item>
          <Item>2px</Item>
        </>
      );
    case 'align-center':
      return (
        <>
          <Item>center</Item>
          <Item>{TWO_LINE}</Item>
        </>
      );
    case 'align-stretch':
      return (
        <>
          <Item>stretch</Item>
          <Item>{TWO_LINE}</Item>
        </>
      );
    case 'justify-between':
      return (
        <>
          <Item>왼쪽</Item>
          <Item>오른쪽</Item>
        </>
      );
    case 'wrap':
      return (
        <>
          <Item>하나</Item>
          <Item>둘</Item>
          <Item>셋</Item>
          <Item>넷</Item>
          <Item>다섯</Item>
        </>
      );
    default:
      return (
        <>
          <Item>면과 여백은 Box</Item>
          <Item>배치는 Stack</Item>
        </>
      );
  }
};

/** 폭을 묶어야 뜻이 드러나는 scenario. */
const NARROW_SCENARIOS = new Set(['justify-between', 'wrap']);

const render = ({ id, props }: StackScenario): ReactNode => {
  const stack = <Stack {...props}>{childrenOf(id)}</Stack>;

  if (id === 'with-box') {
    return (
      <Box bg="background.default" radius="md" p="lg">
        {stack}
      </Box>
    );
  }

  return NARROW_SCENARIOS.has(id) ? <Narrow>{stack}</Narrow> : stack;
};

export const stackPresentation = {
  data,
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides): ReactNode => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    // 새 객체를 만든다 — 원본 scenario 는 그대로 남는다.
    return render({
      ...scenario,
      props: { ...scenario.props, ...narrowOverrides<StackScenarioProps>(overrides) },
    });
  },
};
