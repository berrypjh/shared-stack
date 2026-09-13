import { Button } from '@berrypjh/react-ui';

import type { ComponentProps, ReactNode } from 'react';

import {
  type ComparisonOption,
  type ComponentPresentationData,
  narrowOverrides,
  type PreviewScenario,
  type ScenarioOverrides,
} from '../model';

/**
 * Button presentation definition — scenario data + web 렌더 adapter.
 *
 * scenario props 는 라이브러리 prop 계약을 다시 적지 않는다. `@berrypjh/react-ui` 가
 * `ButtonProps` 를 public 으로 내보내지 않으므로 public value export 에서 `ComponentProps`
 * 로 끌어온 뒤, 이 화면이 실제로 쓰는 시맨틱 prop 만 `Pick` 한다. 손으로 union 을 복제하면
 * 라이브러리가 값을 늘려도 여기만 낡는다.
 */
type ButtonScenarioProps = Pick<
  ComponentProps<typeof Button>,
  'variant' | 'size' | 'color' | 'loading' | 'loadingPosition' | 'disabled' | 'fullWidth'
>;

type ButtonScenario = PreviewScenario<ButtonScenarioProps>;

const SCENARIOS: readonly ButtonScenario[] = [
  {
    id: 'variant-contained',
    sectionId: 'variants',
    label: 'Contained',
    props: { variant: 'contained' },
  },
  {
    id: 'variant-outlined',
    sectionId: 'variants',
    label: 'Outlined',
    props: { variant: 'outlined' },
  },
  { id: 'variant-text', sectionId: 'variants', label: 'Text', props: { variant: 'text' } },

  {
    id: 'size-sm',
    sectionId: 'sizes',
    label: 'Small',
    props: { variant: 'contained', size: 'sm' },
  },
  {
    id: 'size-md',
    sectionId: 'sizes',
    label: 'Medium',
    props: { variant: 'contained', size: 'md' },
  },
  {
    id: 'size-lg',
    sectionId: 'sizes',
    label: 'Large',
    props: { variant: 'contained', size: 'lg' },
  },

  {
    id: 'color-contained-primary',
    sectionId: 'colors',
    label: 'Primary',
    props: { variant: 'contained', color: 'primary' },
  },
  {
    id: 'color-contained-secondary',
    sectionId: 'colors',
    label: 'Secondary',
    props: { variant: 'contained', color: 'secondary' },
  },
  {
    id: 'color-outlined-primary',
    sectionId: 'colors',
    label: 'Primary',
    props: { variant: 'outlined', color: 'primary' },
  },
  {
    id: 'color-outlined-secondary',
    sectionId: 'colors',
    label: 'Secondary',
    props: { variant: 'outlined', color: 'secondary' },
  },

  {
    id: 'loading-start',
    sectionId: 'loading',
    label: 'Loading Start',
    props: { variant: 'contained', loading: true, loadingPosition: 'start' },
  },
  {
    id: 'loading-center',
    sectionId: 'loading',
    label: 'Loading',
    props: { variant: 'contained', loading: true, loadingPosition: 'center' },
  },
  {
    id: 'loading-end',
    sectionId: 'loading',
    label: 'Loading End',
    props: { variant: 'contained', loading: true, loadingPosition: 'end' },
  },

  {
    id: 'disabled-contained',
    sectionId: 'disabled',
    label: 'Contained',
    props: { variant: 'contained', disabled: true },
  },
  {
    id: 'disabled-outlined',
    sectionId: 'disabled',
    label: 'Outlined',
    props: { variant: 'outlined', disabled: true },
  },
  {
    id: 'disabled-text',
    sectionId: 'disabled',
    label: 'Text',
    props: { variant: 'text', disabled: true },
  },

  {
    id: 'full-width',
    sectionId: 'full-width',
    label: 'Full Width Button',
    props: { variant: 'contained', fullWidth: true },
  },
];

