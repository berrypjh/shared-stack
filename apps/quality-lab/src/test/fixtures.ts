/** test 전용 fixture. 앱 코드에서 import 하지 않는다 (`tsconfig.app.json` 이 제외한다). */
export const SHA = 'a'.repeat(40);
export const OTHER_SHA = 'b'.repeat(40);
export const HASH = 'c'.repeat(64);

type Overrides = Record<string, unknown>;

export const publicArtifact = (runId: string, metadata: Overrides = {}) => ({
  metadata: {
    schemaVersion: 1,
    runId,
    state: 'complete',
    profile: 'static',
    scope: ['workspace'],
    source: {
      kind: 'local',
      sha: SHA,
      time: '2026-09-13T13:16:29+09:00',
      ciRunId: 'unknown',
      dirty: false,
      workingTreeHash: HASH,
      lockfileHash: HASH,
    },
    collection: {
      sha: SHA,
      startedAt: '2026-09-13T14:00:00.000Z',
      finishedAt: '2026-09-13T14:00:01.000Z',
    },
    tools: { node: 'v24.20.0' },
    cache: 'disabled',
    ...metadata,
  },
  inventory: null,
  observations: [
    {
      id: 'bundle.react-ui.gzip',
      domain: 'bundle',
      unit: 'bytes',
      scope: '@berrypjh/react-ui',
      availability: 'available',
      value: 0,
      denominator: null,
      outcome: null,
      reason: null,
      evidence: [],
    },
    {
      id: 'test.quality-lab',
      domain: 'test',
      unit: 'count',
      scope: '@berrypjh/quality-lab',
      availability: 'not-run',
      value: null,
      denominator: null,
      outcome: null,
      reason: 'static profile 은 정의만 읽고 명령을 실행하지 않습니다',
      evidence: [],
    },
  ],
  tests: [],
  bundles: [],
  contexts: [],
});

/** size-limit budget 초과 사례 (react-native-ui full, 실측 모양). */
export const bundle = (overrides: Overrides = {}) => ({
  id: 'bundle.size-limit.react-native-ui.full',
  caseName: '@berrypjh/react-native-ui — * (full)',
  role: 'budget',
  method: 'size-limit',
  tool: { name: 'size-limit', version: '12.1.0' },
  package: '@berrypjh/react-native-ui',
  entry: 'libs/react-native-ui/dist/index.esm.js',
  importSpec: '*',
  externals: ['react', 'react-native', 'react/jsx-runtime'],
  target: 'es2022',
  compression: 'brotli',
  adjustment: 'size-limit-empty-project-subtracted',
  unit: 'bytes',
  configHash: HASH,
  availability: 'available',
  value: 15857,
  reason: null,
  budget: {
    limitBytes: 15100,
    limitSource: '15.1 KB',
    headroomBytes: -757,
    outcome: 'fail',
    toolPassed: false,
  },
  ...overrides,
});

/** 입력 파일이 없어 세지 못한 시나리오. */
export const contextMeasurement = (overrides: Overrides = {}) => ({
  id: 'context.package-scenario.design-tokens.agents-catalog.openai',
  scope: 'package-scenario',
  subject: 'design-tokens/agents+catalog',
  provider: 'openai-tiktoken-local',
  tokenModel: 'gpt-4o',
  tokenizerVersion: '1.0.22',
  tokenizerVersionReason: null,
  contentConstruction: 'measure-tokens-read-files',
  files: ['libs/design-tokens/dist/tokens.json'],
  missingPaths: ['libs/design-tokens/dist/AGENTS.md'],
  availability: 'unavailable',
  chars: null,
  tokens: null,
  reason: '없는 입력: libs/design-tokens/dist/AGENTS.md',
  reasonCode: 'missing-input',
  ...overrides,
});

export const publicIndex = (...ids: string[]) => ({
  version: 1,
  runs: ids.map((id) => ({ id, path: `runs/${id}.json` })),
});

/** URL → 본문. 문자열은 그대로, 나머지는 JSON 으로 응답하고 없는 URL 은 404 다. */
export const fakeFetch = (files: Record<string, unknown>) => {
  const calls: { url: string; accept: string | null }[] = [];
  const fetcher = async (url: string, init?: RequestInit) => {
    calls.push({ url, accept: new Headers(init?.headers).get('accept') });
    if (!(url in files)) return new Response('not found', { status: 404 });
    const body = files[url];
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status: 200 });
  };
  return { fetcher, calls };
};
