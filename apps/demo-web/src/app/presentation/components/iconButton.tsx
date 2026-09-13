import { IconButton } from '@berrypjh/react-ui';

import type { ComponentProps, ReactNode } from 'react';

import {
  type ComparisonOption,
  type ComponentPresentationData,
  narrowOverrides,
  type PreviewScenario,
  type ScenarioOverrides,
} from '../model';

const HeartIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const StarIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ShareIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const ICONS = { heart: <HeartIcon />, star: <StarIcon />, share: <ShareIcon /> };

type IconName = keyof typeof ICONS;

type IconButtonScenarioProps = Pick<
  ComponentProps<typeof IconButton>,
  'size' | 'color' | 'loading' | 'disabled' | 'edge'
>;

/** 아이콘 선택은 `ReactNode` 가 아니라 이름이다 — 중립 metadata 에 노드를 담지 않는다. */
type IconButtonScenario = PreviewScenario<IconButtonScenarioProps> & { icon?: IconName };

const SCENARIOS: readonly IconButtonScenario[] = [
  {
    id: 'size-sm',
    sectionId: 'size',
    label: '즐겨찾기 (small)',
    props: { size: 'sm' },
    icon: 'heart',
  },
  {
    id: 'size-md',
    sectionId: 'size',
    label: '즐겨찾기 (medium)',
    props: { size: 'md' },
    icon: 'heart',
  },
  {
    id: 'size-lg',
    sectionId: 'size',
    label: '즐겨찾기 (large)',
    props: { size: 'lg' },
    icon: 'heart',
  },

  {
    id: 'color-heart-primary',
    sectionId: 'colors',
    label: '즐겨찾기 (primary)',
    props: { color: 'primary' },
    icon: 'heart',
  },
  {
    id: 'color-heart-secondary',
    sectionId: 'colors',
    label: '즐겨찾기 (secondary)',
    props: { color: 'secondary' },
    icon: 'heart',
  },
  {
    id: 'color-star-primary',
    sectionId: 'colors',
    label: '별점 주기 (primary)',
    props: { color: 'primary' },
    icon: 'star',
  },
  {
    id: 'color-star-secondary',
    sectionId: 'colors',
    label: '별점 주기 (secondary)',
    props: { color: 'secondary' },
    icon: 'star',
  },

  {
    id: 'loading-heart',
    sectionId: 'loading',
    label: '즐겨찾기 저장 중',
    props: { loading: true },
    icon: 'heart',
  },
  {
    id: 'loading-star-lg',
    sectionId: 'loading',
    label: '별점 저장 중',
    props: { loading: true, size: 'lg' },
    icon: 'star',
  },

  {
    id: 'disabled-heart',
    sectionId: 'disabled',
    label: '즐겨찾기 (비활성)',
    props: { disabled: true },
    icon: 'heart',
  },
  {
    id: 'disabled-star',
    sectionId: 'disabled',
    label: '별점 주기 (비활성)',
    props: { disabled: true },
    icon: 'star',
  },
  {
    id: 'disabled-share',
    sectionId: 'disabled',
    label: '공유 (비활성)',
    props: { disabled: true },
    icon: 'share',
  },

  /*
    edge 는 **비교**가 곧 example 이다 — 세 버튼이 4px 간격으로 붙어 있어야 양 끝의 패딩이
    줄어든 것이 보인다. `Preview` 의 gap 으로 흩뜨리면 보여 줄 것이 사라지므로 하나의
    scenario 로 조립한다. 그래서 여기에는 단일 prop 집합이 없다.
  */
  { id: 'edge-row', sectionId: 'edge', label: 'edge start · 없음 · end' },
];

const SIZE_OPTIONS: readonly ComparisonOption[] = [
  { id: 'sm', label: 'Small', value: 'sm' },
  { id: 'md', label: 'Medium', value: 'md' },
  { id: 'lg', label: 'Large', value: 'lg' },
];

const COLOR_OPTIONS: readonly ComparisonOption[] = [
  { id: 'primary', label: 'Primary', value: 'primary' },
  { id: 'secondary', label: 'Secondary', value: 'secondary' },
];

