import type {
  Application,
  CommandConstraint,
  ConsumerJourney,
  EvidenceGap,
  PackageKind,
  Platform,
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

export const PACKAGE_KIND: Record<PackageKind, string> = {
  ui: 'UI 라이브러리',
  foundation: '기반(토큰 · 계약)',
  contract: '데이터 계약',
  config: '공유 설정',
};

export const APP_ROLE: Record<Application['role'], string> = {
  demo: '데모',
  viewer: '결과 뷰어',
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
  'documented-only': { label: '문서에만 있음', glyph: '○' },
};

/** 기록의 종류. 그 항목이 무엇에 대한 것인지 나타낸다. */
export const RECORD_KIND: Record<RecordRef['kind'], string> = {
  decision: '설계 결정',
  fix: '문제 해결',
  implementation: '구현',
};

export const ACTOR: Record<ConsumerJourney['actor'], string> = {
  consumer: '소비자 흐름',
  maintainer: '유지보수 흐름',
};

/** 실행 조건 · 비용. 성공 · 실패가 아니다 — 경고 색으로만 보이고 성공 색을 쓰지 않는다. */
export const CONSTRAINT: Record<CommandConstraint, string> = {
  'port-binding': '포트를 열어 서버를 띄운다',
  'running-server': '떠 있는 서버가 필요하다',
  'browser-binaries': 'Playwright 브라우저가 필요하다',
  'build-output': '빌드 산출물이 먼저 있어야 한다',
  'local-registry': '로컬 registry 가 떠 있어야 한다',
  'registry-credentials': 'registry 인증 토큰이 필요하다',
  'repository-writes': '커밋 · 태그 · GitHub release 를 만든다',
  'external-executor': '외부 executor 필요 — 없으면 실행을 거부한다',
  'optional-api-key': 'API 키가 있으면 외부 API 를 부른다',
  'long-running': '여러 검사를 차례로 돌려 오래 걸린다',
  'watch-mode': '감시 모드 — 끝나지 않는다',
  'deletes-files': '파일을 지운다',
};

/** 경로를 인용하는 자리의 종류. */
export const CITATION_KIND: Record<CitationKind, string> = {
  repository: '저장소 개요',
  application: '애플리케이션',
  package: '패키지',
  tool: '도구',
  relation: '관계',
  step: '흐름 단계',
  record: '기록',
  test: '테스트 묶음',
  command: '명령 조건',
  workflow: 'CI workflow',
};
