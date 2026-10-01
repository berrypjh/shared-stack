import type { Journey } from '../../domain/model';

import { bundleBudget } from './bundle-budget';
import { commit } from './commit';
import { consumerCatalog } from './consumer-catalog';
import { consumerRetrieval } from './consumer-retrieval';
import { evalContext } from './eval-context';
import { evalRouting } from './eval-routing';
import { evalRun } from './eval-run';
import { evalSmoke } from './eval-smoke';
import { measureTokens } from './measure-tokens';
import { mobileBuild } from './mobile-build';
import { prCheck } from './pr-check';
import { release } from './release';
import { standardsSync } from './standards-sync';
import { storybookPublish } from './storybook-publish';
import { tokenBuild } from './token-build';
import { treeshake } from './treeshake';

export { contexts } from './contexts';

/** 저장소가 증명하는 흐름. */
export const journeys: Journey[] = [
  release,
  tokenBuild,
  storybookPublish,
  consumerCatalog,
  consumerRetrieval,
  measureTokens,
  treeshake,
  bundleBudget,
  evalContext,
  evalRouting,
  evalSmoke,
  evalRun,
  prCheck,
  standardsSync,
  commit,
  mobileBuild,
];
