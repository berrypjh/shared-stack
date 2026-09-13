import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@berrypjh/react-ui';

import type { ComponentProps, ReactNode } from 'react';

import {
  type ComparisonOption,
  type ComponentPresentationData,
  narrowOverrides,
  type PreviewScenario,
  type ScenarioOverrides,
} from '../model';

/**
 * `Select` 는 단독 컴포넌트가 아니라 `FormControl` + `InputLabel` + `Select` 조합이다 —
 * 독립 `label` prop 이 없다. 그래서 scenario props 는 상태를 소유하는 `FormControl` 의 계약이고,
 * fixture 는 그 셋을 **조립만** 한다. 구현을 복사하지 않는다.
 */
type SelectScenarioProps = Pick<
  ComponentProps<typeof FormControl>,
  'variant' | 'size' | 'error' | 'disabled' | 'required' | 'fullWidth' | 'focused'
>;

type SelectScenario = PreviewScenario<SelectScenarioProps> & { helperText?: string };

const FRUITS = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

const SCENARIOS: readonly SelectScenario[] = [
  { id: 'variant-boxed', sectionId: 'variants', label: 'Boxed', props: { variant: 'boxed' } },
  { id: 'variant-filled', sectionId: 'variants', label: 'Filled', props: { variant: 'filled' } },
  { id: 'variant-plain', sectionId: 'variants', label: 'Plain', props: { variant: 'plain' } },

  { id: 'size-sm', sectionId: 'sizes', label: 'Small', props: { variant: 'boxed', size: 'sm' } },
  { id: 'size-md', sectionId: 'sizes', label: 'Medium', props: { variant: 'boxed', size: 'md' } },

  {
    id: 'state-error',
    sectionId: 'states',
    label: 'Error',
    props: { variant: 'boxed', error: true },
    helperText: 'Selection is required',
  },
  {
    id: 'state-disabled',
    sectionId: 'states',
    label: 'Disabled',
    props: { variant: 'boxed', disabled: true },
  },
  {
    id: 'state-required',
    sectionId: 'states',
    label: 'Required',
    props: { variant: 'boxed', required: true },
  },

  {
    id: 'full-width',
    sectionId: 'full-width',
    label: 'Full Width',
    props: { variant: 'boxed', fullWidth: true },
  },
];

const VARIANT_OPTIONS: readonly ComparisonOption[] = [
  { id: 'boxed', label: 'Boxed', value: 'boxed' },
  { id: 'filled', label: 'Filled', value: 'filled' },
  { id: 'plain', label: 'Plain', value: 'plain' },
];

const SIZE_OPTIONS: readonly ComparisonOption[] = [
  { id: 'sm', label: 'Small', value: 'sm' },
  { id: 'md', label: 'Medium', value: 'md' },
];

