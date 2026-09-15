import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: resolve(__dirname, '../../node_modules/.vite/libs/ui-core'),
  plugins: [
    dts({
      entryRoot: resolve(__dirname, 'src'),
      tsconfigPath: resolve(__dirname, 'tsconfig.lib.json'),
      outDir: resolve(__dirname, 'dist'),
      rollupTypes: true,
      bundledPackages: ['@berrypjh/design-tokens'],
    }),
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        tailwind: resolve(__dirname, 'src/tailwind.ts'),
      },
      name: '@berrypjh/ui-core',
      formats: ['es' as const],
    },
    rolldownOptions: {
      external: ['tailwindcss'],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
}));