const VARIANT_OPTIONS: readonly ComparisonOption[] = [
  { id: 'contained', label: 'Contained', value: 'contained' },
  { id: 'outlined', label: 'Outlined', value: 'outlined' },
  { id: 'text', label: 'Text', value: 'text' },
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

const buttonData: ComponentPresentationData<ButtonScenarioProps> = {
  id: 'button',
  label: 'Button',
  path: '/components/button',
  group: 'components',
  lead: '버튼은 사용자가 작업을 수행하거나 선택을 할 수 있도록 하는 UI 요소입니다.',
  defaultScenarioId: 'variant-contained',
  sections: [
    {
      id: 'variants',
      label: 'Variants',
      note: '버튼 세가지 스타일',
      scenarioIds: ['variant-contained', 'variant-outlined', 'variant-text'],
    },
    {
      id: 'sizes',
      label: 'Sizes',
      note: '버튼 크기',
      scenarioIds: ['size-sm', 'size-md', 'size-lg'],
    },
    {
      id: 'colors',
      label: 'Colors',
      note: 'Primary와 secondary 컬러 variants',
      scenarioIds: [
        'color-contained-primary',
        'color-contained-secondary',
        'color-outlined-primary',
        'color-outlined-secondary',
      ],
    },
    {
      id: 'loading',
      label: 'Loading State',
      note: '로딩 상태',
      scenarioIds: ['loading-start', 'loading-center', 'loading-end'],
    },
    {
      id: 'disabled',
      label: 'Disabled',
      scenarioIds: ['disabled-contained', 'disabled-outlined', 'disabled-text'],
    },
    { id: 'full-width', label: 'Full Width', scenarioIds: ['full-width'] },
  ],
  scenarios: SCENARIOS,
  tokens: {
    /*
      근거: `button-base.scss` 의 `$sizes`·`$colors` 설정 map 과 `button.scss` 의 스피너 선언.
      역할별로 묶었고, 추측으로 넣은 token 은 없다.
    */
    bindings: [
      {
        id: 'contained-surface',
        label: 'Contained 면과 글자',
        tokenIds: [
          'color.primaryBtn.default',
          'color.secondaryBtn.default',
          'color.text.contrastText',
        ],
      },
      {
        id: 'outlined-text-ink',
        label: 'Outlined · Text 글자와 테두리',
        tokenIds: [
          'color.text.primary',
          'color.text.secondary',
          'border.primary.color',
          'color.stroke.secondary',
          'border.primary.width',
        ],
      },
      {
        id: 'disabled',
        label: 'Disabled 면과 글자',
        tokenIds: [
          'color.primaryBtn.disabled',
          'color.secondaryBtn.disabled',
          'color.text.disable',
          'border.disabled.color',
        ],
        stateIds: ['disabled'],
      },
      {
        id: 'shape',
        label: '여백과 모서리',
        tokenIds: [
          'spacing.md',
          'spacing.sm',
          'spacing.xl',
          'spacing.2xl',
          'radius.sm',
          'radius.md',
          'radius.lg',
        ],
      },
      {
        id: 'typography',
        label: '글자 크기',
        tokenIds: [
          'typography.body.smallStrong.fontSize',
          'typography.body.mediumStrong.fontSize',
          'typography.body.largeStrong.fontSize',
          'typography.body.mediumStrong.fontWeight',
        ],
      },
      {
        id: 'press',
        label: '눌림 이동',
        tokenIds: ['component.pressedOffset'],
      },
      {
        id: 'focus-ring',
        label: '포커스 링',
        tokenIds: [
          'borderWidth.semantic.focus',
          'color.primaryBtn.focusRipple',
          'color.secondaryBtn.focusRipple',
        ],
      },
      {
        id: 'loading-motion',
        label: '스피너 움직임',
        tokenIds: ['motion.duration.slow', 'motion.duration.slower', 'motion.easing.linear'],
        /*
          scenario 로만 좁힌다. state 로도 함께 좁히면 두 조건을 모두 만족해야 하는데,
          loading scenario 의 `loading: true` 는 scenario 자신의 props 라 override 로 켜진
          state 판정에 잡히지 않는다 — 그러면 어느 쪽으로도 도달하지 못하는 binding 이 된다.
        */
        scenarioIds: ['loading-start', 'loading-center', 'loading-end'],
      },
    ],
    notes: [
      '스타일시트에는 error 색 계열도 있지만 Button 의 공개 `color` 는 primary·secondary 뿐이라 공개 API 로 도달할 수 없다 — 그래서 싣지 않는다.',
      '포커스 링 token 은 실제로 선언돼 있지만 `:focus-visible` 일 때만 보인다.',
    ],
  },
  comparison: {
    catalogSymbol: 'Button',
    properties: [
      {
        id: 'variant',
        prop: 'variant',
        label: 'Style',
        control: { kind: 'enum', options: VARIANT_OPTIONS },
      },
      { id: 'size', prop: 'size', label: 'Size', control: { kind: 'enum', options: SIZE_OPTIONS } },
      {
        id: 'color',
        prop: 'color',
        label: 'Color',
        control: { kind: 'enum', options: COLOR_OPTIONS },
      },
      { id: 'disabled', prop: 'disabled', label: 'Disabled', control: { kind: 'boolean' } },
      { id: 'loading', prop: 'loading', label: 'Loading', control: { kind: 'boolean' } },
      { id: 'fullWidth', prop: 'fullWidth', label: 'Full width', control: { kind: 'boolean' } },
    ],
    variantMatrix: {
      baseScenarioId: 'variant-contained',
      columns: { id: 'variant', label: 'Style', prop: 'variant', options: VARIANT_OPTIONS },
      rows: { id: 'size', label: 'Size', prop: 'size', options: SIZE_OPTIONS },
    },
    stateMatrix: {
      baseScenarioId: 'variant-contained',
      states: [
        { id: 'default', label: '기본', kind: 'prop', props: {} },
        { id: 'disabled', label: 'Disabled', kind: 'prop', props: { disabled: true } },
        { id: 'loading', label: 'Loading', kind: 'prop', props: { loading: true } },
      ],
      interactiveOnly: ['hover', 'focus-visible', 'active'],
    },
    notes: [
      'hover · focus-visible · active 는 button-base 스타일시트의 pseudo-class 다. 강제할 공개 prop 이 없어 persistent cell 을 만들지 않는다.',
    ],
  },
};

/**
 * `fullWidth` 는 부모 폭을 채우는 prop 이라, 폭을 주지 않는 flex 캔버스 안에서는 아무 일도
 * 일어나지 않는다. 폭을 주는 것은 web 레이아웃 사정이므로 adapter 가 감싼다 — 중립 data 에
 * 레이아웃 field 를 만들지 않는다.
 */
const renderButton = ({ label, props }: ButtonScenario): ReactNode => {
  const button = <Button {...props}>{label}</Button>;
  return props?.fullWidth ? <div style={{ width: '100%' }}>{button}</div> : button;
};

export const buttonPresentation = {
  data: buttonData,
  /** 없는 id 는 그리지 않는다. section 참조 무결성은 presentation.spec 이 지킨다. */
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides): ReactNode => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    // 새 객체를 만든다 — 원본 scenario 는 그대로 남는다.
    return renderButton({
      ...scenario,
      props: { ...scenario.props, ...narrowOverrides<ButtonScenarioProps>(overrides) },
    });
  },
};
