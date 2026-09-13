import { Fab } from '@berrypjh/react-ui';

import type { ComponentProps, ReactNode } from 'react';

import {
  type ComparisonOption,
  type ComponentPresentationData,
  narrowOverrides,
  type PreviewScenario,
  type ScenarioOverrides,
} from '../model';

/** 아이콘은 소비자가 소유한다 — 라이브러리는 아이콘 세트를 들고 있지 않다. */
const PlusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
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
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

type FabScenarioProps = Pick<ComponentProps<typeof Fab>, 'shape' | 'size' | 'color' | 'disabled'>;

type FabScenario = PreviewScenario<FabScenarioProps>;

const SCENARIOS: readonly FabScenario[] = [
  {
    id: 'shape-circular',
    sectionId: 'shapes',
    label: '추가 (circular)',
    props: { shape: 'circular' },
  },
  { id: 'shape-extended', sectionId: 'shapes', label: 'Create New', props: { shape: 'extended' } },

  {
    id: 'size-sm',
    sectionId: 'sizes',
    label: '추가 (small)',
    props: { size: 'sm', shape: 'circular' },
  },
  {
    id: 'size-md',
    sectionId: 'sizes',
    label: '추가 (medium)',
    props: { size: 'md', shape: 'circular' },
  },
  {
    id: 'size-lg',
    sectionId: 'sizes',
    label: '추가 (large)',
    props: { size: 'lg', shape: 'circular' },
  },

  {
    id: 'color-primary',
    sectionId: 'colors',
    label: '추가 (primary)',
    props: { color: 'primary' },
  },
  {
    id: 'color-secondary',
    sectionId: 'colors',
    label: '추가 (secondary)',
    props: { color: 'secondary' },
  },
  {
    id: 'color-extended-primary',
    sectionId: 'colors',
    label: 'Edit',
    props: { color: 'primary', shape: 'extended' },
  },
  {
    id: 'color-extended-secondary',
    sectionId: 'colors',
    label: 'Edit',
    props: { color: 'secondary', shape: 'extended' },
  },

  {
    id: 'disabled-circular',
    sectionId: 'disabled',
    label: '추가 (비활성)',
    props: { disabled: true },
  },
  {
    id: 'disabled-extended',
    sectionId: 'disabled',
    label: 'Disabled',
    props: { disabled: true, shape: 'extended' },
  },
];

const SHAPE_OPTIONS: readonly ComparisonOption[] = [
  { id: 'circular', label: 'Circular', value: 'circular' },
  { id: 'extended', label: 'Extended', value: 'extended' },
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

const data: ComponentPresentationData<FabScenarioProps> = {
  id: 'fab',
  label: 'FAB',
  path: '/components/fab',
  group: 'components',
  lead: '화면의 주된 액션을 표현하는 버튼',
  defaultScenarioId: 'shape-extended',
  sections: [
    {
      id: 'shapes',
      label: 'Shapes',
      note: '원형과 확장형',
      scenarioIds: ['shape-circular', 'shape-extended'],
    },
    {
      id: 'sizes',
      label: 'Sizes',
      note: 'Small, Medium, Large',
      scenarioIds: ['size-sm', 'size-md', 'size-lg'],
    },
    {
      id: 'colors',
      label: 'Colors',
      note: 'Primary와 Secondary 컬러',
      scenarioIds: [
        'color-primary',
        'color-secondary',
        'color-extended-primary',
        'color-extended-secondary',
      ],
    },
    { id: 'disabled', label: 'Disabled', scenarioIds: ['disabled-circular', 'disabled-extended'] },
  ],
  scenarios: SCENARIOS,
  tokens: {
    /* 근거: `button-base.scss` 설정 map(Fab 이 ButtonBase 를 렌더한다) + `fab.scss`. */
    bindings: [
      {
        id: 'surface',
        label: '면과 글자',
        tokenIds: [
          'color.primaryBtn.default',
          'color.secondaryBtn.default',
          'color.text.contrastText',
        ],
      },
      {
        id: 'disabled',
        label: 'Disabled 면과 글자',
        tokenIds: [
          'color.primaryBtn.disabled',
          'color.secondaryBtn.disabled',
          'color.text.disable',
        ],
        stateIds: ['disabled'],
      },
      {
        id: 'shape',
        label: '원형 모서리와 테두리',
        tokenIds: ['radius.rounded', 'borderWidth.primitive.sm'],
      },
      { id: 'press', label: '눌림 이동', tokenIds: ['component.pressedOffset'] },
    ],
    notes: [
      'size·shape 별 지름과 여백 token 은 `fab.scss` 에 더 있지만 아직 역할별로 정리하지 않았다.',
    ],
  },
  comparison: {
    catalogSymbol: 'Fab',
    properties: [
      {
        id: 'shape',
        prop: 'shape',
        label: 'Shape',
        control: { kind: 'enum', options: SHAPE_OPTIONS },
      },
      { id: 'size', prop: 'size', label: 'Size', control: { kind: 'enum', options: SIZE_OPTIONS } },
      {
        id: 'color',
        prop: 'color',
        label: 'Color',
        control: { kind: 'enum', options: COLOR_OPTIONS },
      },
      { id: 'disabled', prop: 'disabled', label: 'Disabled', control: { kind: 'boolean' } },
    ],
    variantMatrix: {
      baseScenarioId: 'shape-extended',
      columns: { id: 'shape', label: 'Shape', prop: 'shape', options: SHAPE_OPTIONS },
      rows: { id: 'size', label: 'Size', prop: 'size', options: SIZE_OPTIONS },
    },
    stateMatrix: {
      baseScenarioId: 'shape-extended',
      states: [
        { id: 'default', label: '기본', kind: 'prop', props: {} },
        { id: 'disabled', label: 'Disabled', kind: 'prop', props: { disabled: true } },
      ],
      interactiveOnly: ['hover', 'focus-visible', 'active'],
    },
  },
};

/** Edit 아이콘을 쓰는 scenario. 나머지는 Plus 다. */
const EDIT_ICON_SCENARIOS = new Set(['color-extended-primary', 'color-extended-secondary']);

/**
 * `label` 하나가 이름의 유일한 source 다. 확장형은 그것을 보이는 글자로 쓰고, 원형은 글자가
 * 없으므로 `aria-label` 로 쓴다 — 어느 쪽이든 접근 가능한 이름이 사라지지 않는다 (WCAG 4.1.2).
 */
const render = ({ id, label, props }: FabScenario): ReactNode => {
  const icon = EDIT_ICON_SCENARIOS.has(id) ? <EditIcon /> : <PlusIcon />;
  /*
    `shape` 은 Fab prop 유니온의 판별자다. spread 로만 넘기면 optional 로 넓어져 어느 변형도
    만족하지 않으므로, 분기에서 리터럴로 다시 준다. `circular` 은 컴포넌트 기본값과 같다.
  */
  const { shape, ...rest } = props ?? {};

  return shape === 'extended' ? (
    <Fab {...rest} shape="extended" icon={icon}>
      {label}
    </Fab>
  ) : (
    <Fab {...rest} shape="circular" icon={icon} aria-label={label} />
  );
};

export const fabPresentation = {
  data,
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides): ReactNode => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    // 새 객체를 만든다 — 원본 scenario 는 그대로 남는다.
    return render({
      ...scenario,
      props: { ...scenario.props, ...narrowOverrides<FabScenarioProps>(overrides) },
    });
  },
};
