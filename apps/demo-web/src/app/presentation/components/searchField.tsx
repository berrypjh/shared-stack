import { SearchField } from '@berrypjh/react-ui';

import type { ComponentProps, ReactNode } from 'react';

import {
  type ComparisonOption,
  type ComponentPresentationData,
  narrowOverrides,
  type PreviewScenario,
  type ScenarioOverrides,
} from '../model';

/**
 * `clearable: true` 는 지우기 버튼의 접근 가능한 이름(`clearAriaLabel`)을 타입에서 요구한다.
 * 이 화면의 example 은 지우기 버튼을 켜지 않으므로 유니온의 non-clearable 쪽에서 뽑는다 —
 * prop 계약을 손으로 다시 적지 않고 라이브러리 타입에서 좁힌다.
 */
type NonClearableSearchField = Extract<ComponentProps<typeof SearchField>, { clearable?: false }>;

type SearchFieldScenarioProps = Pick<
  NonClearableSearchField,
  'placeholder' | 'variant' | 'disabled' | 'clearable' | 'fullWidth'
>;

type SearchFieldScenario = PreviewScenario<SearchFieldScenarioProps>;

/**
 * 제안 목록은 fixture 다. `suggestions` 는 `ReactNode` 를 담을 수 있는 prop 이므로 중립
 * metadata 에 넣지 않고, 어떤 scenario 가 제안을 쓰는지만 id 로 고른다.
 */
const SUGGESTIONS = [
  { id: '1', label: 'React', description: 'JavaScript UI library' },
  { id: '2', label: 'TypeScript', description: 'Typed JavaScript' },
  { id: '3', label: 'Tailwind CSS', description: 'Utility-first CSS framework' },
  { id: '4', label: 'Vite', description: 'Next-gen frontend tooling' },
  { id: '5', label: 'Playwright', description: 'E2E testing framework' },
];

const WITH_SUGGESTIONS = new Set(['suggestions', 'full-width']);

const SCENARIOS: readonly SearchFieldScenario[] = [
  {
    id: 'variant-boxed',
    sectionId: 'variants',
    label: 'Boxed',
    props: { variant: 'boxed', placeholder: 'Search (boxed)...' },
  },
  {
    id: 'variant-filled',
    sectionId: 'variants',
    label: 'Filled',
    props: { variant: 'filled', placeholder: 'Search (filled)...' },
  },
  {
    id: 'variant-plain',
    sectionId: 'variants',
    label: 'Plain',
    props: { variant: 'plain', placeholder: 'Search (plain)...' },
  },

  {
    id: 'suggestions',
    sectionId: 'suggestions',
    label: 'With suggestions',
    props: { variant: 'boxed', placeholder: "Try typing 'R' or 'T'..." },
  },

  {
    id: 'state-disabled',
    sectionId: 'states',
    label: 'Disabled',
    props: { disabled: true, placeholder: 'Disabled' },
  },
  {
    id: 'state-not-clearable',
    sectionId: 'states',
    label: 'Not clearable',
    props: { clearable: false, placeholder: 'Not clearable' },
  },

  {
    id: 'full-width',
    sectionId: 'full-width',
    label: 'Full Width',
    props: { fullWidth: true, placeholder: 'Full width search...' },
  },
];

const VARIANT_OPTIONS: readonly ComparisonOption[] = [
  { id: 'boxed', label: 'Boxed', value: 'boxed' },
  { id: 'filled', label: 'Filled', value: 'filled' },
  { id: 'plain', label: 'Plain', value: 'plain' },
];

const data: ComponentPresentationData<SearchFieldScenarioProps> = {
  id: 'search-field',
  label: 'SearchField',
  path: '/components/search-field',
  group: 'components',
  lead: 'SearchField는 자동완성 검색을 제공하는 입력 필드입니다.',
  defaultScenarioId: 'suggestions',
  sections: [
    {
      id: 'variants',
      label: 'Variants',
      note: 'Boxed, Filled, Plain',
      scenarioIds: ['variant-boxed', 'variant-filled', 'variant-plain'],
    },
    {
      id: 'suggestions',
      label: 'With Suggestions',
      note: '타이핑하면 추천 검색어가 표시됩니다.',
      scenarioIds: ['suggestions'],
    },
    {
      id: 'states',
      label: 'States',
      note: 'Disabled, Not clearable',
      scenarioIds: ['state-disabled', 'state-not-clearable'],
    },
    { id: 'full-width', label: 'Full Width', scenarioIds: ['full-width'] },
  ],
  scenarios: SCENARIOS,
  tokens: {
    /* 근거: `input-base.scss` 의 역할별 custom property 선언 — SearchField 는 PlainInput 을 거쳐 InputBase 를 렌더한다. */
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
      },
      {
        id: 'error',
        label: 'Error 테두리',
        tokenIds: ['color.stroke.error'],
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
    catalogSymbol: 'SearchField',
    properties: [
      {
        id: 'variant',
        prop: 'variant',
        label: 'Style',
        control: { kind: 'enum', options: VARIANT_OPTIONS },
      },
      { id: 'disabled', prop: 'disabled', label: 'Disabled', control: { kind: 'boolean' } },
    ],
    variantMatrix: {
      baseScenarioId: 'variant-boxed',
      columns: { id: 'variant', label: 'Style', prop: 'variant', options: VARIANT_OPTIONS },
    },
    stateMatrix: {
      baseScenarioId: 'variant-boxed',
      states: [
        { id: 'default', label: '기본', kind: 'prop', props: {} },
        { id: 'disabled', label: 'Disabled', kind: 'prop', props: { disabled: true } },
      ],
      interactiveOnly: ['hover', 'focus'],
    },
    notes: [
      'SearchField 는 FormControl 을 감싸지 않아 `focused` prop 이 공개되지 않는다 — TextField 와 달리 포커스 상태를 강제할 수 없다.',
      'size 는 공개 prop 이지만 이 화면의 curated example 이 아직 쓰지 않는다.',
    ],
  },
};

const render = ({ id, props }: SearchFieldScenario): ReactNode => {
  const field = (
    <SearchField {...props} suggestions={WITH_SUGGESTIONS.has(id) ? SUGGESTIONS : undefined} />
  );
  return props?.fullWidth ? <div style={{ width: '100%' }}>{field}</div> : field;
};

export const searchFieldPresentation = {
  data,
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides): ReactNode => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    // 새 객체를 만든다 — 원본 scenario 는 그대로 남는다.
    return render({
      ...scenario,
      props: { ...scenario.props, ...narrowOverrides<SearchFieldScenarioProps>(overrides) },
    });
  },
};
