import {
  type CatalogSet,
  getApi,
  lookupTokens,
  resolvePackages,
  resolvePlatform,
  type TokenSource,
} from '../../../../consumer-retrieval';
import type { AnthropicTool } from '../../../../lib/anthropic-messages';
import type { Variant } from '../../variants/index';
import {
  componentEvidence,
  docEvidence,
  exportEvidence,
  packageEvidence,
  propEvidence,
  tokenEvidence,
} from '../evidence';
import { type FixtureContext, toPlatformInput } from '../fixture-context';
import { type ChangedFile, type Platform, PLATFORMS } from '../schema';

/**
 * live executor 가 모델에 주는 도구. 도구마다 capability 가 하나이고, variant 가 허용한 capability 의
 * 도구만 준다. 근거(evidence id)는 도구 결과에서만 만든다 — 모델이 "읽었다"고 말한 것은 근거가 아니다.
 */

export type ToolDeps = {
  variant: Variant;
  prompt: string;
  fixture: FixtureContext;
  catalogs: CatalogSet;
  tokens: TokenSource;
  /** 저장소 상대 경로의 파일을 읽는다. 없으면 null. */
  readRepoFile: (path: string) => Promise<string | null>;
};

export type Finish = {
  platform: Platform | null;
  packages: string[] | null;
  claimedSuccess: boolean | 'unknown';
};

export type ToolResult = {
  text: string;
  isError: boolean;
  /** 검색 도구면 capability 와 대상. 파일 쓰기 · 끝내기는 검색이 아니라 없다. */
  call: { capability: string; target: string | null } | null;
  evidence: string[];
  write: ChangedFile | null;
  finish: Finish | null;
};

const result = (text: string, rest: Partial<ToolResult> = {}): ToolResult => ({
  text,
  isError: false,
  call: null,
  evidence: [],
  write: null,
  finish: null,
  ...rest,
});
const refuse = (text: string) => result(text, { isError: true });

/** 읽을 수 있는 저장소 파일과 그 capability. 이 밖의 경로는 읽지 않는다. */
const fileCapability = (path: string): string | null => {
  if (!/^libs\/[^/]+\//.test(path) || path.includes('..')) return null;
  if (path.endsWith('AGENTS.consumer.md') || path.endsWith('/dist/AGENTS.md'))
    return 'read-consumer-doc';
  if (path.endsWith('/package.json')) return 'read-package-manifest';
  if (path.endsWith('/README.md')) return 'read-readme';
  if (path.endsWith('.d.ts')) return 'read-declaration';
  if (path.endsWith('/llm-catalog.json')) return 'read-api-catalog';
  if (path.endsWith('/tokens.json')) return 'read-token-catalog';
  if (path.includes('/src/')) return 'read-source';
  return null;
};

const fileEvidence = (path: string, text: string, capability: string): string[] => {
  if (capability === 'read-package-manifest') {
    const name = (JSON.parse(text) as { name?: string }).name;
    return name ? [packageEvidence(name)] : [];
  }
  return path.endsWith('.md') ? [docEvidence(path)] : [];
};

const str = (value: unknown) => (typeof value === 'string' && value.length > 0 ? value : null);

const DEFINITIONS: (AnthropicTool & { capability: string | null })[] = [
  {
    name: 'read_file',
    capability: null,
    description:
      '저장소의 UI 패키지 파일을 읽는다. 경로는 libs/<패키지>/ 로 시작한다 (예: libs/react-ui/AGENTS.consumer.md, libs/react-ui/package.json).',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'resolve_platform',
    capability: 'resolve-platform',
    description:
      '과제와 프로젝트 의존성으로 웹 · React Native 중 어느 플랫폼인지와 쓸 패키지를 판정한다.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_symbol',
    capability: 'lookup-symbol',
    description:
      '패키지의 공개 심볼(컴포넌트 · 훅 · 함수) 하나의 API 를 조회한다. props 계약까지 준다.',
    input_schema: {
      type: 'object',
      properties: { package: { type: 'string' }, symbol: { type: 'string' } },
      required: ['package', 'symbol'],
    },
  },
  {
    name: 'lookup_token',
    capability: 'lookup-token',
    description: '디자인 토큰을 경로 · 접두어 · 분류로 찾는다 (예: color.primary).',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'write_file',
    capability: null,
    description:
      '프로젝트(fixture) 파일을 새 내용으로 쓴다. 경로는 프로젝트 기준 상대 경로다 (예: src/App.tsx).',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content'],
    },
  },
  {
    name: 'finish',
    capability: null,
    description:
      '작업을 끝낸다. 고른 플랫폼(web · react-native · both · none)과 쓴 패키지, 작업을 해냈다고 보는지 보고한다.',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: [...PLATFORMS] },
        packages: { type: 'array', items: { type: 'string' } },
        claimed_success: { type: 'boolean' },
      },
      required: ['platform', 'packages', 'claimed_success'],
    },
  },
];

