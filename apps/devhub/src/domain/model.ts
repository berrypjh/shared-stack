/**
 * DevHub 가 보여 주는 저장소 사실의 타입. React · URL · 커밋 SHA · 줄 번호 · 측정값이 없다.
 * 레코드는 ID 로 서로를 가리킨다. 상태 어휘는 뜻마다 따로 둔다 — 한 `status` 에 싣지 않는다.
 */

/** 저장소 상대 POSIX 경로. `symbol` 은 그 파일에 글자 그대로 있는 이름이다. */
export type SourceRef = {
  readonly path: string;
  readonly symbol?: string;
  /** 디렉터리일 때만 `true`. 링크 모양(tree · blob)이 이것으로 갈린다. 테스트가 파일 시스템과 대조한다. */
  readonly directory?: true;
};

export type Repository = {
  readonly id: string;
  readonly owner: string;
  readonly name: string;
  /** `.git` 없는 원격 주소. 링크는 여기서 만들고 레코드마다 적지 않는다. */
  readonly webUrl: string;
  readonly defaultBranch: string;
  /** 저장소가 무엇인지, 문서에서 글자 그대로 옮긴 한 문장. */
  readonly purpose: { readonly text: string; readonly source: SourceRef };
  /** 워크스페이스 · lockfile 이 가리키는 패키지 매니저. 버전은 저장소가 고정할 때만 적는다. */
  readonly packageManager: 'pnpm';
  /** 위 값을 읽은 파일. */
  readonly evidence: readonly SourceRef[];
  readonly gaps?: readonly EvidenceGap[];
};

/** 코드가 도는 곳. */
export type Platform = 'web' | 'react-native' | 'platform-neutral' | 'node';

/** 매니페스트의 `private` 에서 온다. `public` 은 npm 배포 대상이다. */
export type Visibility = 'public' | 'internal';

/** 패키지가 담는 것. */
export type PackageKind =
  /** 소비자가 설치하는 UI 컴포넌트 */
  | 'ui'
  /** UI 가 빌드 때 싣는 토큰 · 계약 */
  | 'foundation'
  /** 도구와 앱이 공유하는 데이터 계약 */
  | 'contract'
  /** 다른 저장소가 가져다 쓰는 개발 설정 */
  | 'config';

/** 진입점 파일이 어디서 오는가. `build-output` 은 커밋되지 않아 빌드 전에는 없다. */
export type ArtifactOrigin = 'build-output' | 'committed';

/** 소비자가 import 하는 specifier 와 그것이 가리키는 파일. */
export type PackageEntry = {
  readonly specifier: string;
  readonly target: string;
  readonly origin: ArtifactOrigin;
};

/** 근거가 보여 주지 못하는 것. 숨기지 않고 이유와 근거를 적는다. */
export type EvidenceGap = {
  readonly kind: /** 테스트가 없다 */
  | 'no-test'
    /** 도구가 이 대상을 지원하지 않는다 */
    | 'unsupported'
    /** 알려진 실패가 문서에 적혀 있다 */
    | 'known-failure'
    /** 문서와 코드가 다르게 말한다 */
    | 'doc-code-mismatch'
    /** 저장소 안에서 근거를 찾지 못했다 */
    | 'not-found';
  readonly note: string;
  readonly evidence: readonly SourceRef[];
};

type ProjectBase = {
  /** DevHub 안의 ID. 디렉터리 이름을 쓴다. */
  readonly id: string;
  readonly root: string;
  /** Nx 프로젝트 이름과 그 매니페스트(`project.json`). */
  readonly nxProject: string;
  readonly nxManifest: SourceRef;
  readonly platform: Platform;
  readonly purpose: string;
  readonly commands: readonly string[];
  readonly docs: readonly string[];
  /** 진입점 등 대표 소스. */
  readonly source: readonly SourceRef[];
  readonly gaps?: readonly EvidenceGap[];
};

export type Application = ProjectBase & {
  readonly role: 'demo' | 'viewer' | 'explorer' | 'e2e';
  /** `package.json` 이 없는 앱(e2e)은 셋 다 비어 있다. 공개 여부는 그 매니페스트의 `private` 에서 온다. */
  readonly packageName?: string;
  readonly packageManifest?: SourceRef;
  readonly visibility?: Visibility;
};

