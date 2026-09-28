/** test 전용 run 모양. 실제 수집 결과와 같은 계약으로 만들고 요약도 계약 함수로 만든다. */
import { publicRunArtifactSchema, summarizeRun } from '@berrypjh/observability-contracts';

import { bundle, contextMeasurement, publicArtifact } from './fixtures';

type Overrides = Record<string, unknown>;

/** core profile run — react-native-ui 전체 번들이 budget 을 넘고, 컨텍스트 하나는 입력이 없어 세지 못했다. */
export const qualityArtifact = (runId = 'run-quality', metadata: Overrides = {}) => ({
  ...publicArtifact(runId, { profile: 'core', ...metadata }),
  bundles: [bundle()],
  contexts: [contextMeasurement()],
});

/** static profile run — bundle·eval 이 없는 실행. "이 영역이 없다" 대체 화면을 시험한다. */
export const designArtifact = (runId = 'run-design') => publicArtifact(runId);

/** 공개 export 한 벌. `summaries: false` 는 요약 이전에 export 한 index 다. */
export const publicFiles = (
  artifacts: { metadata: { runId: string } }[],
  { summaries = true }: { summaries?: boolean } = {},
) => {
  const files: Record<string, unknown> = {
    '/observability/index.json': {
      version: 1,
      runs: artifacts.map(({ metadata: { runId } }) => ({
        id: runId,
        path: `runs/${runId}.json`,
        ...(summaries ? { summary: `runs/${runId}.summary.json` } : {}),
      })),
    },
  };
  for (const artifact of artifacts) {
    const { runId } = artifact.metadata;
    files[`/observability/runs/${runId}.json`] = artifact;
    if (summaries) {
      files[`/observability/runs/${runId}.summary.json`] = summarizeRun(
        publicRunArtifactSchema.parse(artifact),
      );
    }
  }
  return files;
};
