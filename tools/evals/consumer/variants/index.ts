/**
 * Baseline variant 정의.
 *
 * 세 variant는 같은 dataset과 같은 grader를 쓴다. 차이는 initial context와
 * 허용 retrieval capability뿐이다. Generated catalog는 Command 02에서 추가한다.
 */

export const VARIANT_IDS = [
  'full-source',
  'consumer-docs',
  'current-discovery',
  'current-with-catalog',
  'catalog-with-routing',
  'progressive-retrieval',
  'progressive-with-verification',
  'progressive-with-repair',
] as const;

export type VariantId = (typeof VARIANT_IDS)[number];

export type Variant = {
  id: VariantId;
  label: string;
  description: string;
  /** repo-relative 경로. `/**` 접미사는 재귀 디렉터리. */
  contextPaths: string[];
  /** logical capability ID. 구체 tool 이름·순서를 강제하지 않는다. */
  allowedCapabilities: string[];
  /**
   * platform routing이 있는 variant의 플랫폼별 초기 컨텍스트.
   * `contextPaths`는 라우팅이 거부됐을 때의 union(worst case)이고,
   * 실제 task 하나가 받는 컨텍스트는 여기 해당 플랫폼 항목이다.
   */
  routedContextPaths?: Record<'web' | 'react-native', string[]>;
};

/** D1의 컨텍스트 목록 — D2가 라우팅 거부 시 worst case로 재사용한다. */
const VARIANTS_D1_PATHS = [
  'libs/react-ui/package.json',
  'libs/react-ui/README.md',
  'libs/react-ui/dist/types/index.d.ts',
  'libs/react-ui/dist/tokens.json',
  'libs/react-ui/dist/llm-catalog.json',
  'libs/react-native-ui/package.json',
  'libs/react-native-ui/README.md',
  'libs/react-native-ui/dist/index.d.ts',
  'libs/react-native-ui/dist/llm-catalog.json',
];

/** D3의 컨텍스트·능력 — D4/D5가 그대로 재사용한다 (차이는 행동이지 컨텍스트가 아니다). */
const PROGRESSIVE_ROUTED: Record<'web' | 'react-native', string[]> = {
  web: [
    'libs/react-ui/package.json',
    'libs/react-ui/AGENTS.consumer.md',
    'libs/react-ui/dist/llm-catalog.json',
  ],
  'react-native': [
    'libs/react-native-ui/package.json',
    'libs/react-native-ui/AGENTS.consumer.md',
    'libs/react-native-ui/dist/llm-catalog.json',
  ],
};

const PROGRESSIVE_PATHS = [...PROGRESSIVE_ROUTED.web, ...PROGRESSIVE_ROUTED['react-native']];

const PROGRESSIVE_CAPABILITIES = [
  'read-package-manifest',
  'read-api-catalog',
  'resolve-platform',
  'lookup-symbol',
  'lookup-token',
  // L4 fallback — 하위 레벨로 풀리지 않을 때만.
  'read-declaration',
  'read-source',
];