export type Package = ProjectBase & {
  readonly kind: PackageKind;
  readonly packageName: string;
  readonly packageManifest: SourceRef;
  readonly visibility: Visibility;
  readonly entries: readonly PackageEntry[];
  /** `.` 진입점이 빌드되는 소스 배럴. 무엇을 내보내는지는 이 파일이 정한다. */
  readonly barrel?: SourceRef;
  /** 공개 표면(exports ↔ 산출물)을 고정하는 테스트. */
  readonly surfaceGuard?: SourceRef;
};

/** Nx 프로젝트가 아니어도 저장소의 일부인 도구. 플러그인도 여기 둔다. */
export type Tool = {
  readonly id: string;
  readonly name: string;
  /** 디렉터리 또는 단일 스크립트 파일. */
  readonly root: string;
  readonly rootKind: 'directory' | 'file';
  readonly platform: 'node';
  readonly purpose: string;
  readonly nxProject?: string;
  /** 매니페스트가 있는 도구(플러그인)만. 공개 여부는 그 `private` 에서 온다. */
  readonly packageName?: string;
  readonly packageManifest?: SourceRef;
  readonly visibility?: Visibility;
  readonly commands: readonly string[];
  readonly docs: readonly string[];
  readonly source: readonly SourceRef[];
  readonly gaps?: readonly EvidenceGap[];
};

/**
 * 관계는 네 종류를 섞지 않는다. `from` → `to` 의 뜻:
 * 의존은 "from 이 to 에 기댄다", 생성물은 "from 이 만든 파일을 to 가 싣는다",
 * 검증은 "from 이 to 를 확인한다".
 */
type RelationBase = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly evidence: SourceRef;
};

/** 빌드에만 쓰는 의존: 산출물에 인라인되거나 Nx 빌드 순서만 정한다. */
export type BuildDependency = RelationBase & {
  readonly kind: 'build-dependency';
  readonly declaredBy: 'devDependencies' | 'implicitDependencies';
};

/** 공개 진입점으로 쓰는 의존. `peerDependencies` 는 소비자가 함께 설치하는 런타임 의존이다. */
export type ConsumerDependency = RelationBase & {
  readonly kind: 'consumer-dependency';
  readonly declaredBy: 'dependencies' | 'peerDependencies' | 'source-import';
};

/** `from` 이 만든 파일을 `to` 가 빌드 산출물로 싣거나 읽는다. 경로는 커밋되지 않는 산출물이다. */
export type GeneratedArtifact = RelationBase & {
  readonly kind: 'generated-artifact';
  readonly artifacts: readonly string[];
};

export type Verification = RelationBase & {
  readonly kind: 'verification';
  readonly summary: string;
};

export type Relation = BuildDependency | ConsumerDependency | GeneratedArtifact | Verification;

/** 문서 안의 링크 중 대상이 저장소에 없는 것. 숨기지 않고 화면에 깨진 링크로 보인다. */
export type BrokenLink = { readonly href: string; readonly note: string };

export type DocumentRef = {
  readonly id: string;
  readonly path: string;
  /** 문서를 여는 `#` 제목, 글자 그대로. `#` 제목으로 시작하지 않는 문서(CHANGELOG)는 파일 이름이다. */
  readonly title: string;
  /** 문서에 적힌 그대로의 href. 테스트가 실제 문서의 깨진 링크와 정확히 대조한다. */
  readonly brokenLinks?: readonly BrokenLink[];
};

/**
 * 개발 기록의 날짜별 한 항목: 내린 결정 · 고친 문제 · 들어간 작업.
 * 기록은 한 번 쓰고 고쳐 쓰지 않는다 — 뒤집힌 결정은 새 기록이 된다.
 */
export type RecordRef = {
  readonly id: string;
  /** `docs/records/<date>-<id>.md`. */
  readonly path: string;
  /** 기록의 `#` 제목, 그대로. */
  readonly title: string;
  readonly kind: 'decision' | 'fix' | 'implementation';
  /** 작업이 있었던 날, `YYYY-MM-DD`. 파일 이름에도 같은 날짜가 들어간다. */
  readonly date: string;
  /** 목록에 보이는 한 줄: 열어 보지 않고도 가져가는 요지. */
  readonly summary: string;
  /** 이 기록이 다루는 파일들. 본문 옆 상세 정보에 보인다. */
  readonly sources: readonly SourceRef[];
  /** 이 기록이 정한 규칙을 지금 담고 있는 문서 ID. */
  readonly docs: readonly string[];
  /** 기록이 정하거나 고친 것을 지키는 테스트 묶음 ID. */
  readonly tests: readonly string[];
};