/** variant 가 허용한 도구만. 파일 읽기는 허용된 읽기 capability 가 하나라도 있을 때만 준다. */
export const toolsFor = (variant: Variant): AnthropicTool[] => {
  const allowed = new Set(variant.allowedCapabilities);
  const canRead = [...allowed].some((capability) => capability.startsWith('read-'));
  return DEFINITIONS.filter(({ name, capability }) =>
    name === 'read_file' ? canRead : capability === null || allowed.has(capability),
  ).map(({ capability: _capability, ...tool }) => tool);
};

/** 도구 하나를 실행한다. 허용되지 않은 capability 는 실행하지 않고 오류로 돌려준다. */
export const runTool = async (
  name: string,
  input: Record<string, unknown>,
  deps: ToolDeps,
): Promise<ToolResult> => {
  const allowed = new Set(deps.variant.allowedCapabilities);
  const capability = DEFINITIONS.find((tool) => tool.name === name)?.capability;
  if (capability && !allowed.has(capability)) {
    return refuse(`이 variant 는 ${capability} 를 허용하지 않음`);
  }
  switch (name) {
    case 'read_file': {
      const path = str(input.path);
      const read = path ? fileCapability(path) : null;
      if (!path || !read) return refuse('libs/<패키지>/ 아래 패키지 파일만 읽을 수 있음');
      if (!allowed.has(read)) return refuse(`이 variant 는 ${read} 를 허용하지 않음`);
      const text = await deps.readRepoFile(path);
      if (text === null) return refuse(`${path} 가 없음`);
      return result(text, {
        call: { capability: read, target: path },
        evidence: fileEvidence(path, text, read),
      });
    }
    case 'resolve_platform': {
      const decision = resolvePlatform(toPlatformInput(deps.prompt, deps.fixture));
      const { packages } = resolvePackages(decision.canonical);
      return result(JSON.stringify({ platform: decision.platform, packages }), {
        call: { capability: 'resolve-platform', target: null },
        evidence: packages.map(packageEvidence),
      });
    }
    case 'get_symbol': {
      const pkg = str(input.package);
      const symbol = str(input.symbol);
      if (!pkg || !symbol) return refuse('package 와 symbol 이 필요함');
      const api = getApi(deps.catalogs, pkg, symbol);
      const call = { capability: 'lookup-symbol', target: `${pkg}#${symbol}` };
      if (api.status !== 'ok') return result(JSON.stringify(api), { call });
      const head =
        api.kind === 'component' ? componentEvidence(pkg, symbol) : exportEvidence(pkg, symbol);
      const props = Object.keys(api.props ?? {}).map((prop) => propEvidence(pkg, symbol, prop));
      return result(JSON.stringify(api), { call, evidence: [head, ...props] });
    }
    case 'lookup_token': {
      const query = str(input.query);
      if (!query) return refuse('query 가 필요함');
      const found = lookupTokens(deps.tokens, query);
      return result(JSON.stringify(found), {
        call: { capability: 'lookup-token', target: query },
        evidence: found.matches.map((match) => tokenEvidence(match.path)),
      });
    }
    case 'write_file': {
      const path = str(input.path);
      const content = typeof input.content === 'string' ? input.content : null;
      if (!path || content === null || path.startsWith('/') || path.includes('..')) {
        return refuse('프로젝트 기준 상대 경로와 내용이 필요함');
      }
      return result(`${path} 를 썼음`, { write: { path, content } });
    }
    case 'finish': {
      const platform = PLATFORMS.find((value) => value === input.platform) ?? null;
      const packages = Array.isArray(input.packages)
        ? input.packages.filter((value): value is string => typeof value === 'string')
        : null;
      const claimed =
        typeof input.claimed_success === 'boolean' ? input.claimed_success : 'unknown';
      return result('끝냄', { finish: { platform, packages, claimedSuccess: claimed } });
    }
    default:
      return refuse(`모르는 도구 ${name}`);
  }
};
