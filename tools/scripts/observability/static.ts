import { execFile } from 'node:child_process';
import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  type Inventory,
  isoTimeSchema,
  type Observation,
  type RunArtifact,
  runArtifactSchema,
  type RunSource,
  SCHEMA_VERSION,
  UNKNOWN,
} from '@berrypjh/observability-contracts';

import { z } from 'zod';

import { publicSpecifiers } from '../../lib/package-exports';

import { COMMANDS, type CommandSpec } from './registry';
import {
  ArtifactError,
  isMissing,
  missingAs,
  readJson,
  readText,
  resolveInside,
  sha256,
} from './safe-fs';
import type { RawFile } from './store';

export type GitReader = {
  head: () => Promise<string | null>;
  commitTime: () => Promise<string | null>;
  status: () => Promise<string | null>;
  diff: () => Promise<string | null>;
};

const execFileAsync = promisify(execFile);

/** 고정 argv 의 읽기 전용 git 명령. 실패하면 null — 모르는 것으로 남긴다. */
export const gitReader = (cwd: string): GitReader => {
  const git =
    (...args: string[]) =>
    () =>
      execFileAsync('git', args, { cwd, maxBuffer: 64 * 1024 * 1024 }).then(
        ({ stdout }) => stdout,
        () => null,
      );
  return {
    head: git('rev-parse', 'HEAD'),
    commitTime: git('show', '-s', '--format=%cI', 'HEAD'),
    status: git('status', '--porcelain=v1'),
    diff: git('diff', 'HEAD', '--binary'),
  };
};

const MANIFEST_MAX_BYTES = 1024 * 1024;
const LOCKFILE_MAX_BYTES = 50 * 1024 * 1024;
const WORKSPACE_DIRS = ['apps', 'libs'];
const THEMES_FILE = 'libs/design-tokens/src/themes.ts';
const WORKFLOWS_DIR = '.github/workflows';
const GIT_SHA = /^[0-9a-f]{40}$/;
const CI_RUN_ID = /^[\w.-]{1,64}$/;

const manifestSchema = z.looseObject({
  name: z.string().optional(),
  private: z.boolean().optional(),
  exports: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  scripts: z.record(z.string(), z.string()).optional(),
});

const listDir = async (root: string, relative: string): Promise<Dirent[]> =>
  fs
    .readdir(await resolveInside(root, relative), { withFileTypes: true })
    .catch((error: unknown) => {
      if (isMissing(error)) return [];
      throw error;
    });

/** symlink 도 목록에 남긴다 — 건너뛰지 않고 resolveInside 가 거부하게 한다. */
const readPackages = async (root: string): Promise<Inventory['packages']> => {
  const packages: Inventory['packages'] = [];
  for (const dir of WORKSPACE_DIRS) {
    const names = (await listDir(root, dir))
      .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
      .map((entry) => entry.name)
      .sort();
    for (const name of names) {
      const relative = `${dir}/${name}`;
      const manifest = await readJson(
        root,
        `${relative}/package.json`,
        manifestSchema,
        MANIFEST_MAX_BYTES,
      ).catch(missingAs(null));
      if (!manifest?.name) continue;
      const exportsMap =
        typeof manifest.exports === 'string' ? { '.': manifest.exports } : manifest.exports;
      packages.push({
        name: manifest.name,
        path: relative,
        private: manifest.private === true,
        exports: publicSpecifiers(manifest.name, exportsMap),
      });
    }
  }
  return packages;
};

/** themes.ts 를 실행하지 않고 `export const themes = [...] as const` 안의 `name: '...'` 만 읽는다. */
export const parseThemeNames = (source: string): string[] => {
  const block = /export const themes = \[([\s\S]*?)\]\s*as const/.exec(source)?.[1];
  if (block === undefined)
    throw new ArtifactError('invalid-schema', `${THEMES_FILE}: themes array not found`);
  return [...block.matchAll(/\bname:\s*'([a-zA-Z0-9]+)'/g)].map((match) => match[1]);
};

const readWorkflows = async (root: string): Promise<Inventory['workflows']> => {
  const names = (await listDir(root, WORKFLOWS_DIR))
    .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  return Promise.all(
    names.map(async (name) => {
      const relative = `${WORKFLOWS_DIR}/${name}`;
      return { path: relative, sha256: sha256(await readText(root, relative)) };
    }),
  );
};

/** manifest·exports·script 이름·등록 theme·등록 명령·workflow 정의. 아무것도 import 하거나 실행하지 않는다. */
export const readInventory = async (root: string): Promise<Inventory> => {
  const rootManifest = await readJson(root, 'package.json', manifestSchema, MANIFEST_MAX_BYTES);
  return {
    packages: await readPackages(root),
    themes: parseThemeNames(await readText(root, THEMES_FILE)),
    scripts: Object.keys(rootManifest.scripts ?? {}).sort(),
    commands: COMMANDS.map(({ id, domain, argv }) => ({ id, domain, argv: [...argv] })),
    workflows: await readWorkflows(root),
  };
};

