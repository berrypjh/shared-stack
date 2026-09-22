import type { ConsumerJourney } from '../../domain/model';

import { componentExport } from './component-export';
import { consumerEval } from './consumer-eval';
import { consumerRetrieval } from './consumer-retrieval';
import { pluginDistribution } from './plugin-distribution';
import { qualityObservability } from './quality-observability';
import { release } from './release';
import { rnConsumer } from './rn-consumer';
import { tokenPipeline } from './token-pipeline';
import { webConsumer } from './web-consumer';

export { contexts } from './contexts';

/** 저장소가 증명하는 흐름. 소비자 흐름(웹 · RN · 조회 · 플러그인)이 먼저, 유지보수 흐름이 뒤. */
export const journeys: ConsumerJourney[] = [
  webConsumer,
  rnConsumer,
  consumerRetrieval,
  pluginDistribution,
  tokenPipeline,
  componentExport,
  consumerEval,
  qualityObservability,
  release,
];
