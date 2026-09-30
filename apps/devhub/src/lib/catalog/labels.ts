import type {
  Application,
  EvidenceGap,
  Journey,
  PackageKind,
  Platform,
  Plugin,
  PluginRule,
  RecordRef,
  Relation,
  StepStatus,
  Visibility,
} from '../../domain/model';
import type { CitationKind } from '../repository/source-usage';

/** 카탈로그 어휘를 화면 글자로. 뜻은 글자가 전하고 색은 보조다. */

export const PLATFORM: Record<Platform, string> = {
  web: '웹',
  'react-native': 'React Native',
  'platform-neutral': '플랫폼 무관',
  node: 'Node',
};

export const VISIBILITY: Record<Visibility, string> = {
  public: '공개(배포)',
  internal: '내부(private)',
};

/** 플러그인 규칙의 적용 범위. */
export const RULE_SCOPE: Record<PluginRule['scope'], string> = {
  core: '늘 적용',
  optional: '소비 저장소가 고름',
};

export const PACKAGE_KIND: Record<PackageKind, string> = {
  ui: 'UI 라이브러리',
  foundation: '토큰 · UI 계약',
  contract: '데이터 계약',
  config: '공유 설정',
};

export const APP_ROLE: Record<Application['role'], string> = {
  demo: '데모',
  explorer: '저장소 탐색기',
  e2e: 'E2E',
};

export const RELATION_KIND: Record<Relation['kind'], string> = {
  'build-dependency': '빌드 의존',
  'consumer-dependency': '소비 의존',
  'generated-artifact': '생성물',
  verification: '검증',
};

export const GAP_KIND: Record<EvidenceGap['kind'], string> = {
  'no-test': '테스트 없음',
  unsupported: '지원 안 됨',
  'known-failure': '알려진 실패',
  'doc-code-mismatch': '문서와 코드가 다름',
  'not-found': '근거 없음',
};

/** 단계 상태. 글리프와 글자가 함께 가 색만으로 구분하지 않는다. */
export const STEP_STATUS: Record<StepStatus, { label: string; glyph: string }> = {
  implemented: { label: '구현됨', glyph: '●' },
  partial: { label: '일부 구현', glyph: '◐' },
  'documented-only': { label: '저장소 밖', glyph: '○' },
};

/** 작업 흐름의 묶음. 이 순서가 탐색기 순서다. */
export const JOURNEY_KIND: Record<Journey['kind'], string> = {
  dev: '개발',
  package: '패키지',
  measure: '측정',
  eval: '소비자 평가',
};

/** 플러그인의 묶음. 이 순서가 탐색기 순서다. */
export const PLUGIN_KIND: Record<Plugin['kind'], string> = {
  commit: '커밋',
  standards: '작업 규칙',
};

/** 기록의 종류. 그 항목이 무엇에 대한 것인지 나타낸다. */
export const RECORD_KIND: Record<RecordRef['kind'], string> = {
  decision: '설계 결정',
  fix: '문제 해결',
  implementation: '구현',
};

/**
 * 문서 묶음 — 먼저 독자(에이전트 · 소비자 · 개발)로 가르고, 같은 독자 안에서 주제로 가른다.
 * 경로가 맞는 것 중 가장 긴 `prefix` 가 묶음을 정하고, 탐색기 이름은 경로에서 `base` 를 뗀 것이다.
 * 제목이 처음 나오는 순서가 화면 순서다.
 */
export const DOCUMENT_GROUP: [prefix: string, title: string, base: string][] = [
  ['README.md', '개발 · 저장소', ''],
  ['libs/ui-core/', '개발 · 저장소', ''],
  ['libs/design-tokens/', '개발 · 저장소', ''],
  ['tools/', '개발 · 도구', ''],
  ['docs/observability/', '개발 · 품질 관측', 'docs/observability/'],
  ['libs/', '소비자 · 패키지', 'libs/'],
  ['plugins/', '소비자 · 플러그인', 'plugins/'],
  ['AGENTS.md', '에이전트 · 저장소 지침', ''],
  ['.claude/', '에이전트 · 저장소 지침', ''],
  ['libs/react-ui/AGENTS.consumer.md', '에이전트 · 패키지 사용 규칙', 'libs/'],
  ['libs/react-native-ui/AGENTS.consumer.md', '에이전트 · 패키지 사용 규칙', 'libs/'],
  [
    'plugins/berry-dev/standards/rules/',
    '에이전트 · 공통 규칙 원본',
    'plugins/berry-dev/standards/rules/',
  ],
];

/** 경로를 인용하는 자리의 종류. */
export const CITATION_KIND: Record<CitationKind, string> = {
  repository: '저장소 개요',
  application: '애플리케이션',
  package: '패키지',
  tool: '도구',
  relation: '관계',
  step: '흐름 단계',
  record: '기록',
};
