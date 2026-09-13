import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  type AccessibilitySummary,
  type RunArtifact,
  runArtifactSchema,
  SCHEMA_VERSION,
} from '@berrypjh/observability-contracts';

import { REPO_ROOT } from '../generate-consumer-catalog/config';

import { parseStoryIndex, STORYBOOK_INDEX_PATH, storybookSummary } from './adapters/storybook-a11y';
import { parseVitestReport } from './adapters/vitest';
import {
  A11Y_IMPORTS,
  manualSummary,
  staticCssSummary,
  tokenContrastSummary,
  uiTestSummary,
} from './collectors/a11y';
import { contrastGuards, DESIGN_PATHS } from './collectors/design-system';
import { readImport } from './collectors/imports';
import { type QualityArgs, runQualityLabAudit } from './audit';
import { openPlaywrightBrowser } from './audit-browser';
import { setBaseline } from './baseline';
import { exportRun, PUBLIC_ROOT } from './export';
import { parseQualityCommand } from './quality-args';
import { ArtifactError, readText } from './safe-fs';
import { gitReader, readInventory, readSource, readToolVersions } from './static';
import { STORE_ROOT, writeRun } from './store';

/**
 * 접근성 수집 CLI.
 *
 *   pnpm quality:lab                                  # 다른 터미널에서 먼저 띄운다
 *   pnpm quality --base-url=http://localhost:4300 [--run-id=<id>]
 *
 * quality-lab 을 localhost 에서 axe 로 검사하고, 이미 만든 Storybook·vitest·수동 기록을
 * `tmp/quality-lab/imports/a11y/` 에서 읽는다. 없으면 그 출처는 not-run 이다. 수집한 run 은
 * store 에 쓰고 공개 artifact 로 export 한다.
 */

/** 없는 파일은 null — 가져오지 않은 것이다. 그 밖의 오류는 그대로 던진다. */
const optional = async (read: () => Promise<string>): Promise<string | null> => {
  try {
    return await read();
  } catch (error) {
    if (error instanceof ArtifactError && error.kind === 'missing') return null;
    throw error;
  }
};

const readReport = async (file: string) => {
  const text = await optional(() => readImport(REPO_ROOT, file));
  return text === null ? null : parseVitestReport(text);
};

const REACHABLE_TIMEOUT_MS = 3000;

const reachable = (baseUrl: string) => async () => {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(REACHABLE_TIMEOUT_MS) });
    return response.ok;
  } catch {
    return false;
  }
};

const collect = async ({ baseUrl, runId }: QualityArgs): Promise<RunArtifact> => {
  const now = () => new Date();
  const startedAt = now().toISOString();
  const source = await readSource(REPO_ROOT, gitReader(REPO_ROOT), process.env);
  const inventory = await readInventory(REPO_ROOT);

  const [contrast, contrastTest, indexText, storybookText, manualText] = await Promise.all([
    optional(() => readText(REPO_ROOT, DESIGN_PATHS.contrast)),
    optional(() => readText(REPO_ROOT, DESIGN_PATHS.contrastTest)),
    optional(() => readText(REPO_ROOT, STORYBOOK_INDEX_PATH)),
    optional(() => readImport(REPO_ROOT, A11Y_IMPORTS.storybook)),
    optional(() => readImport(REPO_ROOT, A11Y_IMPORTS.manual)),
  ]);
  const [designTokens, reactUi, demoWeb, qualityLab] = await Promise.all([
    readReport(A11Y_IMPORTS.designTokens),
    readReport(A11Y_IMPORTS.reactUi),
    readReport(A11Y_IMPORTS.demoWeb),
    readReport(A11Y_IMPORTS.qualityLab),
  ]);

  const accessibility: AccessibilitySummary[] = [
    storybookSummary({
      resultsText: storybookText,
      index: indexText === null ? null : parseStoryIndex(indexText),
      indexPath: STORYBOOK_INDEX_PATH,
    }),
    tokenContrastSummary({ guards: contrastGuards(contrast, contrastTest), report: designTokens }),
    staticCssSummary({ report: reactUi }),
    uiTestSummary({ reactUi, demoWeb, qualityLab }),
    manualSummary({ text: manualText }),
    await runQualityLabAudit({
      baseUrl,
      now,
      reachable: reachable(baseUrl),
      openBrowser: openPlaywrightBrowser,
    }),
  ];

  return runArtifactSchema.parse({
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      runId,
      state: accessibility.every((summary) => summary.outcome === 'completed')
        ? 'complete'
        : 'partial',
      profile: 'a11y',
      scope: ['@berrypjh/quality-lab', '@berrypjh/react-ui', '@berrypjh/design-tokens'],
      source,
      collection: { sha: source.sha, startedAt, finishedAt: now().toISOString() },
      tools: readToolVersions(REPO_ROOT, process.env),
      cache: 'disabled',
    },
    inventory,
    observations: [],
    tests: [],
    bundles: [],
    contexts: [],
    evals: [],
    designSystem: null,
    packageSurfaces: [],
    accessibility,
  });
};

/** 이미 export 한 run 을 그 profile 의 baseline 으로 가리킨다. run 파일은 바꾸지 않는다. */
const pointBaseline = async (runId: string, replace: boolean) => {
  const { changed, pointer } = await setBaseline({
    storeRoot: path.join(REPO_ROOT, STORE_ROOT),
    publicRoot: path.join(REPO_ROOT, PUBLIC_ROOT),
    runId,
    now: () => new Date(),
    replace,
  });
  const profile = pointer.pointers.find((entry) => entry.runId === runId)?.profile;
  console.log(
    changed
      ? `baseline ${profile} -> ${runId} (${STORE_ROOT}/baseline.json, ${PUBLIC_ROOT}/baseline.json)`
      : `baseline ${profile} 은 이미 ${runId} 입니다 — 바꾸지 않았습니다`,
  );
};

const main = async (argv: string[]) => {
  const command = parseQualityCommand(argv, () => new Date());
  if (command.mode === 'baseline') return pointBaseline(command.runId, command.replace);
  const args: QualityArgs = { baseUrl: command.baseUrl, runId: command.runId };
  const artifact = await collect(args);
  const storeRoot = path.join(REPO_ROOT, STORE_ROOT);
  await writeRun(storeRoot, {
    artifact,
    raw: [
      {
        path: 'a11y-inputs.json',
        value: {
          baseUrl: args.baseUrl,
          imports: A11Y_IMPORTS,
          storybookIndex: STORYBOOK_INDEX_PATH,
        },
      },
    ],
  });
  const written = await exportRun({
    storeRoot,
    publicRoot: path.join(REPO_ROOT, PUBLIC_ROOT),
    runId: args.runId,
  });
  for (const summary of artifact.accessibility) {
    console.log(`${summary.id}: ${summary.outcome}${summary.reason ? ` — ${summary.reason}` : ''}`);
  }
  console.log(`collected ${args.runId} (a11y) -> ${STORE_ROOT}/runs/${args.runId}`);
  console.log(`exported ${args.runId} -> ${PUBLIC_ROOT}/${written}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