/** 측정 대상 source 의 출처. 확인하지 못한 항목은 unknown 으로 남긴다. */
export const readSource = async (
  root: string,
  git: GitReader,
  env: NodeJS.ProcessEnv,
): Promise<RunSource> => {
  const [head, commitTime, status, diff] = await Promise.all([
    git.head(),
    git.commitTime(),
    git.status(),
    git.diff(),
  ]);
  const sha = head?.trim() ?? '';
  const time = commitTime?.trim() ?? '';
  const inGitHubActions = env.GITHUB_ACTIONS === 'true';
  const ciRunId = env.GITHUB_RUN_ID ?? '';
  const lockfileHash = await readText(root, 'pnpm-lock.yaml', LOCKFILE_MAX_BYTES).then(
    sha256,
    missingAs(UNKNOWN),
  );

  return {
    kind: inGitHubActions ? 'ci' : env.CI ? UNKNOWN : 'local',
    sha: GIT_SHA.test(sha) ? sha : UNKNOWN,
    time: isoTimeSchema.safeParse(time).success ? time : UNKNOWN,
    ciRunId: inGitHubActions && CI_RUN_ID.test(ciRunId) ? ciRunId : UNKNOWN,
    dirty: status === null ? UNKNOWN : status.trim().length > 0,
    // untracked 파일 내용은 포함하지 않는다 — status 의 경로 목록만 들어간다.
    workingTreeHash: status === null || diff === null ? UNKNOWN : sha256(`${status}\0${diff}`),
    lockfileHash,
  };
};

/** 설치된 도구 버전. 읽지 못하면 unknown. */
export const readToolVersions = (root: string, env: NodeJS.ProcessEnv): Record<string, string> => {
  const require = createRequire(path.join(root, 'package.json'));
  const version = (name: string) => {
    try {
      return (require(`${name}/package.json`) as { version: string }).version;
    } catch {
      return UNKNOWN;
    }
  };
  return {
    node: process.version,
    pnpm: /\bpnpm\/(\S+)/.exec(env.npm_config_user_agent ?? '')?.[1] ?? UNKNOWN,
    nx: version('nx'),
    typescript: version('typescript'),
    vitest: version('vitest'),
    jest: version('jest'),
    'size-limit': version('size-limit'),
    esbuild: version('esbuild'),
    zod: version('zod'),
  };
};

const NOT_RUN_REASON = 'static profile 은 정의만 읽고 명령을 실행하지 않습니다';

const notRun = (command: CommandSpec): Observation => {
  const evidence = [
    { source: 'command' as const, commandId: command.id, exitCode: null, excerpt: null },
  ];
  if (command.domain === 'verification') {
    return {
      id: command.id,
      domain: 'verification',
      scope: command.scope,
      kind: command.kind,
      status: 'not-run',
      availability: 'not-run',
      outcome: null,
      exitCode: null,
      durationMs: null,
      reason: NOT_RUN_REASON,
      evidence,
    };
  }
  return {
    id: command.id,
    domain: command.domain,
    unit: command.unit,
    scope: command.scope,
    availability: 'not-run',
    value: null,
    denominator: null,
    outcome: null,
    reason: NOT_RUN_REASON,
    evidence,
  };
};

export type StaticInput = {
  workspaceRoot: string;
  runId: string;
  git: GitReader;
  env: NodeJS.ProcessEnv;
  now: () => Date;
  toolVersions: Record<string, string>;
};

/**
 * static profile. 정의를 읽어 inventory 로 남기고, 등록 명령은 전부 not-run 으로 기록한다.
 * 수집기 코드는 측정 대상과 같은 checkout 에서 돌므로 collection SHA 는 source SHA 와 같다.
 */
export const collectStatic = async (
  input: StaticInput,
): Promise<{ artifact: RunArtifact; raw: RawFile[] }> => {
  const startedAt = input.now().toISOString();
  const source = await readSource(input.workspaceRoot, input.git, input.env);
  const inventory = await readInventory(input.workspaceRoot);

  const artifact = runArtifactSchema.parse({
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      runId: input.runId,
      state: 'complete',
      profile: 'static',
      scope: ['workspace'],
      source,
      collection: { sha: source.sha, startedAt, finishedAt: input.now().toISOString() },
      tools: input.toolVersions,
      cache: 'disabled',
    },
    inventory,
    observations: COMMANDS.map(notRun),
    tests: [],
    bundles: [],
    contexts: [],
  });

  const inputs = { workflows: inventory.workflows, lockfileHash: source.lockfileHash };
  return { artifact, raw: [{ path: 'static-inputs.json', value: inputs }] };
};
