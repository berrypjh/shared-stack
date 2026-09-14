import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTokenOutputs } from './lib/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

buildTokenOutputs({
  tokensDir: path.join(ROOT, 'tokens'),
  distDir: path.join(ROOT, 'dist'),
  generatedDir: path.join(ROOT, 'src', '.generated'),
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
