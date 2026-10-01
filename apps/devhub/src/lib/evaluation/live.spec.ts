// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LIVE_MAX_TURNS, LIVE_PROVIDERS } from './live';

const LIVE = join(import.meta.dirname, '../../../../../tools/evals/consumer/runner/live');
const source = (file: string) => readFileSync(join(LIVE, file), 'utf8');

/** `providers.ts` 의 제공자 블록 하나에서 값 하나를 읽는다. */
const providerField = (id: string, field: string) => {
  const block = new RegExp(`\\n  ${id}: \\{([^}]+)\\}`).exec(source('providers.ts'))?.[1] ?? '';
  return new RegExp(`${field}: ([^,\\n]+),`).exec(block)?.[1];
};

describe('live 평가 제공자', () => {
  it.each(LIVE_PROVIDERS)('옮겨 적은 $id 제공자 값이 도구의 원본과 같다', (provider) => {
    expect(providerField(provider.id, 'keyEnv')).toBe(
      provider.keyEnv ? `'${provider.keyEnv}'` : 'null',
    );
    expect(providerField(provider.id, 'contextLimit')?.replace(/_/g, '')).toBe(
      String(provider.contextLimit),
    );
  });

  it('턴 상한이 도구의 원본과 같다', () => {
    expect(/export const DEFAULT_MAX_TURNS = (\d+);/.exec(source('executor.ts'))?.[1]).toBe(
      String(LIVE_MAX_TURNS),
    );
  });
});
