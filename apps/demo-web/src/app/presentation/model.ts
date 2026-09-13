/**
 * Shared presentation model.
 *
 * Developer View 와 앞으로의 Designer View 가 **같은 scenario 목록**을 읽게 하는 중립 계약이다.
 * 두 화면이 각자 example 을 들고 있으면 한쪽만 고쳐진 채 갈라지므로, example 의 identity 는
 * 여기 한 곳에만 둔다.
 *
 * 이 파일은 React 를 모른다 — `ReactNode` · JSX · DOM 이 data field 로 들어오지 않는다.
 * 실제 컴포넌트를 그리는 책임은 platform adapter(`components/*.tsx`)가 가진다.
 *
 * 담지 않는 것: 토큰 값, CSS 변수, class name, 라이브러리 내부 경로, 생성된 prop 카탈로그
 * (`@berrypjh/react-ui/catalog` 가 이미 가진다).
 */

export type ComponentPresentationId = string;

export type ComponentRoute = `/components/${string}`;

/** 사이드바·Library Browser 의 묶음 순서다. 두 곳이 따로 순서를 들지 않는다. */
export const PRESENTATION_GROUPS = ['components', 'layout', 'overlay'] as const;

export type PresentationGroup = (typeof PRESENTATION_GROUPS)[number];

/** 묶음의 표시 이름. Storybook 분류와 같은 말을 쓴다. */
export const GROUP_LABELS: Record<PresentationGroup, string> = {
  components: '컴포넌트',
  layout: 'Layout',
  overlay: 'Overlay',
};

/**
 * scenario 의 identity 와 문서 정보. props 를 모르는 소비자(registry, Developer page)가 읽는다.
 *
 * `id` 는 UI 문구와 독립인 stable identifier 다. `label` 은 화면에 보이는 이름이고, Button 처럼
 * 컨트롤의 이름이 곧 그 example 의 이름인 컴포넌트에서는 adapter 가 이것을 컨트롤 내용으로 쓴다.
 */
export type ScenarioMeta = {
  id: string;
  label: string;
  sectionId: string;
};

/**
 * `props` 는 없을 수 있다. IconButton 의 edge 비교처럼 하나의 example 이 여러 인스턴스를
 * 조립해야 하는 scenario 는 prop 집합으로 표현되지 않고, 그때는 adapter 가 id 로 조립한다.
 * 있을 때는 실제 컴포넌트 타입에 대해 검사된다.
 */
export type PreviewScenario<Props extends object> = ScenarioMeta & {
  props?: Readonly<Partial<Props>>;
};

/**
 * section 본문의 담는 방식. Developer docs 만 쓰는 표시 정보이고, Designer canvas 는 무시한다.
 *
 * - `preview`: scenario 들이 하나의 캔버스에 나란히 놓인다. 서로 비교하는 example 의 기본값.
 * - `panel`: scenario 마다 독립 surface 를 갖고 세로로 쌓인다. Divider 처럼 example 자체가
 *   가로 폭을 다 쓰거나, 같은 컴포넌트를 다른 맥락에서 두 번 보여 줄 때 쓴다.
 */
export type SectionSurface = 'preview' | 'panel';

export type PresentationSection = {
  id: string;
  label: string;
  note?: string;
  /** 기본값은 `preview`. */
  surface?: SectionSurface;
  /** example 아래에 붙는 보충 설명. example 이 아니므로 scenario 로 세지 않는다. */
  footnote?: string;
  /** 이 section 이 보여 줄 scenario. 순서가 화면 순서다. */
  scenarioIds: readonly string[];
};

/** props 를 지운 metadata view. 여러 컴포넌트를 한 목록에 담을 때 쓴다. */
export type PresentationMeta = {
  id: ComponentPresentationId;
  label: string;
  path: ComponentRoute;
  group: PresentationGroup;
  lead: string;
  /** Designer canvas 가 처음 보여 줄 scenario. 이 컴포넌트를 가장 잘 대표하는 것을 고른다. */
  defaultScenarioId: string;
  sections: readonly PresentationSection[];
  scenarios: readonly ScenarioMeta[];
  /** 없을 수 있다 — 비교 축이 없는 컴포넌트를 빈 matrix 로 채우지 않는다. */
  comparison?: ComparisonMeta;
  /** 없을 수 있다 — stylesheet 근거가 없는 컴포넌트를 지원되는 것처럼 보이게 하지 않는다. */
  tokens?: TokenIntrospection;
};

/** 실제 컴포넌트 props 에 대해 type-check 되는 definition data. */
export type ComponentPresentationData<Props extends object> = Omit<
  PresentationMeta,
  'scenarios' | 'comparison'
> & {
  scenarios: readonly PreviewScenario<Props>[];
  comparison?: ComponentComparison<Props>;
};

/* `TokenIntrospection` 은 generic 이 아니다 — token id 만 담으므로 props 를 알 필요가 없다. */

/* ------------------------------------------------------------------ *
 * Comparison metadata
 *
 * Designer 의 Variant / State Matrix 와 Properties Inspector 가 읽는 **curated** 선언이다.
 * 생성 카탈로그(`@berrypjh/react-ui/catalog`)를 그대로 렌더하지 않는다 — 카탈로그는 이 선언이
 * 실제 공개 API 와 맞는지 검사하는 source 이고, 무엇을 보여 줄지는 사람이 고른다.
 *
 * 일반적인 디자인 시스템 state 이름(`hover`·`focus`·`pressed`)을 자동으로 넣지 않는다.
 * public prop 으로 재현되지 않는 state 는 `interactiveOnly` 에 이름만 남기고 cell 을 만들지
 * 않는다.
 * ------------------------------------------------------------------ */

export type DesignerPropertyValue = string | number | boolean;

