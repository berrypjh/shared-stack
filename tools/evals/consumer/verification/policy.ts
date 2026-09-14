import path from 'node:path';

import { REPO_ROOT } from '../runner/paths';
import type { ConsumerEvalTask, Platform, VerificationKind } from '../runner/schema';

/**
 * Task-aware verification policy.
 *
 * root `AGENTS.md`의 순서를 그대로 따른다:
 *   smallest relevant check → package-level check → broader check only when needed
 *
 * 모든 task에 lint+test+typecheck+build+storybook+e2e를 돌리지 않는다.
 * dataset의 explicit gold가 우선이고, gold가 없을 때만 default matrix를 쓴다.
 */

/** 작은 것부터. 실행도 이 순서로 하고 required 실패가 나오면 멈춘다. */
export const KIND_ORDER: VerificationKind[] = [
  'public-import',
  'typecheck',
  'test',
  'build',
  'lint',
];

/**
 * gold가 없는 task를 위한 기본 matrix. category 접두사로 고른다.
 * 실제 dataset은 전부 explicit gold를 갖고 있어 fallback 경로일 뿐이다.
 */
export const DEFAULT_MATRIX: {
  match: RegExp;
  kinds: { kind: VerificationKind; required: boolean }[];
}[] = [
  {
    // package export / integration
    match: /integration|cross-platform/,
    kinds: [
      { kind: 'public-import', required: true },
      { kind: 'typecheck', required: true },
      { kind: 'build', required: true },
    ],
  },
  {
    // behavior / accessibility
    match: /a11y|behavior|form|input|select|overlay/,
    kinds: [
      { kind: 'public-import', required: true },
      { kind: 'typecheck', required: true },
      { kind: 'test', required: true },
    ],
  },
  {
    // negative — 존재하지 않는 API를 보고해야 하는 task
    match: /negative/,
    kinds: [
      { kind: 'public-import', required: true },
      { kind: 'typecheck', required: false },
    ],
  },
  {
    // simple import / API use
    match: /.*/,
    kinds: [
      { kind: 'public-import', required: true },
      { kind: 'typecheck', required: true },
    ],
  },
];

export const defaultVerificationsFor = (
  category: string,
): { kind: VerificationKind; required: boolean }[] =>
  DEFAULT_MATRIX.find((entry) => entry.match.test(category))?.kinds ?? [];

export type TargetSource = 'in-process' | 'workspace' | 'nx-target' | 'none';

export type VerificationPlan = {
  kind: VerificationKind;
  required: boolean;
  supported: boolean;
  /** supported가 false일 때만 채워진다. */
  unsupportedReason: string | null;
  command: string | null;
  args: string[];
  cwd: string | null;
  targetSource: TargetSource;
};

/** PATH에 의존하지 않도록 workspace bin을 직접 가리킨다. */
const bin = (name: string): string => path.join(REPO_ROOT, 'node_modules/.bin', name);

const NX_BUILD_TARGET: Record<'web' | 'react-native', string> = {
  web: '@berrypjh/react-ui:build',
  'react-native': '@berrypjh/react-native-ui:build',
};

/**
 * react-native 컴포넌트는 이 harness의 jsdom fixture에서 렌더할 수 없다.
 * `react-native`가 트랜스파일되지 않은 소스를 배포해서 vite가 파싱하지 못한다 (실측 확인).
 */
const RN_TEST_UNSUPPORTED =
  'react-native components cannot render in the jsdom fixture harness (react-native ships untranspiled sources)';

const planFor = (
  kind: VerificationKind,
  required: boolean,
  platform: Platform,
  workspaceDir: string,
): VerificationPlan => {
  const base = { kind, required, supported: true, unsupportedReason: null, cwd: REPO_ROOT };

  switch (kind) {
    case 'public-import':
      return { ...base, command: null, args: [], targetSource: 'in-process' };

    case 'typecheck':
      return {
        ...base,
        command: bin('tsc'),
        args: ['-p', path.join(workspaceDir, 'tsconfig.json')],
        targetSource: 'workspace',
      };

    case 'test':
      if (platform === 'react-native' || platform === 'both') {
        return {
          ...base,
          supported: false,
          unsupportedReason: RN_TEST_UNSUPPORTED,
          command: null,
          args: [],
          targetSource: 'none',
        };
      }
      return {
        ...base,
        command: bin('vitest'),
        args: ['run', '--config', path.join(workspaceDir, 'vitest.config.mts')],
        targetSource: 'workspace',
      };

    case 'build': {
      if (platform === 'none') {
        return {
          ...base,
          supported: false,
          unsupportedReason: 'no UI package is involved, so there is nothing to build',
          command: null,
          args: [],
          targetSource: 'none',
        };
      }
      const targets =
        platform === 'both'
          ? [NX_BUILD_TARGET.web, NX_BUILD_TARGET['react-native']]
          : [NX_BUILD_TARGET[platform]];
      // 기존 Nx target을 그대로 쓴다. 새 global target을 만들지 않는다.
      return {
        ...base,
        command: bin('nx'),
        args: [
          'run-many',
          '-t',
          'build',
          '--projects',
          targets.map((t) => t.split(':')[0]).join(','),
        ],
        targetSource: 'nx-target',
      };
    }

    case 'lint':
      return {
        ...base,
        command: bin('eslint'),
        args: [path.join(workspaceDir, 'src')],
        targetSource: 'workspace',
      };
  }
};

export type PlanOptions = { workspaceDir: string };

/** gold가 있으면 gold, 없으면 default matrix. 작은 것부터 정렬한다. */
export const planVerifications = (
  task: ConsumerEvalTask,
  { workspaceDir }: PlanOptions,
): VerificationPlan[] => {
  const declared =
    task.verification.length > 0 ? task.verification : defaultVerificationsFor(task.category);

  return [...declared]
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))
    .map((v) => planFor(v.kind, v.required, task.expected.platform, workspaceDir));
};
