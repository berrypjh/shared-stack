import {
  type Confidence,
  type PlatformClass,
  type PlatformDiagnosis,
  type PlatformEvidence,
  toCanonical,
} from './types';

/**
 * Deterministic platform resolution.
 *
 * Router LLM을 쓰지 않는다. 관측 가능한 근거만 본다.
 *
 * ## 근거 우선순위
 *
 * 1. 설치된 UI package (`dependencies`) — 프로젝트가 *할 수 있는* 것
 * 2. 명시적 task wording — 사용자가 *요구한* 것
 * 3. target file 경로
 * 4. project source tree
 *
 * 1이 요구를 제한한다. 요구가 설치 상태와 충돌하면 조용히 한쪽을 고르지 않고
 * `ambiguous`를 반환한다.
 */

export const WEB_PACKAGE = '@berrypjh/react-ui';
export const NATIVE_PACKAGE = '@berrypjh/react-native-ui';

type Signal = 'web' | 'react-native';

/** 명시적인 표현만 넣는다. `앱`처럼 일반 명사로 흔히 쓰이는 말은 제외. */
const PROMPT_MARKERS: { pattern: RegExp; signals: Signal; label: string }[] = [
  { pattern: /\breact[\s-]?native\b/i, signals: 'react-native', label: 'react native' },
  { pattern: /\brn\b/i, signals: 'react-native', label: 'rn' },
  { pattern: /\bexpo\b/i, signals: 'react-native', label: 'expo' },
  { pattern: /\bios\b/i, signals: 'react-native', label: 'ios' },
  { pattern: /\bandroid\b/i, signals: 'react-native', label: 'android' },
  { pattern: /리액트\s?네이티브/, signals: 'react-native', label: '리액트 네이티브' },
  { pattern: /네이티브/, signals: 'react-native', label: '네이티브' },
  { pattern: /모바일/, signals: 'react-native', label: '모바일' },
  { pattern: /\bweb\b/i, signals: 'web', label: 'web' },
  { pattern: /\bbrowser\b/i, signals: 'web', label: 'browser' },
  { pattern: /\bdom\b/i, signals: 'web', label: 'dom' },
  { pattern: /웹/, signals: 'web', label: '웹' },
  { pattern: /브라우저/, signals: 'web', label: '브라우저' },
];

/** 양 플랫폼을 동시에 요구한다는 명시적 표현. */
const CROSS_PLATFORM_MARKERS: { pattern: RegExp; label: string }[] = [
  { pattern: /양쪽/, label: '양쪽' },
  { pattern: /둘\s?다/, label: '둘 다' },
  { pattern: /\bboth\b/i, label: 'both' },
  { pattern: /cross[\s-]?platform/i, label: 'cross-platform' },
];

const PATH_MARKERS: { pattern: RegExp; signals: Signal; label: string }[] = [
  {
    pattern: /(^|\/)(native|mobile|ios|android)(\/|$)/i,
    signals: 'react-native',
    label: 'native path',
  },
  { pattern: /(^|\/)(web|browser)(\/|$)/i, signals: 'web', label: 'web path' },
  {
    pattern: /app\.json$|expo\.|metro\.config/i,
    signals: 'react-native',
    label: 'expo/metro config',
  },
  { pattern: /vite\.config|index\.html$/i, signals: 'web', label: 'web config' },
];

export type PlatformInput = {
  prompt: string;
  /**
   * consumer project의 dependencies. **주어지지 않으면**(`undefined`) 설치 상태를
   * 모른다는 뜻이고, 빈 객체는 "UI package가 설치되어 있지 않다"는 뜻이다.
   */
  dependencies?: Record<string, string>;
  targetFiles?: string[];
  projectFiles?: string[];
};

export type PlatformDecision = {
  platform: PlatformDiagnosis;
  /** eval canonical class. `ambiguous`면 null — 추측하지 않는다. */
  canonical: PlatformClass | null;
  confidence: Confidence;
  evidence: PlatformEvidence[];
};

const collectPrompt = (prompt: string, evidence: PlatformEvidence[]): Set<Signal> => {
  const out = new Set<Signal>();
  for (const marker of CROSS_PLATFORM_MARKERS) {
    if (!marker.pattern.test(prompt)) continue;
    evidence.push({ kind: 'prompt', value: marker.label, signals: null });
    out.add('web');
    out.add('react-native');
  }
  for (const marker of PROMPT_MARKERS) {
    if (!marker.pattern.test(prompt)) continue;
    evidence.push({ kind: 'prompt', value: marker.label, signals: marker.signals });
    out.add(marker.signals);
  }
  return out;
};

const collectPaths = (
  files: string[] | undefined,
  kind: 'target-file' | 'project-file',
  evidence: PlatformEvidence[],
): Set<Signal> => {
  const out = new Set<Signal>();
  for (const file of files ?? []) {
    for (const marker of PATH_MARKERS) {
      if (!marker.pattern.test(file)) continue;
      evidence.push({ kind, value: file, via: marker.label, signals: marker.signals });
      out.add(marker.signals);
    }
  }
  return out;
};

const decide = (
  available: Set<Signal> | null,
  requested: Set<Signal>,
): { platform: PlatformDiagnosis; confidence: Confidence } => {
  if (available && available.size === 0) return { platform: 'none', confidence: 'high' };

  if (requested.size === 0) {
    if (!available) return { platform: 'ambiguous', confidence: 'low' };
    if (available.size === 1) return { platform: [...available][0], confidence: 'medium' };
    return { platform: 'ambiguous', confidence: 'low' };
  }

  const impossible = available && [...requested].some((s) => !available.has(s));
  if (impossible) return { platform: 'ambiguous', confidence: 'low' };

  if (requested.size === 2) return { platform: 'both', confidence: available ? 'high' : 'medium' };
  return { platform: [...requested][0], confidence: available ? 'high' : 'medium' };
};

export const resolvePlatform = (input: PlatformInput): PlatformDecision => {
  const evidence: PlatformEvidence[] = [];

  let available: Set<Signal> | null = null;
  if (input.dependencies) {
    available = new Set<Signal>();
    if (WEB_PACKAGE in input.dependencies) {
      evidence.push({ kind: 'dependency', value: WEB_PACKAGE, signals: 'web' });
      available.add('web');
    }
    if (NATIVE_PACKAGE in input.dependencies) {
      evidence.push({ kind: 'dependency', value: NATIVE_PACKAGE, signals: 'react-native' });
      available.add('react-native');
    }
    if (available.size === 0) {
      evidence.push({ kind: 'dependency-absent', value: 'no @berrypjh UI package', signals: null });
    }
  }

  const requested = new Set<Signal>([
    ...collectPrompt(input.prompt, evidence),
    ...collectPaths(input.targetFiles, 'target-file', evidence),
    ...collectPaths(input.projectFiles, 'project-file', evidence),
  ]);

  const { platform, confidence } = decide(available, requested);
  if (platform === 'ambiguous' && available && requested.size > 0) {
    evidence.push({
      kind: 'conflict',
      value: `requested ${[...requested].join('+')} but installed ${[...available].join('+') || 'none'}`,
      signals: null,
    });
  }

  return { platform, canonical: toCanonical(platform), confidence, evidence };
};