/** Inspector 가 만들어 내는 override. 컨트롤 값은 언제나 스칼라다. */
export type PropertyOverrides = Readonly<Record<string, DesignerPropertyValue>>;

/**
 * adapter 가 받는 override. state spec 은 스칼라가 아닌 prop 도 담을 수 있어 `unknown` 이고,
 * adapter 안에서 자기 props 타입으로 좁힌다.
 */
export type ScenarioOverrides = Readonly<Record<string, unknown>>;

export type ComparisonOption = {
  id: string;
  label: string;
  value: DesignerPropertyValue;
};

/** 비교 축 하나. `prop` 은 실제 컴포넌트 prop 키에 묶인다. */
export type ComparisonAxis<Props extends object> = {
  id: string;
  label: string;
  prop: Extract<keyof Props, string>;
  options: readonly ComparisonOption[];
};

/**
 * Variant Matrix. 축은 최대 둘이다 — 세 축을 곱하면 의미 없는 조합이 폭발한다.
 * `rows` 를 주지 않으면 한 축 비교다.
 */
export type VariantMatrixSpec<Props extends object> = {
  baseScenarioId: string;
  columns: ComparisonAxis<Props>;
  rows?: ComparisonAxis<Props>;
};

/** public prop 으로 재현되는 state 만. 그래서 `kind` 는 하나뿐이다. */
export type ComponentStateSpec<Props extends object> = {
  id: string;
  label: string;
  kind: 'prop';
  props: Readonly<Partial<Props>>;
};

export type StateMatrixSpec<Props extends object> = {
  baseScenarioId: string;
  states: readonly ComponentStateSpec<Props>[];
  /** persistent preview 가 불가능한 state 이름. 위조하지 않고 한계를 밝힌다. */
  interactiveOnly?: readonly string[];
};

export type DesignerControl =
  | { kind: 'enum'; options: readonly ComparisonOption[] }
  | { kind: 'boolean' };

/** `label` 은 designer 용 product language, `prop` 은 source 와 묶인 실제 키다. */
export type DesignerProperty<Props extends object> = {
  id: string;
  prop: Extract<keyof Props, string>;
  label: string;
  control: DesignerControl;
};

export type ComponentComparison<Props extends object> = {
  /** 생성 카탈로그에서 이 선언을 검증할 때 쓰는 public symbol 이름. */
  catalogSymbol: string;
  properties: readonly DesignerProperty<Props>[];
  variantMatrix?: VariantMatrixSpec<Props>;
  stateMatrix?: StateMatrixSpec<Props>;
  /** 축·state 가 없거나 일부만 있는 이유. 빈 matrix 를 만드는 대신 사실을 적는다. */
  notes?: readonly string[];
};

/* props 를 지운 metadata view — registry 와 Designer UI 가 읽는다. */

export type ComparisonAxisMeta = Omit<ComparisonAxis<object>, 'prop'> & { prop: string };

export type VariantMatrixMeta = {
  baseScenarioId: string;
  columns: ComparisonAxisMeta;
  rows?: ComparisonAxisMeta;
};

export type ComponentStateMeta = {
  id: string;
  label: string;
  kind: 'prop';
  props: ScenarioOverrides;
};

export type StateMatrixMeta = {
  baseScenarioId: string;
  states: readonly ComponentStateMeta[];
  interactiveOnly?: readonly string[];
};

export type DesignerPropertyMeta = {
  id: string;
  prop: string;
  label: string;
  control: DesignerControl;
};

export type ComparisonMeta = {
  catalogSymbol: string;
  properties: readonly DesignerPropertyMeta[];
  variantMatrix?: VariantMatrixMeta;
  stateMatrix?: StateMatrixMeta;
  notes?: readonly string[];
};

/**
 * erased boundary 를 건너온 override 를 definition 의 props 로 좁힌다.
 *
 * 안전한 근거: override 는 definition 이 선언한 comparison metadata 에서만 만들어지고, 그
 * prop 키와 literal 값은 `catalog-contract.spec` 이 실제 공개 API 와 대조한다. 좁히기를 여기
 * 한 곳에 모아 두어 adapter 마다 흩어지지 않게 한다.
 */
export const narrowOverrides = <Props extends object>(
  overrides: ScenarioOverrides | undefined,
): Partial<Props> => (overrides ?? {}) as Partial<Props>;

/* ------------------------------------------------------------------ *
 * Token bindings
 *
 * 어떤 token 이 이 컴포넌트를 실제로 그리는지를 **identity 로만** 적는다.
 * cssVar · 값 · theme 값을 여기 복사하지 않는다 — 전부 공개 token catalog 가 갖고 있고,
 * 복사해 두면 토큰이 바뀔 때 이 파일만 낡는다.
 *
 * binding 은 component stylesheet 를 읽은 근거가 있을 때만 적는다. 일반적인 디자인 시스템
 * 관행으로 추측하지 않는다. 근거가 없으면 빈 목록 + `notes` 로 introspection 불가를 밝힌다.
 * ------------------------------------------------------------------ */

export type TokenBinding = {
  id: string;
  /** 이 token 묶음이 무엇을 그리는지. designer 가 읽는 말이다. */
  label: string;
  /** 공개 catalog 의 token id. 값·변수는 담지 않는다. */
  tokenIds: readonly string[];
  /** 주면 그 scenario 에서만 보인다. 없으면 모든 scenario 에 해당한다. */
  scenarioIds?: readonly string[];
  /** 주면 그 state 에서만 의미가 있다 (State Matrix 의 state id). */
  stateIds?: readonly string[];
};

export type TokenIntrospection = {
  /** 비어 있을 수 있다 — 그때는 `notes` 가 이유를 말한다. */
  bindings: readonly TokenBinding[];
  notes?: readonly string[];
};