const data: ComponentPresentationData<SelectScenarioProps> = {
  id: 'select',
  label: 'Select',
  path: '/components/select',
  group: 'components',
  lead: 'Select는 드롭다운 리스트에서 옵션을 선택할 수 있는 컴포넌트입니다.',
  defaultScenarioId: 'variant-boxed',
  sections: [
    {
      id: 'variants',
      label: 'Variants',
      note: 'Boxed, Filled, Plain',
      scenarioIds: ['variant-boxed', 'variant-filled', 'variant-plain'],
    },
    { id: 'sizes', label: 'Sizes', note: 'Small, Medium', scenarioIds: ['size-sm', 'size-md'] },
    {
      id: 'states',
      label: 'States',
      note: 'Error, Disabled, Required',
      scenarioIds: ['state-error', 'state-disabled', 'state-required'],
    },
    { id: 'full-width', label: 'Full Width', scenarioIds: ['full-width'] },
  ],
  scenarios: SCENARIOS,
  tokens: {
    /*
      근거: `select.scss`. Select 는 InputBase 를 렌더하지 않고 자기 stylesheet 를 갖지만
      같은 `field.*` token 계열을 쓴다 — 그 사실을 stylesheet 에서 직접 확인했다.
    */
    bindings: [
      {
        id: 'ink',
        label: '글자와 placeholder',
        tokenIds: ['color.text.default', 'color.text.placeholder'],
      },
      {
        id: 'surface',
        label: '면',
        tokenIds: ['color.field.surface', 'color.background.surface'],
      },
      {
        id: 'border',
        label: '테두리',
        tokenIds: ['color.field.border', 'color.field.borderHover', 'border.primary.color'],
      },
      {
        id: 'focus-ring',
        label: '포커스 링',
        tokenIds: [
          'color.field.focusRingPrimary',
          'color.field.focusRing',
          'component.field.focusRingWidth',
        ],
        stateIds: ['focused'],
      },
      {
        id: 'error',
        label: 'Error 테두리와 링',
        tokenIds: ['color.stroke.error', 'color.field.focusRingError'],
        stateIds: ['error'],
      },
      {
        id: 'disabled',
        label: 'Disabled 면 · 글자 · 아이콘',
        tokenIds: [
          'color.field.surfaceSubtle',
          'color.text.disable',
          'color.icon.disable',
          'border.disabled.color',
        ],
        stateIds: ['disabled'],
      },
      {
        id: 'option',
        label: '선택된 옵션 배경',
        tokenIds: ['color.background.selected'],
      },
      {
        id: 'metrics',
        label: '높이 · 여백 · 모서리',
        tokenIds: [
          'component.field.height.sm',
          'component.field.height.md',
          'spacing.sm',
          'spacing.md',
          'spacing.lg',
          'radius.md',
          'radius.sm',
        ],
      },
    ],
    notes: [
      '드롭다운 패널의 그림자는 합성 shadow 변수를 쓴다. 생성 CSS 에는 있지만 token catalog 에는 그 합성 변수에 대응하는 row 가 없어(낱개 `shadow.lg.*` 만 있다) binding 으로 걸지 않았다.',
    ],
  },
  comparison: {
    /*
      비교 축의 prop 은 `Select` 가 아니라 상태를 소유하는 `FormControl` 의 것이다 —
      이 조합의 variant·size·error 는 거기 선언돼 있다. 검증도 그 symbol 로 한다.
    */
    catalogSymbol: 'FormControl',
    properties: [
      {
        id: 'variant',
        prop: 'variant',
        label: 'Style',
        control: { kind: 'enum', options: VARIANT_OPTIONS },
      },
      { id: 'size', prop: 'size', label: 'Size', control: { kind: 'enum', options: SIZE_OPTIONS } },
      { id: 'error', prop: 'error', label: 'Error', control: { kind: 'boolean' } },
      { id: 'required', prop: 'required', label: 'Required', control: { kind: 'boolean' } },
      { id: 'disabled', prop: 'disabled', label: 'Disabled', control: { kind: 'boolean' } },
      { id: 'focused', prop: 'focused', label: 'Focused', control: { kind: 'boolean' } },
      { id: 'fullWidth', prop: 'fullWidth', label: 'Full width', control: { kind: 'boolean' } },
    ],
    variantMatrix: {
      baseScenarioId: 'variant-boxed',
      columns: { id: 'variant', label: 'Style', prop: 'variant', options: VARIANT_OPTIONS },
      rows: { id: 'size', label: 'Size', prop: 'size', options: SIZE_OPTIONS },
    },
    stateMatrix: {
      baseScenarioId: 'variant-boxed',
      states: [
        { id: 'default', label: '기본', kind: 'prop', props: {} },
        { id: 'focused', label: 'Focused', kind: 'prop', props: { focused: true } },
        { id: 'error', label: 'Error', kind: 'prop', props: { error: true } },
        { id: 'required', label: 'Required', kind: 'prop', props: { required: true } },
        { id: 'disabled', label: 'Disabled', kind: 'prop', props: { disabled: true } },
      ],
      interactiveOnly: ['hover'],
    },
    notes: [
      'Select 에는 controlled `open` prop 이 있지만 이 fixture 가 들고 있지 않아 열린 상태를 persistent cell 로 만들지 않는다.',
    ],
  },
};

/** 전체 폭 example 만 placeholder 문구가 다르다 — 기존 페이지 문구를 그대로 유지한다. */
const placeholderOf = (id: string) => (id === 'full-width' ? 'Choose an option' : 'Choose...');

const render = ({ id, label, props, helperText }: SelectScenario): ReactNode => {
  const control = (
    <FormControl {...props}>
      <InputLabel>{label}</InputLabel>
      <Select placeholder={placeholderOf(id)}>
        {FRUITS.map((f) => (
          <MenuItem key={f} value={f}>
            {f}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );

  return props?.fullWidth ? <div style={{ width: '100%' }}>{control}</div> : control;
};

export const selectPresentation = {
  data,
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides): ReactNode => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    // 새 객체를 만든다 — 원본 scenario 는 그대로 남는다.
    return render({
      ...scenario,
      props: { ...scenario.props, ...narrowOverrides<SelectScenarioProps>(overrides) },
    });
  },
};
