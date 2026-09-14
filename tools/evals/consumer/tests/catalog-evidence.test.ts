import { describe, expect, it } from 'vitest';

import { TARGETS } from '../../../scripts/generate-consumer-catalog/config';
import { buildCatalog } from '../../../scripts/generate-consumer-catalog/generate';
import { evidenceIdsOf } from '../../../scripts/generate-consumer-catalog/schema';
import { loadDataset } from '../runner/dataset';
import { parseEvidenceId } from '../runner/evidence';

/**
 * Command 01의 gold evidence와 Command 02의 생성 카탈로그를 맞춰본다.
 * 존재하지 않는 API를 정답으로 삼는 dataset drift를 결정적으로 잡는다.
 */

const catalogIds = new Set([
  ...evidenceIdsOf(await buildCatalog(TARGETS['react-ui'])),
  ...evidenceIdsOf(await buildCatalog(TARGETS['react-native-ui'])),
]);

const tasks = [...(await loadDataset('dev')), ...(await loadDataset('test'))];

/** token/doc evidence는 카탈로그 소관이 아니다 (tokens.json / 문서). */
const apiEvidence = tasks.flatMap((task) =>
  task.expected.requiredEvidence
    .filter((id) => !['token', 'doc'].includes(parseEvidenceId(id)?.kind ?? ''))
    .map((id) => ({ taskId: task.taskId, id })),
);

describe('dataset gold evidence vs generated catalog', () => {
  it('checks a meaningful number of api evidence ids', () => {
    expect(apiEvidence.length).toBeGreaterThan(30);
  });

  it('never expects an API that the public catalog does not contain', () => {
    const unknown = apiEvidence.filter(({ id }) => !catalogIds.has(id));
    expect(unknown).toEqual([]);
  });

  it('does not expect components the catalog marks as absent', () => {
    for (const task of tasks) {
      for (const component of task.expected.forbiddenComponents) {
        for (const pkg of task.expected.packages) {
          expect(catalogIds.has(`component:${pkg}#${component}`)).toBe(false);
        }
      }
    }
  });
});