/**
 * 명령이 돌려면 갖춰야 하는 것, 또는 돌리면 생기는 비용 · 부작용. 근거가 있는 것만 적는다.
 * 비어 있다고 "어디서나 돈다"는 뜻은 아니다 — 알려진 조건이 없을 뿐이다. 성공 여부가 아니다.
 */
export type CommandConstraint =
  /** 포트를 열어 서버를 띄운다(끝나지 않는다) */
  | 'port-binding'
  /** 이미 떠 있는 서버가 있어야 한다 */
  | 'running-server'
  /** Playwright 브라우저가 설치돼 있어야 한다 */
  | 'browser-binaries'
  /** 먼저 빌드한 산출물(dist · storybook-static)을 읽는다 */
  | 'build-output'
  /** 로컬 registry 가 떠 있어야 한다 */
  | 'local-registry'
  /** registry 인증 토큰이 있어야 한다 */
  | 'registry-credentials'
  /** 저장소에 커밋 · 태그 · GitHub release 를 만든다 */
  | 'repository-writes'
  /** 모델을 부르는 외부 executor 가 있어야 한다. 없으면 실행을 거부한다 */
  | 'external-executor'
  /** API 키가 있으면 외부 API 를 부른다. 없으면 그 측정을 건너뛴다 */
  | 'optional-api-key'
  /** 여러 검사를 차례로 실행해 오래 걸린다 */
  | 'long-running'
  /** 감시 모드로 끝나지 않는다 */
  | 'watch-mode'
  /** 생성물 · 캐시를 지운다 */
  | 'deletes-files';

/** 조건 하나와 그것을 말하는 파일. */
export type ConstraintRef = { readonly kind: CommandConstraint; readonly evidence: SourceRef };

export type CommandSource =
  | { readonly kind: 'package-script'; readonly script: string }
  | { readonly kind: 'nx-target'; readonly project: string; readonly target: string };

/** 엔지니어링 화면의 묶음. 명령은 정확히 한 묶음에 든다. */
export type CommandGroupId =
  | 'build'
  | 'verify'
  | 'tokens'
  | 'storybook'
  | 'bundle'
  | 'consumer-catalog'
  | 'consumer-retrieval'
  | 'consumer-eval'
  | 'measurement'
  | 'observability'
  | 'release'
  | 'plugin'
  | 'dev-server'
  | 'workspace';

export type CommandGroup = {
  readonly id: CommandGroupId;
  readonly title: string;
  readonly summary: string;
  /** 이 묶음을 설명하는 문서. 흐름 · 결과 화면으로 가는 링크는 화면이 카탈로그에서 찾는다. */
  readonly docs: readonly string[];
};

export type CommandRef = {
  readonly id: string;
  readonly source: CommandSource;
  readonly group: CommandGroupId;
  readonly purpose: string;
  readonly constraints: readonly ConstraintRef[];
};

/**
 * CI step 이 무엇을 부르는가.
 * - `command`: 카탈로그 명령을 그대로(`pnpm run x`)
 * - `target`: `nx affected -t <target>` — 바뀐 프로젝트의 그 target 만
 * - `direct`: 스크립트 없이 도구 진입점을 직접
 * - `action`: 저장소 밖 GitHub Action
 */
export type CiInvocation =
  | { readonly kind: 'command'; readonly command: string }
  | { readonly kind: 'target'; readonly target: string; readonly exclude?: readonly string[] }
  | { readonly kind: 'direct'; readonly tool: string }
  | { readonly kind: 'action'; readonly action: string };

export type CiStep = {
  readonly name: string;
  /** workflow 에 적힌 그대로의 한 줄(여러 줄이면 첫 줄). action 은 없다. */
  readonly run?: string;
  /** 이 step 이 도는 조건(`if:`). 없으면 job 이 돌 때마다 돈다. */
  readonly when?: string;
  readonly invokes: CiInvocation;
};

export type CiJob = {
  readonly id: string;
  readonly name: string;
  readonly needs: readonly string[];
  readonly steps: readonly CiStep[];
};

