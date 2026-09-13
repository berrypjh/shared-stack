import { TextField } from '@berrypjh/react-ui';

import type { ComponentProps, ReactNode } from 'react';

import {
  type ComparisonOption,
  type ComponentPresentationData,
  narrowOverrides,
  type PreviewScenario,
  type ScenarioOverrides,
} from '../model';

/** 이 화면이 쓰는 시맨틱 prop 만. 라이브러리 계약을 다시 적지 않는다. */
type TextFieldScenarioProps = Pick<
  ComponentProps<typeof TextField>,
  | 'variant'
  | 'size'
  | 'placeholder'
  | 'error'
  | 'helperText'
  | 'disabled'
  | 'required'
  | 'type'
  | 'multiline'
  | 'rows'
  | 'fullWidth'
  | 'focused'
>;

type TextFieldScenario = PreviewScenario<TextFieldScenarioProps>;

const SCENARIOS: readonly TextFieldScenario[] = [
  {
    id: 'variant-boxed',
    sectionId: 'variants',
    label: 'Boxed',
    props: { variant: 'boxed', placeholder: 'Enter text...' },
  },
  {
    id: 'variant-filled',
    sectionId: 'variants',
    label: 'Filled',
    props: { variant: 'filled', placeholder: 'Enter text...' },
  },
  {
    id: 'variant-plain',
    sectionId: 'variants',
    label: 'Plain',
    props: { variant: 'plain', placeholder: 'Enter text...' },
  },

  {
    id: 'size-sm',
    sectionId: 'sizes',
    label: 'Small',
    props: { size: 'sm', placeholder: 'Small input' },
  },
  {
    id: 'size-md',
    sectionId: 'sizes',
    label: 'Medium',
    props: { size: 'md', placeholder: 'Medium input' },
  },

  {
    id: 'state-error',
    sectionId: 'states',
    label: 'Error',
    props: { error: true, helperText: 'This field is required', placeholder: 'Error state' },
  },
  {
    id: 'state-disabled',
    sectionId: 'states',
    label: 'Disabled',
    props: { disabled: true, placeholder: 'Cannot type here' },
  },
  {
    id: 'state-required',
    sectionId: 'states',
    label: 'Required',
    props: { required: true, placeholder: 'Required field' },
  },

  {
    id: 'helper-password',
    sectionId: 'helper-text',
    label: 'Password',
    props: { type: 'password', helperText: 'Minimum 8 characters', placeholder: 'Enter password' },
  },
  {
    id: 'helper-username',
    sectionId: 'helper-text',
    label: 'Username',
    props: { helperText: 'Letters and numbers only', placeholder: 'johndoe' },
  },

  {
    id: 'multiline',
    sectionId: 'multiline',
    label: 'Message',
    props: { multiline: true, rows: 4, placeholder: 'Write your message...' },
  },

  {
    id: 'full-width',
    sectionId: 'full-width',
    label: 'Full Width',
    props: { fullWidth: true, placeholder: 'Stretches to container width' },
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

const data: ComponentPresentationData<TextFieldScenarioProps> = {
  id: 'text-field',
  label: 'TextField',
  path: '/components/text-field',
  group: 'components',
  lead: '텍스트 입력 필드',
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
    {
      id: 'helper-text',
      label: 'With Helper Text',
      scenarioIds: ['helper-password', 'helper-username'],
    },
    {
      id: 'multiline',
      label: 'Multiline',
      note: 'Textarea mode with rows',
      scenarioIds: ['multiline'],
    },
    { id: 'full-width', label: 'Full Width', scenarioIds: ['full-width'] },
  ],
  scenarios: SCENARIOS,
  tokens: {
    /* 근거: `input-base.scss` 의 역할별 custom property 선언(2~17행). */
    bindings: [
      {
        id: 'ink',
        label: '글자와 placeholder',
        tokenIds: ['color.text.default', 'color.text.placeholder'],
      },
      {
        id: 'border',
        label: '테두리',
        tokenIds: ['color.field.border', 'color.field.borderHover', 'border.primary.color'],
      },
      {
        id: 'focus-ring',
        label: '포커스 링',
        tokenIds: ['color.field.focusRingPrimary', 'color.field.focusRing'],
        stateIds: ['focused'],
      },
      {
        id: 'error',
        label: 'Error 테두리',
        tokenIds: ['color.stroke.error'],
        stateIds: ['error'],
      },
      {
        id: 'disabled',
        label: 'Disabled 면과 글자',
        tokenIds: ['color.field.surfaceSubtle', 'color.text.disable', 'border.disabled.color'],
        stateIds: ['disabled'],
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
        ],
      },
      {
        id: 'typography',
        label: '글자 크기',
        tokenIds: ['typography.body.medium.fontSize', 'typography.body.small.fontSize'],
      },
    ],
  },
  comparison: {
    catalogSymbol: 'TextField',
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
      { id: 'multiline', prop: 'multiline', label: 'Multiline', control: { kind: 'boolean' } },
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
      'focused 는 FormControl 의 공개 prop 이다 — InputBase 가 `formControl.focused` 를 자기 포커스 상태보다 먼저 쓰므로 persistent cell 로 재현된다.',
      'hover 는 boxed/filled input 스타일시트의 pseudo-class 뿐이라 강제할 수 없다.',
    ],
  },
};

/** `label` 이 field 의 보이는 이름이자 scenario 이름이다 — 같은 문자열을 두 번 적지 않는다. */
const render = ({ label, props }: TextFieldScenario): ReactNode => {
  const field = <TextField label={label} {...props} />;
  return props?.fullWidth ? <div style={{ width: '100%' }}>{field}</div> : field;
};

export const textFieldPresentation = {
  data,
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides): ReactNode => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    // 새 객체를 만든다 — 원본 scenario 는 그대로 남는다.
    return render({
      ...scenario,
      props: { ...scenario.props, ...narrowOverrides<TextFieldScenarioProps>(overrides) },
    });
  },
};