export const VARIANTS: Record<VariantId, Variant> = {
  'full-source': {
    id: 'full-source',
    label: 'Full Source',
    description: 'lib source 전체를 초기 컨텍스트로 준다. correctness ceiling 기준선.',
    contextPaths: [
      'libs/ui-core/src/**',
      'libs/react-ui/src/**',
      'libs/react-native-ui/src/**',
      'libs/react-ui/package.json',
      'libs/react-native-ui/package.json',
    ],
    allowedCapabilities: [
      'read-source',
      'read-package-manifest',
      'read-consumer-doc',
      'read-declaration',
      'read-token-catalog',
      'grep-workspace',
    ],
  },
  'consumer-docs': {
    id: 'consumer-docs',
    label: 'Consumer Docs',
    description: 'AGENTS.consumer.md 중심의 compact 컨텍스트.',
    contextPaths: [
      'libs/react-ui/AGENTS.consumer.md',
      'libs/react-native-ui/AGENTS.consumer.md',
      'libs/react-ui/package.json',
      'libs/react-native-ui/package.json',
    ],
    allowedCapabilities: ['read-consumer-doc', 'read-package-manifest'],
  },
  'current-discovery': {
    id: 'current-discovery',
    label: 'Current Discovery',
    description:
      '현재 소비자가 실제로 하는 discovery — package manifest + README + 번들 declaration + token catalog.',
    contextPaths: [
      'libs/react-ui/package.json',
      'libs/react-ui/README.md',
      'libs/react-ui/dist/types/index.d.ts',
      'libs/react-ui/dist/tokens.json',
      'libs/react-native-ui/package.json',
      'libs/react-native-ui/README.md',
      'libs/react-native-ui/dist/index.d.ts',
    ],
    allowedCapabilities: [
      'read-package-manifest',
      'read-readme',
      'read-declaration',
      'read-token-catalog',
      'grep-workspace',
    ],
  },
  // D1 — Command 02 ablation. Current Discovery에 생성 카탈로그만 더한다.
  // routing / progressive lookup / repair는 건드리지 않는다.
  'current-with-catalog': {
    id: 'current-with-catalog',
    label: 'Current + Catalog',
    description: 'Current Discovery + 빌드 생성 llm-catalog.json.',
    contextPaths: VARIANTS_D1_PATHS,
    allowedCapabilities: [
      'read-package-manifest',
      'read-readme',
      'read-declaration',
      'read-token-catalog',
      'read-api-catalog',
      'grep-workspace',
    ],
  },
  // D2 — D1 + deterministic platform routing. retrieval 방식은 그대로다.
  // 달라지는 것은 "한쪽 플랫폼 자료만 읽는다"는 점뿐이다.
  'catalog-with-routing': {
    id: 'catalog-with-routing',
    label: 'Catalog + Routing',
    description: 'D1 + deterministic platform routing — 라우팅된 패키지 자료만 읽는다.',
    contextPaths: VARIANTS_D1_PATHS,
    routedContextPaths: {
      web: [
        'libs/react-ui/package.json',
        'libs/react-ui/README.md',
        'libs/react-ui/dist/types/index.d.ts',
        'libs/react-ui/dist/tokens.json',
        'libs/react-ui/dist/llm-catalog.json',
      ],
      'react-native': [
        'libs/react-native-ui/package.json',
        'libs/react-native-ui/README.md',
        'libs/react-native-ui/dist/index.d.ts',
        'libs/react-native-ui/dist/tokens.json',
        'libs/react-native-ui/dist/llm-catalog.json',
      ],
    },
    allowedCapabilities: [
      'read-package-manifest',
      'read-readme',
      'read-declaration',
      'read-token-catalog',
      'read-api-catalog',
      'resolve-platform',
      'grep-workspace',
    ],
  },
  // D3 — D2 + progressive retrieval. full declaration과 full token catalog가
  // 초기 컨텍스트에서 빠지고 L2/L3 표적 조회로 바뀐다.
  'progressive-retrieval': {
    id: 'progressive-retrieval',
    label: 'Progressive Retrieval',
    description: 'D2 + progressive lookup — 초기 컨텍스트는 문서 + 카탈로그, 나머지는 표적 조회.',
    contextPaths: PROGRESSIVE_PATHS,
    routedContextPaths: PROGRESSIVE_ROUTED,
    allowedCapabilities: PROGRESSIVE_CAPABILITIES,
  },
  // D4 — D3 + verification observation. 컨텍스트는 D3과 같다.
  // required check를 실제로 돌려 숨은 실패를 드러내기만 하고, 자동 수정은 하지 않는다.
  'progressive-with-verification': {
    id: 'progressive-with-verification',
    label: 'Progressive + Verification',
    description: 'D3 + required verification 실행 (관찰만, 자동 수정 없음).',
    contextPaths: PROGRESSIVE_PATHS,
    routedContextPaths: PROGRESSIVE_ROUTED,
    allowedCapabilities: [...PROGRESSIVE_CAPABILITIES, 'run-verification'],
  },
  // D5 — D4 + bounded minimal repair.
  'progressive-with-repair': {
    id: 'progressive-with-repair',
    label: 'Progressive + Repair',
    description: 'D4 + 실패 근거만 읽고 최소 수정 후 가장 작은 check 재실행 (시도 상한 있음).',
    contextPaths: PROGRESSIVE_PATHS,
    routedContextPaths: PROGRESSIVE_ROUTED,
    allowedCapabilities: [...PROGRESSIVE_CAPABILITIES, 'run-verification', 'repair'],
  },
};

export const resolveVariants = (ids: string[]): Variant[] =>
  ids.map((id) => {
    const v = VARIANTS[id as VariantId];
    if (!v) throw new Error(`unknown variant "${id}". valid: ${VARIANT_IDS.join(', ')}`);
    return v;
  });
