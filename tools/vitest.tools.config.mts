import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// 이름을 `vitest.config.*`로 두면 @nx/vitest plugin이 새 project를 추론한다.
// tools/는 아직 별도 Nx project가 아니므로 다른 이름을 쓴다.
export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
  },
});
