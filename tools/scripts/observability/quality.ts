import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  type RunArtifact,
  runArtifactSchema,
  SCHEMA_VERSION,
} from '@berrypjh/observability-contracts';

import { REPO_ROOT } from '../generate-consumer-catalog/config';

import { parseQualityArgs, type QualityArgs, runDevhubAudit } from './audit';
import { openPlaywrightBrowser } from './audit-browser';
import { exportRun, PUBLIC_ROOT } from './export';
import { gitReader, readInventory, readSource, readToolVersions } from './static';
import { STORE_ROOT, writeRun } from './store';

/**
 * 접근성 수집 CLI.
 *
 *   pnpm dev:devhub                                       # 다른 터미널에서 먼저 띄운다
 *   pnpm quality --base-url=http://localhost:4400 [--run-id=<id>]
 *
 * DevHub 평가 화면을 localhost 에서 axe 로 검사한다. 수집한 run 은 store 에 쓰고 공개 artifact 로 export 한다.
 */

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

  const devhub = await runDevhubAudit({
    baseUrl,
    now,
    reachable: reachable(baseUrl),
    openBrowser: openPlaywrightBrowser,
  });

  return runArtifactSchema.parse({
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      runId,
      state: devhub.outcome === 'completed' ? 'complete' : 'partial',
      profile: 'a11y',
      scope: ['@berrypjh/devhub'],
      source,
      collection: { sha: source.sha, startedAt, finishedAt: now().toISOString() },
      tools: readToolVersions(REPO_ROOT, process.env),
      cache: 'disabled',
    },
    inventory,
    observations: [],
    bundles: [],
    contexts: [],
    evals: [],
    designSystem: null,
    accessibility: [devhub],
  });
};

const main = async (argv: string[]) => {
  const args = parseQualityArgs(argv, () => new Date());
  const artifact = await collect(args);
  const storeRoot = path.join(REPO_ROOT, STORE_ROOT);
  await writeRun(storeRoot, {
    artifact,
    raw: [{ path: 'a11y-inputs.json', value: { baseUrl: args.baseUrl } }],
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