export type CiWorkflow = {
  readonly id: string;
  readonly path: string;
  readonly name: string;
  /** 언제 도는가. workflow `on:` 을 글로. */
  readonly trigger: string;
  readonly jobs: readonly CiJob[];
  readonly notes?: readonly { readonly text: string; readonly evidence: SourceRef }[];
};

/** 테스트 묶음 하나: 러너 · 설정 파일 · 실행 명령 · 확인 대상. 개수 · 결과는 담지 않는다. */
export type TestSuite = {
  readonly id: string;
  readonly runner: 'vitest' | 'jest' | 'playwright' | 'storybook-test-runner';
  readonly config: SourceRef;
  readonly command: string;
  readonly subjects: readonly string[];
  /** 설정 전체가 아니라 특정 파일이 묶음일 때. */
  readonly files?: readonly SourceRef[];
};

/** 단계가 실제로 도는 곳. 저장소 밖(소비자 앱 · 소비 저장소)도 이름을 붙여 구분한다. */
export type ExecutionContext = {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
};

/**
 * 단계의 근거 상태. 다른 상태 어휘와 섞지 않는다.
 * - `implemented`: 저장소 코드가 그 일을 한다(소스가 반드시 있다)
 * - `partial`: 코드는 있지만 빠진 것이 있다(근거 공백이 반드시 있다)
 * - `documented-only`: 저장소 밖에서 일어나 문서만 말한다(소스 없이 문서가 반드시 있다)
 */
export type StepStatus = 'implemented' | 'partial' | 'documented-only';

export type JourneyStep = {
  /** 흐름 안에서 유일하다. */
  readonly id: string;
  /** 사람이 하려는 것. */
  readonly intent: string;
  /** 그에 따라 저장소 · 도구가 하는 것. */
  readonly behavior: string;
  readonly context: string;
  /** 이 단계를 책임지는 앱 · 패키지 · 도구. */
  readonly owner: string;
  readonly status: StepStatus;
  readonly source: readonly SourceRef[];
  readonly commands: readonly string[];
  readonly tests: readonly string[];
  readonly docs: readonly string[];
  /** 이어질 수 있는 단계 ID. 끝이면 비어 있다. */
  readonly next: readonly string[];
  readonly gaps?: readonly EvidenceGap[];
};

/**
 * 저장소가 증명하는 개발자 · 소비자 흐름. 들어오는 선이 없는 단계가 시작이다(여럿일 수 있다).
 * `platform` 은 한 렌더러의 흐름에만 붙는다.
 */
export type ConsumerJourney = {
  readonly id: string;
  readonly title: string;
  readonly goal: string;
  readonly actor: 'consumer' | 'maintainer';
  readonly platform?: 'web' | 'react-native';
  readonly steps: readonly JourneyStep[];
};

/**
 * 빌드 · 개발 서버가 뜰 때 git 으로 읽은 저장소 상태. 카탈로그가 아니라 빌드 환경의 사실이다.
 * 읽지 못한 값은 `null` 이다 — 추측하지 않는다. `branch` 가 `null` 이면 detached HEAD 이거나 알 수 없다.
 */
export type RepositorySnapshot = {
  readonly source: 'git' | 'unavailable';
  readonly commit: string | null;
  readonly branch: string | null;
  /** 작업 트리가 커밋과 다른가. */
  readonly dirty: boolean | null;
  /**
   * 스냅샷 커밋에 없는 경로(추적되지 않음 · 새로 추가됨). `/` 로 끝나면 그 아래 전부다.
   * 이 경로의 고정 링크는 404 라 만들지 않는다. 모르면 `null`.
   */
  readonly uncommitted: readonly string[] | null;
};

export type Catalog = {
  readonly repository: Repository;
  readonly applications: readonly Application[];
  readonly packages: readonly Package[];
  readonly tools: readonly Tool[];
  readonly relations: readonly Relation[];
  readonly documents: readonly DocumentRef[];
  readonly records: readonly RecordRef[];
  readonly commands: readonly CommandRef[];
  readonly commandGroups: readonly CommandGroup[];
  readonly workflows: readonly CiWorkflow[];
  readonly tests: readonly TestSuite[];
  readonly contexts: readonly ExecutionContext[];
  readonly journeys: readonly ConsumerJourney[];
};
