import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@berrypjh/observability-contracts',
    watch: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: ['default'],
  },
});