const data: ComponentPresentationData<IconButtonScenarioProps> = {
  id: 'icon-button',
  label: 'IconButton',
  path: '/components/icon-button',
  group: 'components',
  lead: '아이콘만 포함하는 버튼으로, 일반적이거나 상황에 따른 액션에 사용됩니다.',
  defaultScenarioId: 'color-heart-primary',
  sections: [
    {
      id: 'size',
      label: 'Size',
      note: 'Small, Medium, Large',
      scenarioIds: ['size-sm', 'size-md', 'size-lg'],
    },
    {
      id: 'colors',
      label: 'Colors',
      note: 'Primary와 Secondary 컬러',
      scenarioIds: [
        'color-heart-primary',
        'color-heart-secondary',
        'color-star-primary',
        'color-star-secondary',
      ],
    },
    { id: 'loading', label: 'Loading State', scenarioIds: ['loading-heart', 'loading-star-lg'] },
    {
      id: 'disabled',
      label: 'Disabled',
      scenarioIds: ['disabled-heart', 'disabled-star', 'disabled-share'],
    },
    {
      id: 'edge',
      label: 'Edge Alignment',
      note: "edge='start'와 edge='end'는 각 면의 패딩을 줄입니다",
      scenarioIds: ['edge-row'],
    },
  ],
  scenarios: SCENARIOS,
  tokens: {
    /* 근거: `button-base.scss` 설정 map + `icon-button.scss`. */
    bindings: [
      {
        id: 'ink',
        label: '아이콘 색',
        tokenIds: ['color.text.primary', 'color.text.secondary'],
      },
      {
        id: 'disabled',
        label: 'Disabled 아이콘 색',
        tokenIds: ['color.text.disable', 'border.disabled.color'],
        stateIds: ['disabled'],
      },
      {
        id: 'icon-size',
        label: '아이콘 크기',
        tokenIds: ['typography.fontSize.md', 'typography.fontSize.xl', 'typography.fontSize.xxl'],
      },
      {
        id: 'shape',
        label: '모서리와 여백',
        tokenIds: ['radius.rounded', 'spacing.xs', 'spacing.sm', 'spacing.md'],
      },
      { id: 'press', label: '눌림 이동', tokenIds: ['component.pressedOffset'] },
    ],
  },
  comparison: {
    catalogSymbol: 'IconButton',
    properties: [
      { id: 'size', prop: 'size', label: 'Size', control: { kind: 'enum', options: SIZE_OPTIONS } },
      {
        id: 'color',
        prop: 'color',
        label: 'Color',
        control: { kind: 'enum', options: COLOR_OPTIONS },
      },
      { id: 'loading', prop: 'loading', label: 'Loading', control: { kind: 'boolean' } },
      { id: 'disabled', prop: 'disabled', label: 'Disabled', control: { kind: 'boolean' } },
    ],
    variantMatrix: {
      baseScenarioId: 'color-heart-primary',
      columns: { id: 'size', label: 'Size', prop: 'size', options: SIZE_OPTIONS },
      rows: { id: 'color', label: 'Color', prop: 'color', options: COLOR_OPTIONS },
    },
    stateMatrix: {
      baseScenarioId: 'color-heart-primary',
      states: [
        { id: 'default', label: '기본', kind: 'prop', props: {} },
        { id: 'loading', label: 'Loading', kind: 'prop', props: { loading: true } },
        { id: 'disabled', label: 'Disabled', kind: 'prop', props: { disabled: true } },
      ],
      interactiveOnly: ['hover', 'focus-visible', 'active'],
    },
    notes: [
      'catalog 에는 `variant` 가 있지만 icon-button 스타일시트가 그 축을 구현하지 않는다 — API 에 있다는 이유로 비교 축에 넣지 않는다.',
    ],
  },
};

/** 아이콘만 있는 컨트롤은 이름을 잃기 쉽다 — `label` 을 언제나 `aria-label` 로 넘긴다. */
const single = ({ label, props, icon = 'heart' }: IconButtonScenario): ReactNode => (
  <IconButton {...props} aria-label={label}>
    {ICONS[icon]}
  </IconButton>
);

/** override 는 세 인스턴스에 함께 적용된다 — 비교 대상이 edge 뿐이어야 하기 때문이다. */
const edgeRow = (shared: Partial<IconButtonScenarioProps>): ReactNode => (
  <div style={{ display: 'flex', gap: 4 }}>
    <IconButton {...shared} edge="start" aria-label="즐겨찾기 (edge start)">
      {ICONS.heart}
    </IconButton>
    <IconButton {...shared} aria-label="별점 주기 (edge 없음)">
      {ICONS.star}
    </IconButton>
    <IconButton {...shared} edge="end" aria-label="공유 (edge end)">
      {ICONS.share}
    </IconButton>
  </div>
);

export const iconButtonPresentation = {
  data,
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides): ReactNode => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    const extra = narrowOverrides<IconButtonScenarioProps>(overrides);
    // 새 객체를 만든다 — 원본 scenario 는 그대로 남는다.
    return scenario.id === 'edge-row'
      ? edgeRow(extra)
      : single({ ...scenario, props: { ...scenario.props, ...extra } });
  },
};
